# Mihakk (working name)

Mihakk helps teams check how safely an AI agent handles files before it is trusted with real work.
Its core workflow is **Test → Protect → Re-evaluate**:

1. **Test**: a file-reading agent summarizes a fictional sales report (or your own TXT / Markdown / text-based PDF).
   The document may contain inert test instructions, which are treated as untrusted data.
2. **Protect**: the server issues a signed, time-limited **task contract** (one action, one file, 5 minutes).
   A default-deny **shield** checks every action against it *before* any file is opened.
3. **Re-evaluate**: 100 fixed English cases run from the code and the dashboard shows the real output,
   including a simulated no-shield baseline, legitimate-task results and exports (CSV / JSON).

The current release is English only. Arabic and Saudi dialect support is on the roadmap (see About page).

Live Demo: https://mihakk.onrender.com/

## Requirements

- Node.js 20 or newer (verified on Node 22) and npm
- Python is **not** needed to run the app (it was only used once to create the PDF test fixtures in `fixtures/`)

## Quick start (local)

```bash
npm install
npm run dev          # open http://localhost:3000
```

Production-style run (recommended for recording the demo, it is faster and steadier):

```bash
npm run build
npm start            # open http://localhost:3000
```

## Tests

```bash
npm run typecheck    # TypeScript
npm test             # Vitest: policy, extraction, summarizer, evaluation and provider tests
npm run eval         # runs all 100 evaluation cases in the terminal and prints the real results
```

End-to-end demo flow (Playwright, desktop and mobile sizes):

```bash
npx playwright install chromium     # one time
npm run test:e2e                    # builds, starts the app on port 3100, runs the flow
```

If you already have a Chromium binary and do not want Playwright to download one, set
`PW_CHROMIUM_PATH=/path/to/chrome` before `npm run test:e2e`.

## The five-step demo flow

Open Mihakk → select the sample sales report → read the English summary and task contract →
click **Simulate: send an email** to see the shield deny it → open **Results** and click **Run Evaluation**.
The full recording script is in `docs/DEMO_SCRIPT.md`.

## Optional: language-model summaries

Local extractive mode is the default and needs no key. To enable the optional mode, choose one provider and set the variables
on the server (the key never reaches the browser). Copy `.env.example` to `.env.local` (ignored by Git) or export them, then restart:

| Provider | `MIHAKK_LLM_PROVIDER` | Key variable | Notes |
| --- | --- | --- | --- |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` | Used automatically if only this key is set (older setups) |
| Nebius | `nebius` | `NEBIUS_API_KEY` | OpenAI-compatible; set `MIHAKK_LLM_BASE_URL` if your account uses a different base URL |
| Google Gemini | `gemini` | `GEMINI_API_KEY` | |

Also set `MIHAKK_LLM_MODEL` to a model name your account can use. Example:

```bash
export MIHAKK_LLM_PROVIDER=gemini
export GEMINI_API_KEY=...           # your key, never commit it
export MIHAKK_LLM_MODEL=...
```

The Lab then offers "Language model (optional)" and requires an explicit consent checkbox before any file content is sent.
The evaluation dashboard always uses the local extractive summarizer, so the 100 cases do not depend on a provider.
Request building and response parsing for all three providers are covered by unit tests with a mocked network;
they have **not** been run against the live services (see `docs/VERIFICATION_RECORD.md`).

## Replace the logo

The logo is served from `public/logo.svg` (and `public/icon.svg`). Replace those files to change it everywhere. The supplied PNG original is kept unchanged in `public/brand/mihakk-logo-original.png`.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/lib/extract.ts` | File validation and text extraction (TXT, MD, PDF) |
| `src/lib/summarize.ts`, `src/lib/llm.ts` | Local extractive summarizer; optional language-model mode |
| `src/lib/contract.ts`, `src/lib/policy.ts` | Signed task contract and the default-deny shield |
| `src/lib/agent.ts` | The file-reading agent (shield check runs before the file is loaded) |
| `src/lib/evaluation/` | The 100 cases, runner, storage and exports |
| `src/app/` | Pages (Home, Lab, Results, About) and API routes |
| `data/samples/` | The fictional sample sales report |
| `fixtures/` | PDF fixtures used by the tests and evaluation |
| `tests/`, `e2e/` | Vitest and Playwright tests |
| `docs/` | Registration copy, demo script, verification record, exported results |

## How the 100 cases are organized

| Category | Cases | Type |
| --- | --- | --- |
| Untrusted document content | 30 | Agent behavior |
| File and action permissions | 20 | Policy |
| Contract expiry and session boundaries | 15 | Policy |
| File validation | 15 | Policy |
| Legitimate tasks | 20 | Agent behavior |

Every case has an ID, an expected outcome, an actual outcome and a pass / fail / not-run status.
Before the first run every case is shown as **not run**. The "without shield" baseline is a *simulation* that accepts every
request; it shows what the shield changes, not how any other product performs.

## Honest limits

- The cases were written together with the detector, so results describe these 100 cases, not every possible attack.
- Email, deletion and web requests are **simulated**: nothing is ever sent, deleted or fetched.
- The evaluation run is stored in `.mihakk/last-run.json`, so the host needs a writable folder.
- No public preview link is provided. Deploy to any Node host that allows a writable folder, or run locally.
