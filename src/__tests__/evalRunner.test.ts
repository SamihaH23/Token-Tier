import { describe, expect, it } from 'vitest';
import { getModel } from '../data/models';
import { countJudgeCalls, planJobs, runJobs, summarize } from '../utils/evalRunner';
import { TIERS } from '../types/prompt';

const model = getModel('claude-haiku-5-5');

describe('evalRunner', () => {
  it('plans tiers × test cases', () => {
    const jobs = planJobs(['task-cls'], TIERS);
    expect(jobs).toHaveLength(15);
    expect(countJudgeCalls(jobs)).toBe(0);
    expect(countJudgeCalls(planJobs(['task-sum'], ['bare']))).toBe(5);
  });

  it('runs jobs, records errors, and summarizes per prompt', async () => {
    const jobs = planJobs(['task-rt'], ['standard']);
    let calls = 0;
    const records = await runJobs({
      jobs,
      model,
      judgeModel: model,
      concurrency: 2,
      signal: new AbortController().signal,
      complete: async (_m, prompt) => {
        calls++;
        if (prompt.includes('reset email never arrived')) throw new Error('boom');
        const label = prompt.includes('500 errors') ? 'TIER2_ENG' : 'BILLING';
        return { text: label, inputTokens: 60, outputTokens: 3, latencyMs: 100 + calls };
      },
      onRecord: () => {},
    });

    expect(records).toHaveLength(5);
    expect(records.filter((r) => r.error)).toHaveLength(1);

    const [stats] = summarize(records, model.id);
    expect(stats.runs).toBe(4);
    // rt-1 TIER2_ENG ✓, rt-2 BILLING ✓, rt-3 expects SALES ✗, rt-5 BILLING ✓
    expect(stats.avgScore).toBe(75);
    expect(stats.avgOutputTokens).toBe(3);
  });

  it('stops when aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const records = await runJobs({
      jobs: planJobs(['task-cls'], TIERS),
      model,
      judgeModel: model,
      concurrency: 3,
      signal: controller.signal,
      complete: async () => ({ text: 'x', inputTokens: 1, outputTokens: 1, latencyMs: 1 }),
      onRecord: () => {},
    });
    expect(records).toHaveLength(0);
  });
});
