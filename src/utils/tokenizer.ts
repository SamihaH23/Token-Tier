import type { Tiktoken } from 'js-tiktoken/lite';
import { Tier } from '../types/prompt';

/**
 * Token counting.
 *
 * Uses the o200k_base BPE encoding (js-tiktoken). The ~2MB rank table is
 * lazy-loaded so the first page render stays fast; until it arrives we fall
 * back to a character/word heuristic. Claude and Gemini use their own
 * tokenizers, so counts are an approximation for those models — Live Eval
 * reports exact provider-side usage.
 */

let encoder: Tiktoken | null = null;
let loading: Promise<void> | null = null;
let version = 0;
const listeners = new Set<() => void>();

export function loadTokenizer(): Promise<void> {
  if (encoder) return Promise.resolve();
  if (!loading) {
    loading = Promise.all([import('js-tiktoken/lite'), import('js-tiktoken/ranks/o200k_base')])
      .then(([{ Tiktoken }, ranks]) => {
        encoder = new Tiktoken(ranks.default);
        version++;
        listeners.forEach((l) => l());
      })
      .catch((err) => {
        loading = null;
        console.warn('Tokenizer failed to load; using heuristic counts.', err);
      });
  }
  return loading;
}

/** For useSyncExternalStore: bumps once the real tokenizer is ready. */
export function subscribeTokenizer(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getTokenizerVersion(): number {
  return version;
}
export function isTokenizerReady(): boolean {
  return encoder !== null;
}

export function heuristicTokenCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const wordCount = trimmed.split(/\s+/).length;
  const punctuationCount = (trimmed.match(/[{}[\]()<>=:;,."'-]/g) || []).length;
  return Math.max(
    1,
    Math.ceil((trimmed.length / 4) * 0.5 + wordCount * 1.25 * 0.35 + punctuationCount * 0.5 * 0.15)
  );
}

export function estimateTokenCount(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  if (encoder) return encoder.encode(text).length;
  return heuristicTokenCount(text);
}

/** Tier budgets: Bare ≤ 30, Standard 31–100, Robust > 100 tokens. */
export const TIER_MAX_TOKENS: Record<Tier, number> = { bare: 30, standard: 100, robust: 300 };

export function getTierFromTokenCount(tokenCount: number): Tier {
  if (tokenCount <= TIER_MAX_TOKENS.bare) return 'bare';
  if (tokenCount <= TIER_MAX_TOKENS.standard) return 'standard';
  return 'robust';
}

/** Quality per token, scaled ×10 for readability. */
export function calculateEfficiencyScore(qualityScore: number, tokenCount: number): number {
  if (tokenCount <= 0) return 0;
  return Number(((qualityScore / tokenCount) * 10).toFixed(2));
}
