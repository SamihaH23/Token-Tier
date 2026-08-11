import * as diff from 'diff';

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export function computeTextDiff(oldText: string, newText: string): DiffPart[] {
  // Use word-level diffing for precise word comparisons between tiers
  const diffParts = diff.diffWordsWithSpace(oldText, newText);
  return diffParts.map((part) => ({
    value: part.value,
    added: part.added,
    removed: part.removed,
  }));
}

export function computeLineDiff(oldText: string, newText: string): DiffPart[] {
  const diffParts = diff.diffLines(oldText, newText);
  return diffParts.map((part) => ({
    value: part.value,
    added: part.added,
    removed: part.removed,
  }));
}

export interface DiffStats {
  wordsAdded: number;
  wordsRemoved: number;
  unchangedWords: number;
}

export function getDiffStats(diffParts: DiffPart[]): DiffStats {
  let wordsAdded = 0;
  let wordsRemoved = 0;
  let unchangedWords = 0;

  diffParts.forEach((part) => {
    const wordCount = part.value.trim().split(/\s+/).filter(Boolean).length;
    if (part.added) {
      wordsAdded += wordCount;
    } else if (part.removed) {
      wordsRemoved += wordCount;
    } else {
      unchangedWords += wordCount;
    }
  });

  return { wordsAdded, wordsRemoved, unchangedWords };
}
