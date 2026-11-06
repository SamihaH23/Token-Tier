import Anthropic from '@anthropic-ai/sdk';
import { ModelPricing, Provider } from '../types/prompt';

export interface CompletionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

const MAX_OUTPUT_TOKENS = 4000;

async function postJson(url: string, headers: Record<string, string>, body: unknown, signal: AbortSignal) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message ?? data?.message ?? res.statusText;
    throw new Error(`${res.status}: ${msg}`);
  }
  return data;
}

async function runAnthropic(model: string, prompt: string, apiKey: string, signal: AbortSignal) {
  // The key stays in this browser tab and is sent only to api.anthropic.com.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
  const msg = await client.messages.create(
    {
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      // Short single-shot tasks: low effort keeps thinking (and cost) small.
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: prompt }],
    },
    { signal }
  );
  const text =
    msg.stop_reason === 'refusal'
      ? ''
      : msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  return { text, inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens };
}

async function runOpenAI(model: string, prompt: string, apiKey: string, signal: AbortSignal) {
  const data = await postJson(
    'https://api.openai.com/v1/responses',
    { authorization: `Bearer ${apiKey}` },
    { model, input: prompt, max_output_tokens: MAX_OUTPUT_TOKENS },
    signal
  );
  type Item = { type: string; content?: { type: string; text?: string }[] };
  const text = ((data.output ?? []) as Item[])
    .filter((o) => o.type === 'message')
    .flatMap((o) => o.content ?? [])
    .map((c) => (c.type === 'output_text' ? (c.text ?? '') : ''))
    .join('');
  return { text, inputTokens: data.usage?.input_tokens ?? 0, outputTokens: data.usage?.output_tokens ?? 0 };
}

async function runGoogle(model: string, prompt: string, apiKey: string, signal: AbortSignal) {
  const data = await postJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    { 'x-goog-api-key': apiKey },
    { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS } },
    signal
  );
  type Part = { text?: string };
  const parts: Part[] = data.candidates?.[0]?.content?.parts ?? [];
  const u = data.usageMetadata ?? {};
  return {
    text: parts.map((p) => p.text ?? '').join(''),
    inputTokens: u.promptTokenCount ?? 0,
    outputTokens: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
  };
}

async function runDeepSeek(model: string, prompt: string, apiKey: string, signal: AbortSignal) {
  const data = await postJson(
    'https://api.deepseek.com/chat/completions',
    { authorization: `Bearer ${apiKey}` },
    { model, messages: [{ role: 'user', content: prompt }], max_tokens: MAX_OUTPUT_TOKENS },
    signal
  );
  return {
    text: data.choices?.[0]?.message?.content ?? '',
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  };
}

const RUNNERS: Record<Provider, typeof runOpenAI> = {
  Anthropic: runAnthropic,
  OpenAI: runOpenAI,
  Google: runGoogle,
  DeepSeek: runDeepSeek,
};

export async function runCompletion(
  model: ModelPricing,
  prompt: string,
  apiKey: string,
  signal: AbortSignal
): Promise<CompletionResult> {
  const started = performance.now();
  try {
    const r = await RUNNERS[model.provider](model.id, prompt, apiKey, signal);
    return { ...r, latencyMs: Math.round(performance.now() - started) };
  } catch (err) {
    if (err instanceof TypeError && /fetch/i.test(err.message)) {
      throw new Error(`Network/CORS error calling ${model.provider}. Their API may not accept browser requests.`, { cause: err });
    }
    throw err;
  }
}
