import { Check } from '../data/testCases';

/** Lowercase and strip everything but letters/digits, so "+1 (415) 555-0142" ≈ "4155550142". */
export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9@]/g, '');
}

/** Pull the first JSON object out of model output (handles ```json fences and surrounding prose). */
export function extractJson(output: string): unknown | null {
  const fenced = output.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [fenced?.[1], output];
  for (const c of candidates) {
    if (!c) continue;
    const start = c.indexOf('{');
    const end = c.lastIndexOf('}');
    if (start === -1 || end <= start) continue;
    try {
      return JSON.parse(c.slice(start, end + 1));
    } catch {
      // try next candidate
    }
  }
  return null;
}

const REASON_KEY = /reason|explanation|justification/i;

function collectValues(x: unknown, out: string[] = [], skipReasons = false): string[] {
  if (x === null || x === undefined) return out;
  if (typeof x === 'object') {
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
      if (!(skipReasons && REASON_KEY.test(k))) collectValues(v, out, skipReasons);
    }
  } else {
    out.push(String(x));
  }
  return out;
}

function hasLabel(output: string, label: string): boolean {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Z0-9_])${escaped}([^A-Z0-9_]|$)`, 'i').test(output);
}

/** Drop free-text reasoning so a label mentioned in an explanation doesn't count. */
function labelText(output: string): string {
  const json = extractJson(output);
  if (json && typeof json === 'object') return collectValues(json, [], true).join(' ');
  return output.replace(/^\s*(?:REASON|REASONING|EXPLANATION|JUSTIFICATION)\s*:.*$/gim, '');
}

export function scoreLabels(output: string, accept: string[], reject: string[] = []): number {
  const text = labelText(output);
  const ok = accept.some((l) => hasLabel(text, l));
  const bad = reject.some((l) => hasLabel(text, l));
  return ok && !bad ? 100 : 0;
}

export function scoreJsonContains(output: string, contains: string[]): number {
  const json = extractJson(output);
  if (json === null || typeof json !== 'object') return 0;
  const haystack = normalize(collectValues(json).join(' '));
  const hits = contains.filter((c) => haystack.includes(normalize(c))).length;
  return Math.round((hits / contains.length) * 100);
}

export function scoreRegex(output: string, patterns: string[]): number {
  const hits = patterns.filter((p) => new RegExp(p, 'i').test(output)).length;
  return Math.round((hits / patterns.length) * 100);
}

export function buildJudgePrompt(input: string, output: string, rubric: string): string {
  return [
    'You are grading an AI response. Score how well the RESPONSE meets the RUBRIC for the given INPUT.',
    'Reply with a single integer from 0 to 100 and nothing else.',
    '',
    `RUBRIC: ${rubric}`,
    '',
    `INPUT:\n${input}`,
    '',
    `RESPONSE:\n${output}`,
  ].join('\n');
}

export function parseJudgeScore(reply: string): number {
  const m = reply.match(/\d{1,3}/);
  if (!m) return 0;
  return Math.max(0, Math.min(100, Number(m[0])));
}

/** Score an output; `judge` is only called for llm_judge checks. */
export async function scoreOutput(
  check: Check,
  input: string,
  output: string,
  judge: (prompt: string) => Promise<string>
): Promise<number> {
  if (!output.trim()) return 0;
  switch (check.type) {
    case 'labels':
      return scoreLabels(output, check.accept, check.reject);
    case 'json_contains':
      return scoreJsonContains(output, check.contains);
    case 'regex':
      return scoreRegex(output, check.patterns);
    case 'llm_judge':
      return parseJudgeScore(await judge(buildJudgePrompt(input, output, check.rubric)));
  }
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
