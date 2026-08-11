import { ModelPricing } from '../types/prompt';

export const SUPPORTED_MODELS: ModelPricing[] = [
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    input_cost_per_1m: 3.00,
    output_cost_per_1m: 15.00,
    avg_latency_ms: 650,
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    input_cost_per_1m: 0.80,
    output_cost_per_1m: 4.00,
    avg_latency_ms: 220,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    input_cost_per_1m: 2.50,
    output_cost_per_1m: 10.00,
    avg_latency_ms: 520,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o-mini',
    provider: 'OpenAI',
    input_cost_per_1m: 0.15,
    output_cost_per_1m: 0.60,
    avg_latency_ms: 180,
  },
  {
    id: 'gemini-1-5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    input_cost_per_1m: 0.075,
    output_cost_per_1m: 0.30,
    avg_latency_ms: 190,
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    input_cost_per_1m: 0.14,
    output_cost_per_1m: 0.28,
    avg_latency_ms: 290,
  },
];
