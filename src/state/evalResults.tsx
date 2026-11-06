import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { PromptView } from '../types/prompt';
import { PROMPTS } from '../data/prompts';
import { buildPromptView, MeasuredStats, statsKey } from '../data/selectors';
import { getTokenizerVersion, loadTokenizer, subscribeTokenizer } from '../utils/tokenizer';

const STORAGE_KEY = 'tokentier.evalResults.v1';

type ResultsMap = Record<string, MeasuredStats>;

interface EvalContextValue {
  /** Every prompt with display numbers (measured where available, else seed). */
  views: Record<string, PromptView>;
  viewList: PromptView[];
  results: ResultsMap;
  recordStats: (stats: MeasuredStats[]) => void;
  clearResults: () => void;
  exportResults: () => string;
  importResults: (json: string) => number;
  tokenizerReady: boolean;
}

const EvalContext = createContext<EvalContextValue | null>(null);

function readStored(): ResultsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ResultsMap) : {};
  } catch {
    return {};
  }
}

function isStats(x: unknown): x is MeasuredStats {
  const s = x as MeasuredStats;
  return !!s && typeof s.promptId === 'string' && typeof s.modelId === 'string' && typeof s.avgScore === 'number';
}

/** Latest measurement for a prompt, on whichever model it was last run. */
function latestFor(results: ResultsMap, promptId: string): MeasuredStats | undefined {
  let best: MeasuredStats | undefined;
  for (const s of Object.values(results)) {
    if (s.promptId === promptId && (!best || s.measuredAt > best.measuredAt)) best = s;
  }
  return best;
}

export const EvalResultsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [results, setResults] = useState<ResultsMap>(readStored);
  const tokenizerVersion = useSyncExternalStore(subscribeTokenizer, getTokenizerVersion);

  useEffect(() => {
    void loadTokenizer();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch {
      // storage unavailable (private mode) — results stay in memory
    }
  }, [results]);

  const views = useMemo(() => {
    const out: Record<string, PromptView> = {};
    for (const p of PROMPTS) {
      const measured = latestFor(results, p.id);
      out[p.id] = buildPromptView(measured ? { ...p, model_tested: measured.modelId } : p, measured);
    }
    return out;
    // tokenizerVersion: recompute token counts once the real tokenizer loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, tokenizerVersion]);

  const recordStats = useCallback((stats: MeasuredStats[]) => {
    setResults((prev) => {
      const next = { ...prev };
      for (const s of stats) next[statsKey(s.promptId, s.modelId)] = s;
      return next;
    });
  }, []);

  const clearResults = useCallback(() => setResults({}), []);

  const exportResults = useCallback(() => JSON.stringify(Object.values(results), null, 2), [results]);

  const importResults = useCallback(
    (json: string) => {
      const parsed: unknown = JSON.parse(json);
      const list = (Array.isArray(parsed) ? parsed : Object.values(parsed as object)).filter(isStats);
      recordStats(list);
      return list.length;
    },
    [recordStats]
  );

  const value = useMemo<EvalContextValue>(
    () => ({
      views,
      viewList: PROMPTS.map((p) => views[p.id]),
      results,
      recordStats,
      clearResults,
      exportResults,
      importResults,
      tokenizerReady: tokenizerVersion > 0,
    }),
    [views, results, recordStats, clearResults, exportResults, importResults, tokenizerVersion]
  );

  return <EvalContext.Provider value={value}>{children}</EvalContext.Provider>;
};

export function useEvalResults(): EvalContextValue {
  const ctx = useContext(EvalContext);
  if (!ctx) throw new Error('useEvalResults must be used inside EvalResultsProvider');
  return ctx;
}
