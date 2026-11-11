# Mihakk demo script (about 85 seconds)

## Before you press record (2 minutes)

1. In the project folder run `npm run build` then `npm start`, and open http://localhost:3000.
2. Use a desktop browser window of about 1280 x 800, zoom 100%, and close other tabs.
3. Open the **Results** page once and confirm it says "The evaluation has not run yet". If it shows old results, that is fine, but the live run is more convincing: delete the `.mihakk` folder and refresh.
4. Start your screen recorder, then go back to the Home page.

## Shots

| Time | Click / action | Say (short narration) |
| --- | --- | --- |
| 0:00 to 0:10 | Show the **Home** page. Pause on the logo and the three steps. | "This is Mihakk. It helps teams check how safely an AI agent handles files before it is trusted with real work: test it, protect it, then re-evaluate." |
| 0:10 to 0:15 | Click **Try Mihakk**. | "Let's try it." |
| 0:15 to 0:35 | On Lab, leave **Use the sample sales report** selected. Click **Run summary**. Point to the summary, then to *Instructions found inside the document*. | "I'm using a fictional sales report. The agent reads only this file and writes an English summary from sentences in the report. The report also hides instructions. Mihakk treats them as untrusted data and keeps them out of the summary." |
| 0:35 to 0:42 | Point to **Task contract**. | "The server issued a contract: one action, one file, five minutes. Everything else is denied." |
| 0:42 to 1:00 | Click **Simulate: send an email**. Point to the red *Denied* label and the plain-English explanation. Scroll to the **Decision log**. | "Now I ask the agent to send an email. The shield checks the contract, sees that only summarizing this file is allowed, and denies it. Without the shield, this simulated baseline would have accepted it. Nothing was really sent. Every decision is logged." |
| 1:00 to 1:05 | Click **Results** in the menu. | "Now the evaluation." |
| 1:05 to 1:20 | Click **Run Evaluation**. Wait for the progress bar to finish (a few seconds). | "These are 100 fixed English cases, run from the code." |
| 1:20 to 1:30 | Point to the headline numbers and read **one** of them (see below). | Read the number that is on your screen. |
| 1:30 | Stop. | "Mihakk: test, protect, re-evaluate." |

## The verified result to read

In the verified run (11 November 2026, local extractive summarization, simulated no-shield baseline), the dashboard showed these headline numbers:

> Card "Disallowed requests accepted, simulated baseline": **60 of 60 (100%)**
> Card "Disallowed requests accepted, with shield": **0 of 60 (0%)**
>
> You can say: "With the shield, 0 of 60 disallowed requests were accepted, compared with 60 of 60 in the simulated no-shield baseline."

**Read the numbers on your own screen.** They come from the same code and should match; if they do not, say what your screen shows.
You can add: "These are results for our 100 tested cases." Do not say it proves the agent is safe in general.

## If something goes wrong while recording

| Problem | Fix |
| --- | --- |
| The Lab says the contract is missing | Click **Run summary** again, then simulate. |
| Results shows old numbers | Click **Run Evaluation**; it replaces them. |
| The before/after chart looks different from the script | Use the numbers printed above the chart and in the headline cards; the first bar is labelled "Simulated baseline" |
| Port 3000 is busy | Run `npm start -- -p 3001` and open that port instead. |
