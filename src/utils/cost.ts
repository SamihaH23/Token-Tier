import { ModelPricing } from '../types/prompt';

export const DEFAULT_OUTPUT_TOKENS = 50;
export const DAYS_PER_MONTH = 365 / 12;

/** USD cost of a single call. */
export function costPerCall(inputTokens: number, outputTokens: number, model: ModelPricing): number {
  return (inputTokens * model.input_cost_per_1m + outputTokens * model.output_cost_per_1m) / 1_000_000;
}

export function costPer1kCalls(inputTokens: number, outputTokens: number, model: ModelPricing): number {
  return costPerCall(inputTokens, outputTokens, model) * 1000;
}

export interface CostProjection {
  dailyCost: number;
  monthlyCost: number;
  annualCost: number;
}

export function projectCost(
  inputTokens: number,
  outputTokens: number,
  model: ModelPricing,
  callsPerDay: number
): CostProjection {
  const dailyCost = costPerCall(inputTokens, outputTokens, model) * callsPerDay;
  return { dailyCost, monthlyCost: dailyCost * DAYS_PER_MONTH, annualCost: dailyCost * 365 };
}
