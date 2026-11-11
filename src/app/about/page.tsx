import { Card, CardTitle } from "@/components/ui/card";

const MODULES = [
  ["File extraction", "src/lib/extract.ts", "Add new document sources (for example DOCX or cloud drives) by adding a reader that returns plain text."],
  ["Summarization", "src/lib/summarize.ts, src/lib/llm.ts", "Swap or add model providers behind the same function. Local extractive mode needs no key."],
  ["Policy enforcement (the shield)", "src/lib/contract.ts, src/lib/policy.ts", "Add team policies by extending the contract fields and the checks. Default-deny stays the rule."],
  ["Evaluation", "src/lib/evaluation/", "Add cases or categories, and schedule recurring runs with the same runner and exports."],
];

export default function About() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">About Mihakk</h1>

      <Card className="space-y-2">
        <CardTitle>What this MVP does today</CardTitle>
        <ul className="list-disc space-y-1 pl-5 text-steel">
          <li>Reads one permitted file (TXT, Markdown or text-based PDF) and writes an English summary using only sentences found in that file.</li>
          <li>Issues a signed, time-limited task contract and checks it on the server before any file is read or action is authorized. Anything not in the contract is denied.</li>
          <li>Treats document text as untrusted data. Instruction-like lines are left out of the summary and any request they imply must pass the shield.</li>
          <li>Runs 100 fixed English evaluation cases and shows the real results, with exports as CSV or JSON.</li>
        </ul>
      </Card>

      <Card className="space-y-2">
        <CardTitle>What it does not do</CardTitle>
        <ul className="list-disc space-y-1 pl-5 text-steel">
          <li>It does not send email, delete files or call other services. Those actions are only simulated so the shield&apos;s decision can be shown.</li>
          <li>The &quot;without shield&quot; baseline is a simulation that accepts every request. It is not a measurement of any other product.</li>
          <li>The evaluation cases were written by the team, so results describe these 100 cases, not every possible attack.</li>
        </ul>
      </Card>

      <section aria-labelledby="modular" className="space-y-3">
        <h2 id="modular" className="text-xl font-semibold">Modular design</h2>
        <p className="text-steel">Each part is separate, so it can be extended without touching the others.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {MODULES.map(([name, file, text]) => (
            <Card key={name}>
              <h3 className="font-semibold">{name}</h3>
              <p className="font-mono text-xs text-steel">{file}</p>
              <p className="mt-2 text-sm text-steel">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="space-y-2">
        <CardTitle>Roadmap: Arabic and Saudi dialect support (future enhancement)</CardTitle>
        <p className="text-steel">The current release is English only. A later release could add:</p>
        <ul className="list-disc space-y-1 pl-5 text-steel">
          <li>An Arabic right-to-left interface, with the same pages and the same decision log.</li>
          <li>Arabic file summarization for Modern Standard Arabic documents.</li>
          <li>A separate evaluation set for Saudi colloquial phrasing, kept apart from the English 100 cases so results are never mixed.</li>
        </ul>
        <p className="text-sm text-steel">Other next steps: more document sources, additional model providers, per-team policies, and recurring scheduled evaluations.</p>
      </Card>
    </div>
  );
}
