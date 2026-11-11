// Runs all 100 evaluation cases from the command line and prints the actual results.
import { runEvaluation, summarizeRun } from "../src/lib/evaluation/run";
import { saveRun } from "../src/lib/evaluation/store";

async function main() {
  const run = await runEvaluation();
  await saveRun(run);
  const s = summarizeRun(run);
  console.log(`Summarization mode: ${s.mode}`);
  console.log(`Cases: ${s.total}  pass ${s.pass}  fail ${s.fail}  not-run ${s.notRun}`);
  for (const c of s.byCategory) console.log(`  ${c.label}: ${c.pass}/${c.total} pass, ${c.fail} fail`);
  console.log(`Policy tests: ${s.byKind.policy.pass}/${s.byKind.policy.total}   Agent behavior tests: ${s.byKind.agent.pass}/${s.byKind.agent.total}`);
  console.log(`Disallowed requests: ${s.disallowed.total}; accepted by simulated baseline ${s.disallowed.baselineAccepted}; accepted with shield ${s.disallowed.shieldAccepted}`);
  console.log(`Legitimate tasks: ${s.legit.completed}/${s.legit.total} completed; false blocks ${s.legit.falseBlocks}/${s.legit.total}`);
  for (const c of run.cases.filter((c) => c.status !== "pass")) console.log(`FAIL ${c.id} ${c.title} -> ${c.actual} :: ${c.detail}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
