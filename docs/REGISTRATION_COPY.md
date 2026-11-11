# Mihakk: registration copy for IS CyberNext 2026 (English)

Preliminary draft. Match the wording and character limits to the live form when it opens.
Items in [brackets] still need your confirmation. Measured results come from the evaluation run described in `docs/VERIFICATION_RECORD.md`; re-run `npm run eval` yourself before quoting them.

**Track:** Cybersecurity (supporting areas: cloud and systems integration; data and AI)
**Nama club code:** CN32

## Project name

Mihakk: a test-and-protect workflow for AI agents that read files (working name) [confirm the name is not already in use]

## Short description

Mihakk tests an AI agent that reads files, limits it with a signed, time-limited task contract enforced by a default-deny shield, then re-runs the same 100 cases to show what changed.

## Problem

Organizations are starting to let AI agents read files, summarize them and act on them. An agent cannot reliably tell a user's request from instructions hidden inside a document it reads (prompt injection), and agents are often given broader permissions than a task needs (excessive agency). Both risks are listed in the OWASP Top 10 for LLM applications [verify exact wording before citing]. Most teams have no simple, repeatable way to check how an agent behaves on such files before trusting it, or to show what a protection layer actually changes.

## Solution

Mihakk follows Test, Protect, Re-evaluate. A file-reading agent summarizes a document using only sentences found in that document, and treats the document's text as untrusted data. For each task the server issues a signed contract that names one action, one file and an expiry time. A default-deny shield checks every request against that contract before any file is opened or any action is authorized. A dashboard then runs 100 fixed cases and compares a simulated no-shield baseline with the shield on the same cases, together with legitimate tasks that were completed or wrongly blocked.

## Who benefits

Teams that plan to use AI agents on internal files (government entities, enterprises, universities), their security and cloud teams, and developers who build file-reading agents.

## Technologies

Next.js (App Router) and TypeScript, Tailwind CSS with shadcn/ui-style components, Zod input validation, Recharts, Vitest and Playwright tests. Signed contracts use HMAC-SHA256. PDF text extraction uses the unpdf library. Summaries use a local extractive method that needs no API key; an optional language-model mode is built but disabled by default and requires explicit consent [not exercised in testing].

## Innovation

1. A closed loop that reuses the same cases before and after protection, so the effect of the shield is shown with numerators and denominators instead of description.
2. Permissions tied to a single task: a contract-bound action and file, checked on the server before the file is read, with expiry, session and task binding.
3. Treating document text as untrusted data: instruction-like lines are kept out of the summary, and any request they imply must still pass the shield.
4. Measuring the cost of protection: legitimate tasks and false blocks are reported next to attack-style cases.

## Current stage

Working MVP that runs locally: file-reading agent, signed task contracts, default-deny shield, decision log, and a 100-case evaluation dashboard with CSV and JSON export. Tested with unit and end-to-end tests. Not yet piloted with an outside organization [confirm].

## Measured results (evaluation outcomes for the 100 tested cases)

Run in local extractive mode (no language model):

- 100 of 100 cases passed (policy tests 50 of 50; agent behavior tests 50 of 50).
- Across 60 disallowed requests, the simulated no-shield baseline accepted 60 of 60 (100%) and the shield accepted 0 of 60 (0%).
- 20 of 20 legitimate tasks completed; 0 of 20 were wrongly blocked.

How to read this: the cases were written by the team alongside the detector, and the baseline is a simulation that accepts every request. The results show the shield and checks behave as designed on these cases; they are not a claim about unseen attacks or other products.

## Expected impact (not measured)

Organizations could adopt file-reading agents with clearer evidence about what a protection layer changes, give each agent only the access its task needs, and reduce the damage if an agent is manipulated by a document. These benefits have not been measured in a real deployment.

## Scalability

The extractor, summarizer, shield and evaluation are separate modules. Next steps are additional document sources, more model providers, per-team policies, and scheduled recurring evaluations. Modern Standard Arabic and Saudi dialect support (Arabic right-to-left interface, Arabic summarization and a separate evaluation set for Saudi colloquial phrasing) is planned as a later release; the current release is English only.

## Participation goal

To demonstrate a working prototype at Black Hat MEA 2026 if shortlisted, gather feedback from security professionals, and develop Mihakk into a reusable testing and protection toolkit for organizations adopting AI agents.

## Supporting file or link: strongest available

1. **Best single link: the project repository** (README, source, `docs/evaluation-results.json`, screenshots). It lets reviewers run the same 100 cases. This needs you to push the project to GitHub (your account: aseel-aihub) and paste the URL [needs your action].
2. **Best single file if the form only accepts a file:** a PDF of the 8-slide deck, **but only after slide 7 is updated**: its dashboard numbers (for example 9% and 64%) are illustrative placeholders and do not match the measured results above. Ask for the updated deck, or do not attach it.
3. **Optional video:** the 60 to 90 second screen recording made from `docs/DEMO_SCRIPT.md`.

## Still needed [needs your confirmation]

Team name and members, contact details, and the repository or video link.
