import { beforeAll, describe, expect, it } from 'vitest';
import { PROMPTS, TASK_GROUPS } from '../data/prompts';
import { SUPPORTED_MODELS } from '../data/models';
import { fillTemplate, getTestCases } from '../data/testCases';
import { buildPromptView, getPromptById } from '../data/selectors';
import { loadTokenizer, TIER_MAX_TOKENS } from '../utils/tokenizer';
import { costPer1kCalls, projectCost } from '../utils/cost';
import { computeTextDiff, getDiffStats } from '../utils/diffHelper';
import { formatHash, parseHash } from '../hooks/useHashRoute';

beforeAll(async () => {
  await loadTokenizer();
});

describe('library data', () => {
  it('every prompt uses a known model and has one placeholder', () => {
    for (const p of PROMPTS) {
      expect(SUPPORTED_MODELS.map((m) => m.id)).toContain(p.model_tested);
      expect(p.prompt_text.match(/\{\{\s*\w+\s*\}\}/g)?.length, p.id).toBe(1);
    }
  });

  it('every task links to existing prompts of the right tier', () => {
    for (const t of TASK_GROUPS) {
      expect(getPromptById(t.bare_prompt_id).tier).toBe('bare');
      expect(getPromptById(t.standard_prompt_id).tier).toBe('standard');
      expect(getPromptById(t.robust_prompt_id).tier).toBe('robust');
    }
  });

  it('every prompt fits its tier budget', () => {
    for (const p of PROMPTS) {
      expect(buildPromptView(p).token_count, p.id).toBeLessThanOrEqual(TIER_MAX_TOKENS[p.tier]);
    }
  });

  it('every task has test cases', () => {
    for (const t of TASK_GROUPS) expect(getTestCases(t.id).length, t.id).toBeGreaterThanOrEqual(5);
  });

  it('fills templates', () => {
    expect(fillTemplate('A:\n{{ text }}', 'hi')).toBe('A:\nhi');
    expect(fillTemplate('$& {{x}}', '$1')).toBe('$& $1');
  });
});

describe('buildPromptView', () => {
  it('uses seed values without measurements', () => {
    const v = buildPromptView(PROMPTS[0]);
    expect(v.source).toBe('seed');
    expect(v.quality_score).toBe(PROMPTS[0].seed_quality_score);
  });
  it('uses measured values when present', () => {
    const p = PROMPTS[0];
    const v = buildPromptView(p, {
      promptId: p.id,
      modelId: p.model_tested,
      runs: 5,
      avgScore: 91.6,
      p50LatencyMs: 410,
      avgInputTokens: 80,
      avgOutputTokens: 120,
      measuredAt: '2026-11-07T00:00:00Z',
    });
    expect(v).toMatchObject({ source: 'measured', quality_score: 92, latency_p50_ms: 410, avg_output_tokens: 120, runs: 5 });
  });
});

describe('cost', () => {
  const model = { id: 'x', name: 'X', provider: 'OpenAI' as const, input_cost_per_1m: 1, output_cost_per_1m: 4, avg_latency_ms: 0 };
  it('computes per-1k and projections', () => {
    expect(costPer1kCalls(100, 50, model)).toBeCloseTo(0.3);
    const p = projectCost(100, 50, model, 1_000_000);
    expect(p.dailyCost).toBeCloseTo(300);
    expect(p.annualCost).toBeCloseTo(300 * 365);
    expect(p.monthlyCost * 12).toBeCloseTo(p.annualCost);
  });
});

describe('diffHelper', () => {
  it('counts added and removed words', () => {
    const stats = getDiffStats(computeTextDiff('a b c', 'a x c d'));
    expect(stats).toEqual({ wordsAdded: 2, wordsRemoved: 1, unchangedWords: 2 });
  });
});

describe('hash routes', () => {
  it('round-trips', () => {
    const hash = formatHash('diff', { task: 'task-sum', a: 'bare', b: undefined });
    expect(hash).toBe('#/diff?task=task-sum&a=bare');
    expect(parseHash(hash)).toEqual({ name: 'diff', params: { task: 'task-sum', a: 'bare' } });
  });
  it('falls back to compare', () => {
    expect(parseHash('').name).toBe('compare');
    expect(parseHash('#/nope').name).toBe('compare');
  });
});
