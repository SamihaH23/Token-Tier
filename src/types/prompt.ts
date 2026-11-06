export type Tier = 'bare' | 'standard' | 'robust';

export const TIERS: Tier[] = ['bare', 'standard', 'robust'];

export type TaskCategory =
  | 'summarization'
  | 'classification'
  | 'extraction'
  | 'code_generation'
  | 'rewrite'
  | 'routing'
  | 'sql_generation'
  | 'data_cleaning';

/** Prompt as stored in the library. Token counts and cost are derived, never typed in. */
export interface Prompt {
  id: string;
  task_category: TaskCategory;
  tier: Tier;
  prompt_text: string;
  model_tested: string; // ModelPricing.id
  /** Seed values: hand-estimated until replaced by a Live Eval run. */
  seed_quality_score: number; // 0 - 100
  seed_latency_p50_ms: number;
  notes: string;
  ceremony_removed?: string[];
}

export type MetricSource = 'seed' | 'measured';

/** A prompt with every number the UI shows, computed from data + eval results. */
export interface PromptView extends Prompt {
  token_count: number; // prompt template tokens (o200k estimate)
  quality_score: number;
  latency_p50_ms: number;
  avg_output_tokens: number;
  cost_per_1k_calls: number; // USD per 1000 calls on model_tested
  source: MetricSource;
  runs?: number;
}

export interface TaskGroup {
  id: string;
  name: string;
  category: TaskCategory;
  description: string;
  use_case_example: string;
  bare_prompt_id: string;
  standard_prompt_id: string;
  robust_prompt_id: string;
}

export type Provider = 'Anthropic' | 'OpenAI' | 'Google' | 'DeepSeek';

export interface ModelPricing {
  id: string; // exact API model ID
  name: string;
  provider: Provider;
  input_cost_per_1m: number; // USD per 1M tokens
  output_cost_per_1m: number; // USD per 1M tokens
  /** Rough p50 latency estimate for short prompts; replaced by measurements where available. */
  avg_latency_ms: number;
}
