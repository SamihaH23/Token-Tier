import { Tier } from '../types/prompt';
import { TIER_MAX_TOKENS } from '../utils/tokenizer';

export interface TierTheme {
  name: string;
  emoji: string;
  tagline: string;
  color: string;
  soft: string; // translucent background
  glow: string; // shadow colour
  gradient: string;
  budget: string;
}

export const TIER_THEME: Record<Tier, TierTheme> = {
  bare: {
    name: 'Bare',
    emoji: '⚡',
    tagline: 'Lean & lightning fast',
    color: '#10b981',
    soft: 'rgba(16, 185, 129, 0.14)',
    glow: 'rgba(16, 185, 129, 0.45)',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    budget: `≤${TIER_MAX_TOKENS.bare} tokens`,
  },
  standard: {
    name: 'Standard',
    emoji: '⚖️',
    tagline: 'The sweet spot',
    color: '#60a5fa',
    soft: 'rgba(96, 165, 250, 0.14)',
    glow: 'rgba(99, 102, 241, 0.45)',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    budget: `≤${TIER_MAX_TOKENS.standard} tokens`,
  },
  robust: {
    name: 'Robust',
    emoji: '🛡️',
    tagline: 'Bulletproof output',
    color: '#f59e0b',
    soft: 'rgba(245, 158, 11, 0.14)',
    glow: 'rgba(236, 72, 153, 0.4)',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
    budget: `≤${TIER_MAX_TOKENS.robust} tokens`,
  },
};

/** CSS custom properties consumed by `.tier-card`. */
export const tierVars = (tier: Tier) =>
  ({ '--tier': TIER_THEME[tier].color, '--tier-glow': TIER_THEME[tier].glow }) as React.CSSProperties;
