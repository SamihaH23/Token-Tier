import { beforeAll, describe, expect, it } from 'vitest';
import {
  calculateEfficiencyScore,
  estimateTokenCount,
  getTierFromTokenCount,
  heuristicTokenCount,
  isTokenizerReady,
  loadTokenizer,
} from '../utils/tokenizer';

describe('tokenizer', () => {
  it('falls back to the heuristic before the encoder loads', () => {
    expect(heuristicTokenCount('')).toBe(0);
    expect(heuristicTokenCount('hello world')).toBeGreaterThan(0);
  });

  describe('with o200k loaded', () => {
    beforeAll(async () => {
      await loadTokenizer();
    });

    it('loads', () => expect(isTokenizerReady()).toBe(true));

    it('counts real BPE tokens', () => {
      expect(estimateTokenCount('')).toBe(0);
      expect(estimateTokenCount('hello')).toBe(1);
      expect(estimateTokenCount('Hello, world!')).toBe(4);
    });
  });

  it('maps token counts to tiers', () => {
    expect(getTierFromTokenCount(30)).toBe('bare');
    expect(getTierFromTokenCount(31)).toBe('standard');
    expect(getTierFromTokenCount(100)).toBe('standard');
    expect(getTierFromTokenCount(101)).toBe('robust');
  });

  it('computes efficiency', () => {
    expect(calculateEfficiencyScore(90, 30)).toBe(30);
    expect(calculateEfficiencyScore(90, 0)).toBe(0);
  });
});
