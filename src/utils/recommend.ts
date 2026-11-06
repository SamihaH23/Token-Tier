import { PromptView, Tier, TIERS } from '../types/prompt';

/** Cheapest tier whose quality meets the bar; null if none does. */
export function pickBestTier(prompts: Record<Tier, PromptView>, bar: number): Tier | null {
  const ok = TIERS.filter((t) => prompts[t].quality_score >= bar);
  if (ok.length === 0) return null;
  return ok.reduce((best, t) => (prompts[t].cost_per_1k_calls < prompts[best].cost_per_1k_calls ? t : best));
}
