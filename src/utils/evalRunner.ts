import { ModelPricing, Tier } from '../types/prompt';
import { getPromptById, getPromptIdForTier, getTask, MeasuredStats } from '../data/selectors';
import { fillTemplate, getTestCases, TestCase } from '../data/testCases';
import { CompletionResult } from './providers';
import { median, scoreOutput } from './scorers';

export type Complete = (model: ModelPricing, prompt: string, signal: AbortSignal) => Promise<CompletionResult>;

export interface EvalJob {
  promptId: string;
  taskId: string;
  tier: Tier;
  testCase: TestCase;
}

export interface EvalRunRecord extends EvalJob {
  output: string;
  score: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  error?: string;
}

export function planJobs(taskIds: string[], tiers: Tier[]): EvalJob[] {
  return taskIds.flatMap((taskId) =>
    tiers.flatMap((tier) => {
      const promptId = getPromptIdForTier(getTask(taskId), tier);
      return getTestCases(taskId).map((testCase) => ({ promptId, taskId, tier, testCase }));
    })
  );
}

export function countJudgeCalls(jobs: EvalJob[]): number {
  return jobs.filter((j) => j.testCase.check.type === 'llm_judge').length;
}

/** Run jobs with a concurrency limit. Failed calls are recorded with an error, not thrown. */
export async function runJobs(opts: {
  jobs: EvalJob[];
  model: ModelPricing;
  judgeModel: ModelPricing;
  complete: Complete;
  concurrency: number;
  signal: AbortSignal;
  onRecord: (r: EvalRunRecord, done: number) => void;
}): Promise<EvalRunRecord[]> {
  const { jobs, model, judgeModel, complete, signal, onRecord } = opts;
  const records: EvalRunRecord[] = [];
  let next = 0;

  const judge = async (prompt: string) => (await complete(judgeModel, prompt, signal)).text;

  const worker = async () => {
    while (next < jobs.length && !signal.aborted) {
      const job = jobs[next++];
      const prompt = fillTemplate(getPromptById(job.promptId).prompt_text, job.testCase.input);
      let record: EvalRunRecord;
      try {
        const res = await complete(model, prompt, signal);
        const score = await scoreOutput(job.testCase.check, job.testCase.input, res.text, judge);
        record = { ...job, output: res.text, score, latencyMs: res.latencyMs, inputTokens: res.inputTokens, outputTokens: res.outputTokens };
      } catch (err) {
        if (signal.aborted) break;
        record = { ...job, output: '', score: 0, latencyMs: 0, inputTokens: 0, outputTokens: 0, error: (err as Error).message };
      }
      records.push(record);
      onRecord(record, records.length);
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, opts.concurrency) }, worker));
  return records;
}

/** Aggregate successful runs per prompt. Prompts where every run failed are left out. */
export function summarize(records: EvalRunRecord[], modelId: string): MeasuredStats[] {
  const byPrompt = new Map<string, EvalRunRecord[]>();
  for (const r of records) {
    if (r.error) continue;
    byPrompt.set(r.promptId, [...(byPrompt.get(r.promptId) ?? []), r]);
  }
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const now = new Date().toISOString();
  return [...byPrompt.entries()].map(([promptId, rs]) => ({
    promptId,
    modelId,
    runs: rs.length,
    avgScore: avg(rs.map((r) => r.score)),
    p50LatencyMs: median(rs.map((r) => r.latencyMs)),
    avgInputTokens: avg(rs.map((r) => r.inputTokens)),
    avgOutputTokens: avg(rs.map((r) => r.outputTokens)),
    measuredAt: now,
  }));
}
