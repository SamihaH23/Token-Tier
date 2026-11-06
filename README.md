# TokenTier

A prompt library ranked by **quality per token**. Every task has three prompts at different token budgets, so you can pick the cheapest prompt that still meets your quality bar.

| Tier     | Prompt budget | Typical use                                  |
| -------- | ------------- | -------------------------------------------- |
| Bare     | ≤ 30 tokens   | High-volume pipelines, simple tasks          |
| Standard | 31–100 tokens | Most production traffic                      |
| Robust   | 101–300 tokens | Strict schemas, output parsed by code       |

## Features

- **Compare Tiers**: the three prompts for a task side by side, with tokens, quality, cost and latency.
- **Library**: search, filter and sort all prompts by efficiency (quality ÷ tokens × 10).
- **Diff**: word-level diff between any two tiers of a task.
- **Cost**: monthly and annual spend per tier and model at your call volume.
- **Downgrader**: paste any prompt to see detected "ceremony" (persona priming, politeness, "step by step", format reminders) and rule-based Standard and Bare rewrites.
- **Live Eval**: run every tier against real test inputs with your own API key and replace the seed numbers with measured ones.

Every view has a shareable URL (for example `#/compare?task=task-sql`).

## Where the numbers come from

- **Token counts** are computed from the prompt text with the `o200k_base` tokenizer ([js-tiktoken](https://github.com/dqbd/tiktoken)). They're exact for current OpenAI models and approximate for Claude and Gemini, which use their own tokenizers. Live Eval records each provider's reported usage.
- **Cost** = prompt tokens × input price + output tokens × output price, using [src/data/models.ts](src/data/models.ts) (list prices checked 2026-11-07; prices change, so re-check them). Output tokens default to 50 per call, or the measured average once you've run an eval.
- **Quality and latency** start as hand-estimated *seed* values, marked `seed` in the UI. After a Live Eval run they show as `measured`.

## Live Eval and API keys

Live Eval calls the provider APIs directly from your browser:

- **Anthropic**: official SDK (`dangerouslyAllowBrowser`), `effort: low`
- **OpenAI**: Responses API
- **Google**: Gemini `generateContent`
- **DeepSeek**: chat completions (may fail if their API blocks browser requests)

Keys are stored in `sessionStorage` (cleared when the tab closes) unless you tick *Remember on this device*, which moves them to `localStorage`. They're sent only to the provider you choose. **Runs bill your account.** The page shows a rough cost estimate before you start.

How outputs are scored ([src/data/testCases.ts](src/data/testCases.ts), [src/utils/scorers.ts](src/utils/scorers.ts)):

- **Classification and routing**: the expected label must appear and no conflicting label may appear. Text in reasoning fields is ignored.
- **Extraction and address cleaning**: the output must contain JSON, and the score is the share of expected values found in it.
- **SQL**: the share of required patterns (for example `COUNT(`, `GROUP BY status`) that match.
- **Summarisation, code review and rewrites**: a judge model grades the output 0–100 against a rubric.

Results are saved in your browser and can be exported and imported as JSON.

## Development

```bash
npm install
npm run dev        # http://localhost:3001
npm test           # vitest
npm run lint       # eslint
npm run typecheck  # tsc
npm run build      # production build (base path /Token-Tier/)
```

## Deploying

Pushing to `main` runs typecheck, lint, tests and build, then deploys to GitHub Pages ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)). One-time setup: in the repo, go to **Settings → Pages → Source** and choose **GitHub Actions**. Pull requests run the same checks without deploying ([ci.yml](.github/workflows/ci.yml)).

If you rename the repo, update `base` in [vite.config.ts](vite.config.ts).
