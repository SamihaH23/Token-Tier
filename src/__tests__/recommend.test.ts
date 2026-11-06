import { describe, expect, it } from 'vitest';
import { pickBestTier } from '../utils/recommend';
import { PromptView, Tier } from '../types/prompt';

const view = (quality_score: number, cost_per_1k_calls: number) => ({ quality_score, cost_per_1k_calls }) as PromptView;
const prompts: Record<Tier, PromptView> = { bare: view(84, 0.01), standard: view(93, 0.02), robust: view(97, 0.05) };

describe('pickBestTier', () => {
  it('picks the cheapest tier that meets the bar', () => {
    expect(pickBestTier(prompts, 80)).toBe('bare');
    expect(pickBestTier(prompts, 90)).toBe('standard');
    expect(pickBestTier(prompts, 95)).toBe('robust');
  });
  it('returns null when nothing meets the bar', () => {
    expect(pickBestTier(prompts, 99)).toBeNull();
  });
});
