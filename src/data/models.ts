import { ModelPricing } from '../types/prompt';

/**
 * Standard (short-context) list prices in USD per 1M tokens, checked against
 * each provider's pricing page on PRICES_AS_OF. Prices change — re-check
 * before relying on them. Latencies are rough estimates; Live Eval measures them.
 */
export const PRICES_AS_OF = '2026-11-07';

export const SUPPORTED_MODELS: ModelPricing[] = [
  {
    id: 'claude-opus-5-5',
    name: 'Claude Opus 5.5',
    provider: 'Anthropic',
    input_cost_per_1m: 4.0,
    output_cost_per_1m: 20.0,
    avg_latency_ms: 1400,
  },
  {
    id: 'claude-sonnet-5-5',
    name: 'Claude Sonnet 5.5',
    provider: 'Anthropic',
    input_cost_per_1m: 2.0,
    output_cost_per_1m: 10.0,
    avg_latency_ms: 800,
  },
  {
    id: 'claude-haiku-5-5',
    name: 'Claude Haiku 5.5',
    provider: 'Anthropic',
    input_cost_per_1m: 0.1,
    output_cost_per_1m: 0.5,
    avg_latency_ms: 350,
  },
  {
    id: 'gpt-6.1-sol',
    name: 'GPT-6.1 Sol',
    provider: 'OpenAI',
    input_cost_per_1m: 2.0,
    output_cost_per_1m: 10.0,
    avg_latency_ms: 800,
  },
  {
    id: 'gpt-6.1-terra',
    name: 'GPT-6.1 Terra',
    provider: 'OpenAI',
    input_cost_per_1m: 1.0,
    output_cost_per_1m: 5.0,
    avg_latency_ms: 550,
  },
  {
    id: 'gpt-6-luna',
    name: 'GPT-6 Luna',
    provider: 'OpenAI',
    input_cost_per_1m: 0.1,
    output_cost_per_1m: 0.5,
    avg_latency_ms: 300,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Preview)',
    provider: 'Google',
    input_cost_per_1m: 2.0,
    output_cost_per_1m: 12.0,
    avg_latency_ms: 900,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'Google',
    input_cost_per_1m: 0.75, // introductory; $1.50 / $7.50 from 2027-01-01
    output_cost_per_1m: 3.75,
    avg_latency_ms: 400,
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    provider: 'Google',
    input_cost_per_1m: 0.3,
    output_cost_per_1m: 2.5,
    avg_latency_ms: 300,
  },
  {
    id: 'deepseek-flash',
    name: 'DeepSeek V4.1 Flash',
    provider: 'DeepSeek',
    input_cost_per_1m: 0.14, // cache-miss rate
    output_cost_per_1m: 0.28,
    avg_latency_ms: 500,
  },
];

export function getModel(id: string): ModelPricing {
  return SUPPORTED_MODELS.find((m) => m.id === id) ?? SUPPORTED_MODELS[0];
}
