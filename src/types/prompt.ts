export type Tier = 'bare' | 'standard' | 'robust';

export type TaskCategory =
  | 'summarization'
  | 'classification'
  | 'extraction'
  | 'code_generation'
  | 'rewrite'
  | 'routing'
  | 'sql_generation'
  | 'data_cleaning';

export interface Prompt {
  id: string;
  task_category: TaskCategory;
  tier: Tier;
  prompt_text: string;
  token_count: number;
  model_tested: string;
  quality_score: number; // 0 - 100
  cost_per_1k_calls: number; // USD per 1000 calls
  latency_p50_ms: number; // ms
  notes: string;
  ceremony_removed?: string[]; // filler words/phrases cut in this tier vs robust
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

export interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  input_cost_per_1m: number; // USD per 1M tokens
  output_cost_per_1m: number; // USD per 1M tokens
  avg_latency_ms: number;
}

export interface LibraryFilterOptions {
  searchQuery: string;
  category: TaskCategory | 'all';
  tier: Tier | 'all';
  model: string | 'all';
  minQuality: number;
  sortBy: 'efficiency' | 'quality' | 'tokens' | 'cost' | 'latency';
  sortOrder: 'asc' | 'desc';
}
