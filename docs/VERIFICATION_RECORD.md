# Verification record

Environment: Linux sandbox, Node 22.23.4, npm 10.9.9, Chromium 1243 from the sandbox's preinstalled Playwright browsers (the Playwright download host was not reachable, so `PW_CHROMIUM_PATH` was used). Date of verification: 11 November 2026. Summarization mode used in every run: local extractive (no language model). The no-shield baseline is simulated.

## Passed

| What | How | Result |
| --- | --- | --- |
| Clean install | `npm ci` | Succeeded from `package-lock.json` |
| TypeScript | `npm run typecheck` | No errors (run before and after the fix below) |
| Unit tests | `npm test` (Vitest) | 25 of 25 tests passed (shield, contract, extraction, summarizer, 100-case set, repeatability, a deliberately broken shield that the cases catch, and 8 tests of the optional language-model providers with a mocked network) |
| 100 evaluation cases | `npm run eval`, and the Results page | 100 of 100 passed; policy 50 of 50; agent behavior 50 of 50; two runs gave identical outcomes |
| Disallowed requests | Same run | 60 total: simulated baseline accepted 60 of 60; shield accepted 0 of 60 |
| Legitimate tasks | Same run | 20 of 20 completed; 0 of 20 false blocks |
| Production build | `npm run build` | Succeeded |
| End-to-end flow, desktop (1280 x 800) and mobile (Pixel 5) | `npm run test:e2e`, 6 tests | 6 of 6 passed: Home, sample report, summary, contract, shield denial, Run Evaluation (started with the keyboard), dashboard numbers compared with the exported JSON, CSV export (header plus 100 rows), file messages (unsupported, empty, oversized, damaged, image-only PDF), text PDF, no horizontal scrolling on all four pages |
| Dashboard versus exported report | End-to-end test | Displayed pass count, baseline and shield counts, legitimate-task counts and category counts matched `docs/evaluation-results.json` |
| Visual check | I viewed the mobile Results page (headline numbers, before/after chart, category chart) before and after the fix, using fresh screenshots of all four pages at desktop and mobile size; the refreshed Results screenshots are in `docs/screenshots/` | Readable; status shown with icon and text; no horizontal scrolling on Home, Lab, Results or About at either size |
| Exports | `docs/evaluation-results.json` and `.csv` re-exported from the dashboard in this run | Same outcome for all 100 cases as the earlier run; only run id and timestamps differ |

## Failed

Nothing failed in the automated checks. One layout issue was found by eye on the mobile Results page: in the "Before and after" chart the first bar's label was dropped and its value label (60) was clipped. Fixed in `src/app/results/page.tsx` (all axis labels shown, more space above the bars, label shortened to "Simulated baseline"); typecheck, unit tests, eval, build and the six end-to-end tests were run again afterwards and passed. No evaluation case or expected outcome was changed. During development the first full run passed all 100 cases, so a mutation test was added: with an allow-everything shield, the cases fail (more than 40 failures), which shows the cases can fail.

## Not verified

| Item | Why |
| --- | --- |
| Optional language-model mode (Anthropic, Nebius, Google Gemini) | Request building, response parsing, key handling and error messages are unit-tested with a mocked network, and the Lab was checked to offer the option when a provider is configured (with fake values, no network call). No real key was available here, so no live request to any provider was made; the Nebius base URL and the model names are unconfirmed |
| Pushing to GitHub | No repository URL or credentials were provided in this run; the work is committed locally only |
| A public preview link | The sandbox cannot host a public site. Run locally (README) |
| Replit or other hosting | Not tried. Any Node host with a writable folder should work |
| Windows, macOS, Safari, Firefox | Only Linux and Chromium were tested |
| Second end-to-end run reused a running server | The last `npm run test:e2e` reused the server on port 3100 that I had rebuilt after the fix (`reuseExistingServer`); the first run built its own |
| Screen-reader testing and a formal accessibility audit | Keyboard activation was tested on one control, and status uses icons plus text, but no audit was done |
| Home, About and Lab pages by eye, and the desktop Results page in this run | Screenshots were taken and checked for horizontal overflow only (automated); I did not inspect them closely |
| PDFs from other producers | Only three PDFs made with one tool were used |
| Uploads larger than 10 MB, many users at once | Not tested |

## Things to know

- Logo: the supplied PNG (`IMG_7683.png`) shows the same shield artwork as `public/logo.svg` (same shapes and colours, checked by eye and by sampling a few pixel colours, not by a formal diff). The site keeps the transparent SVG; the supplied file is stored unchanged as `public/brand/mihakk-logo-original.png` (it has a white background).
- Evaluation cases and the detector were written together, so results describe these 100 cases only. The no-shield baseline is simulated.
- Heuristic rules can flag benign text that looks like an instruction (for example a line that starts with "Admin:"); the evaluation includes a few benign look-alikes, but the rules are not exhaustive.
- Deck slide 7: the editable presentation was not supplied in this run, so it was not changed. Its figures (for example 9% and 64%) are illustrative placeholders and must be replaced with the verified figures: 100 of 100 cases passed; shield accepted 0 of 60 disallowed requests versus 60 of 60 in the simulated baseline; 20 of 20 legitimate tasks completed, 0 of 20 false blocks (local extractive mode).
