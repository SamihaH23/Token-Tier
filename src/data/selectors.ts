import { Prompt, PromptView, TaskGroup, Tier } from '../types/prompt';
import { PROMPTS, TASK_GROUPS } from './prompts';
import { getModel } from './models';
import { estimateTokenCount } from '../utils/tokenizer';
import { costPer1kCalls, DEFAULT_OUTPUT_TOKENS } from '../utils/cost';

/** Aggregated Live Eval results for one prompt on one model. */
export interface MeasuredStats {
  promptId: string;
  modelId: string;
  runs: number;
  avgScore: number; // 0-100
  p50LatencyMs: number;
  avgInputTokens: number; // provider-reported, includes test input
  avgOutputTokens: number;
  measuredAt: string; // ISO date
}

export function getTask(taskId: string | undefined): TaskGroup {
  return TASK_GROUPS.find((t) => t.id === taskId) ?? TASK_GROUPS[0];
}

export function getTaskForPrompt(promptId: string): TaskGroup | undefined {
  return TASK_GROUPS.find(
    (tg) => tg.bare_prompt_id === promptId || tg.standard_prompt_id === promptId || tg.robust_prompt_id === promptId
  );
}

export function getPromptIdForTier(task: TaskGroup, tier: Tier): string {
  if (tier === 'bare') return task.bare_prompt_id;
  if (tier === 'standard') return task.standard_prompt_id;
  return task.robust_prompt_id;
}

export function getPromptById(id: string): Prompt {
  const p = PROMPTS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown prompt id: ${id}`);
  return p;
}

/**
 * Combine stored prompt data, the tokenizer, model pricing and (optionally)
 * measured eval stats into the numbers the UI shows.
 */
export function buildPromptView(prompt: Prompt, measured?: MeasuredStats): PromptView {
  const token_count = estimateTokenCount(prompt.prompt_text);
  const model = getModel(prompt.model_tested);
  const avg_output_tokens = measured ? Math.round(measured.avgOutputTokens) : DEFAULT_OUTPUT_TOKENS;
  return {
    ...prompt,
    token_count,
    avg_output_tokens,
    quality_score: measured ? Math.round(measured.avgScore) : prompt.seed_quality_score,
    latency_p50_ms: measured ? Math.round(measured.p50LatencyMs) : prompt.seed_latency_p50_ms,
    cost_per_1k_calls: costPer1kCalls(token_count, avg_output_tokens, model),
    source: measured ? 'measured' : 'seed',
    runs: measured?.runs,
  };
}

export function statsKey(promptId: string, modelId: string): string {
  return `${promptId}::${modelId}`;
}
