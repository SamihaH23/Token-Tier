import { describe, expect, it, vi } from 'vitest';
import {
  extractJson,
  median,
  parseJudgeScore,
  scoreJsonContains,
  scoreLabels,
  scoreOutput,
  scoreRegex,
} from '../utils/scorers';

describe('scoreLabels', () => {
  it('accepts a matching label', () => {
    expect(scoreLabels('NEGATIVE', ['NEGATIVE'])).toBe(100);
    expect(scoreLabels('negative.', ['NEGATIVE'])).toBe(100);
  });
  it('rejects a contradicting label', () => {
    expect(scoreLabels('POSITIVE or NEGATIVE', ['NEGATIVE'], ['POSITIVE'])).toBe(0);
  });
  it('matches whole labels only', () => {
    expect(scoreLabels('TIER2_ENG', ['TIER1'])).toBe(0);
    expect(scoreLabels('QUEUE: TIER2_ENG', ['TIER2_ENG'])).toBe(100);
  });
  it('ignores labels mentioned in reasoning', () => {
    const json = '{"sentiment": "FURIOUS", "intent": "BILLING", "reasoning": "Not positive at all"}';
    expect(scoreLabels(json, ['FURIOUS'], ['POSITIVE'])).toBe(100);
    const lines = 'QUEUE: BILLING\nPRIORITY: P3_NORMAL\nREASON: not a SALES lead';
    expect(scoreLabels(lines, ['BILLING'], ['SALES'])).toBe(100);
  });
});

describe('JSON scoring', () => {
  it('extracts JSON from fences and prose', () => {
    expect(extractJson('Here:\n```json\n{"a": 1}\n```')).toEqual({ a: 1 });
    expect(extractJson('result {"a": {"b": 2}} done')).toEqual({ a: { b: 2 } });
    expect(extractJson('no json')).toBeNull();
  });
  it('scores share of expected values found, ignoring formatting', () => {
    const out = '{"name": "Priya Raman", "phone": "+1 (415) 555-0142", "email": null}';
    expect(scoreJsonContains(out, ['Priya Raman', '4155550142'])).toBe(100);
    expect(scoreJsonContains(out, ['Priya Raman', 'priya@x.com'])).toBe(50);
    expect(scoreJsonContains('Priya Raman', ['Priya Raman'])).toBe(0);
  });
});

describe('scoreRegex', () => {
  it('scores share of matching patterns', () => {
    expect(scoreRegex("SELECT COUNT(*) FROM users WHERE status = 'active';", ['\\bselect\\b', '\\blimit\\b'])).toBe(50);
  });
});

describe('judge', () => {
  it('parses and clamps the judge reply', () => {
    expect(parseJudgeScore('85')).toBe(85);
    expect(parseJudgeScore('Score: 140')).toBe(100);
    expect(parseJudgeScore('n/a')).toBe(0);
  });
  it('only calls the judge for llm_judge checks', async () => {
    const judge = vi.fn().mockResolvedValue('70');
    expect(await scoreOutput({ type: 'labels', accept: ['X'] }, 'in', 'X', judge)).toBe(100);
    expect(judge).not.toHaveBeenCalled();
    expect(await scoreOutput({ type: 'llm_judge', rubric: 'r' }, 'in', 'out', judge)).toBe(70);
    expect(judge).toHaveBeenCalledOnce();
  });
  it('scores empty output as 0', async () => {
    expect(await scoreOutput({ type: 'llm_judge', rubric: 'r' }, 'in', '  ', vi.fn())).toBe(0);
  });
});

describe('median', () => {
  it('handles odd, even and empty lists', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBe(0);
  });
});
