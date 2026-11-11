# Verification record

Environment: Linux sandbox, Node 22, Chromium (Chrome for Testing build available in the sandbox). Date of verification: 11 November 2026.

## Passed

| What | How | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | No errors |
| Unit tests | `npm test` (Vitest) | 17 of 17 tests passed (shield, contract, extraction, summarizer, 100-case set, repeatability, and a deliberately broken shield that the cases catch) |
| 100 evaluation cases | `npm run eval`, and the Results page | 100 of 100 passed; policy 50 of 50; agent behavior 50 of 50; two runs gave identical outcomes |
| Disallowed requests | Same run | 60 total: simulated baseline accepted 60 of 60; shield accepted 0 of 60 |
| Legitimate tasks | Same run | 20 of 20 completed; 0 of 20 false blocks |
| Production build | `npm run build` | Succeeded |
| End-to-end flow, desktop (1280 x 800) and mobile (Pixel 5) | `npm run test:e2e`, 6 tests | 6 of 6 passed: Home, sample report, summary, contract, shield denial, Run Evaluation (started with the keyboard), dashboard numbers compared with the exported JSON, CSV export (header plus 100 rows), file messages (unsupported, empty, oversized, damaged, image-only PDF), text PDF, no horizontal scrolling on all four pages |
| Dashboard versus exported report | End-to-end test | Displayed pass count, baseline and shield counts, legitimate-task counts and category counts matched `docs/evaluation-results.json` |
| Visual check | I viewed the Lab page (desktop and mobile) and the Results page (desktop) screenshots in `docs/screenshots/` | Layout readable, status shown with icon and text |

## Failed

Nothing failed in the final runs. During development the first full run passed all 100 cases, so a mutation test was added: with an allow-everything shield, the cases fail (more than 40 failures), which shows the cases can fail.

## Not verified

| Item | Why |
| --- | --- |
| Optional language-model mode | No API key or model name was available; the code path was not run |
| A public preview link | The sandbox cannot host a public site. Run locally (README) |
| Replit or other hosting | Not tried. Any Node host with a writable folder should work |
| Windows, macOS, Safari, Firefox | Only Linux and Chromium were tested |
| Screen-reader testing and a formal accessibility audit | Keyboard activation was tested on one control, and status uses icons plus text, but no audit was done |
| Home and About pages by eye, and the mobile Results page | Covered by the automated no-overflow checks only |
| PDFs from other producers | Only three PDFs made with one tool were used |
| Uploads larger than 10 MB, many users at once | Not tested |

## Things to know

- The approved logo file was not available to me, so `public/logo.svg` is the same vector artwork as in the deck and the team brief. Replace the file to change it.
- Evaluation cases and the detector were written together, so results describe these 100 cases only. The no-shield baseline is simulated.
- Heuristic rules can flag benign text that looks like an instruction (for example a line that starts with "Admin:"); the evaluation includes a few benign look-alikes, but the rules are not exhaustive.
- Deck slide 7 shows illustrative placeholder numbers that differ from the measured results.
