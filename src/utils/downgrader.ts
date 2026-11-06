/**
 * Rule-based prompt downgrader.
 *
 * Each rule removes or shortens one kind of "ceremony". Standard keeps the
 * instructions but drops filler; Bare also goes telegraphic. Rules never
 * touch {{placeholders}}.
 */

type DowngradeTier = 'standard' | 'bare';

interface Rule {
  id: string;
  label: string;
  pattern: RegExp; // must be global
  /** Replacement per tier; omit a tier to skip the rule for it. */
  replace: Partial<Record<DowngradeTier, string>>;
  /** Shown in the "ceremony detected" list for the input prompt. */
  ceremony?: boolean;
}

const FORMATS = 'JSON|Markdown|YAML|CSV|XML|HTML|SQL|bullet points?|a table';

export const RULES: Rule[] = [
  {
    id: 'persona',
    label: 'Persona priming ("You are a/an ...")',
    pattern: /\b(?:You are|You're|Act as|Acting as)\s+(?:an?|the)\b[^.\n]*(?:\.\s*|\n|$)/gi,
    replace: { standard: '', bare: '' },
    ceremony: true,
  },
  {
    id: 'task-framing',
    label: 'Task framing ("Your task is to ...")',
    pattern: /\b(?:Your (?:task|job|goal|role) is to|I (?:want|need|would like) you to|Can you|Could you)\s+/gi,
    replace: { standard: '', bare: '' },
    ceremony: true,
  },
  {
    id: 'politeness',
    label: 'Politeness ("Please", "kindly", "carefully")',
    pattern: /\b(?:please|kindly|carefully|thoroughly)\s+/gi,
    replace: { standard: '', bare: '' },
    ceremony: true,
  },
  {
    id: 'cot',
    label: 'Chain-of-thought cue ("step by step")',
    pattern: /,?\s*(?:and\s+)?(?:think\s+)?step[- ]by[- ]step\b/gi,
    replace: { standard: '', bare: '' },
    ceremony: true,
  },
  {
    id: 'emotional',
    label: 'Emotional priming ("take a deep breath", tips, stakes)',
    pattern:
      /\b(?:take a deep breath(?:\s+and)?[,.]?|this is (?:very |really )?important (?:to|for) (?:me|my career)[.!]?|I will tip [^.]*[.!]?)\s*/gi,
    replace: { standard: '', bare: '' },
    ceremony: true,
  },
  {
    id: 'no-preamble',
    label: 'Output disclaimer ("Do not include any preamble ...")',
    pattern:
      /\b(?:Do not|Don't|Never)\s+(?:include|add|write)\s+(?:any\s+)?(?:conversational\s+)?(?:preamble|pleasantries|commentary|explanations?|introductions?)[^.\n]*\.?/gi,
    replace: { standard: 'No preamble.', bare: '' },
    ceremony: true,
  },
  {
    id: 'format-reminder',
    label: 'Formatting reminder ("Make sure to output ... JSON")',
    pattern: new RegExp(
      `\\b(?:Make sure|Be sure|Ensure|Remember)\\s+(?:to|that you|you)\\s+[^.\\n]*?\\b(${FORMATS})\\b[^.\\n]*\\.?`,
      'gi'
    ),
    replace: { standard: 'Output $1.', bare: '$1 only.' },
    ceremony: true,
  },
  {
    id: 'format-generic',
    label: 'Generic formatting reminder ("Make sure to format ...")',
    pattern: /\b(?:Make sure|Be sure)\s+to\s+format[^.\n]*\.?/gi,
    replace: { standard: '', bare: '' },
    ceremony: true,
  },
  {
    id: 'in-order-to',
    label: 'Wordy connective ("in order to")',
    pattern: /\bin order to\b/gi,
    replace: { standard: 'to', bare: 'to' },
  },
  {
    id: 'intensifiers',
    label: 'Intensifiers ("very", "really", "extremely")',
    pattern: /\b(?:very|really|extremely|absolutely|basically|actually|clean,?)\s+/gi,
    replace: { bare: '' },
  },
  {
    id: 'deictic',
    label: 'Pointer phrases ("provided below", "incoming")',
    pattern: /\s+(?:provided|given|shown|included)\s+below\b|\b(?:incoming|following)\s+/gi,
    replace: { bare: '' },
  },
  {
    id: 'articles',
    label: 'Articles (telegraphic style)',
    pattern: /\b(?:the|a|an)\s+(?=[A-Za-z{])/gi,
    replace: { bare: '' },
  },
];

function tidy(text: string): string {
  return (
    text
      .split('\n')
      .map((line) => line.replace(/[ \t]{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^[.,;:\s]+/, '')
      // Capitalise the first letter of each sentence/line that lost its start.
      .replace(/(^|[.!?]\s+|\n)([a-z])/g, (_, pre: string, ch: string) => pre + ch.toUpperCase())
      .trim()
  );
}

export interface DowngradeResult {
  text: string;
  applied: string[]; // labels of rules that changed something
}

export function downgradePrompt(input: string, tier: DowngradeTier): DowngradeResult {
  let text = input;
  const applied: string[] = [];
  for (const rule of RULES) {
    const replacement = rule.replace[tier];
    if (replacement === undefined) continue;
    const next = text.replace(rule.pattern, replacement);
    if (next !== text) {
      applied.push(rule.label);
      text = next;
    }
  }
  const cleaned = tidy(text);
  // Never return an empty prompt: if everything was ceremony, keep the original.
  return cleaned ? { text: cleaned, applied } : { text: input.trim(), applied: [] };
}

/** Labels of ceremony patterns present in a prompt. */
export function detectCeremony(text: string): string[] {
  return RULES.filter((r) => r.ceremony && text.search(r.pattern) !== -1).map((r) => r.label);
}
