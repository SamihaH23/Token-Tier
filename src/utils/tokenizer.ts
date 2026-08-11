import { Tier } from '../types/prompt';

/**
 * Heuristic Tokenizer:
 * Estimates token count based on common subword tokenization patterns (GPT-4 / Claude tokenizers).
 * Approximately 1 token ≈ 4 characters or ~0.75 words, handling code symbols and punctuation.
 */
export function estimateTokenCount(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  
  // Clean whitespace
  const trimmed = text.trim();
  
  // Word count approach with adjustment for punctuation, JSON braces, linebreaks
  const wordCount = trimmed.split(/\s+/).length;
  const charCount = trimmed.length;
  const punctuationCount = (trimmed.match(/[{}[\]()<>=:;,."'-]/g) || []).length;
  
  // Blend char-based and word-based estimation
  const tokenEstimate = Math.ceil(
    (charCount / 4.0) * 0.5 + 
    (wordCount * 1.25) * 0.35 + 
    (punctuationCount * 0.5) * 0.15
  );

  return Math.max(1, tokenEstimate);
}

/**
 * Determines token budget tier based on count:
 * Bare: <= 30
 * Standard: 31 - 100
 * Robust: > 100
 */
export function getTierFromTokenCount(tokenCount: number): Tier {
  if (tokenCount <= 30) return 'bare';
  if (tokenCount <= 100) return 'standard';
  return 'robust';
}

/**
 * Calculates Quality per Token efficiency score:
 * (Quality Score / Token Count) * 10 for human-readable indexing
 */
export function calculateEfficiencyScore(qualityScore: number, tokenCount: number): number {
  if (tokenCount <= 0) return 0;
  return Number(((qualityScore / tokenCount) * 10).toFixed(2));
}

/**
 * Common fluff/ceremony phrases to detect in prompt engineering
 */
export const CEREMONY_PATTERNS = [
  { pattern: /you are an expert/i, label: 'Persona Priming ("You are an expert...")' },
  { pattern: /you are a senior/i, label: 'Persona Priming ("You are a senior...")' },
  { pattern: /helpful and harmless assistant/i, label: 'Assistant Disclaimer' },
  { pattern: /please carefully analyze/i, label: 'Polite Ceremony ("Please carefully...")' },
  { pattern: /step by step/i, label: 'Chain of Thought ("Step by step")' },
  { pattern: /take a deep breath/i, label: 'Emotional Priming' },
  { pattern: /do not include any conversational/i, label: 'Output Formatting Disclaimer' },
  { pattern: /make sure to format/i, label: 'Formatting Reminder' },
];

export function detectCeremony(text: string): string[] {
  const detected: string[] = [];
  CEREMONY_PATTERNS.forEach(({ pattern, label }) => {
    if (pattern.test(text)) {
      detected.push(label);
    }
  });
  return detected;
}
