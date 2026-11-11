"use client";
import { useEffect, useState } from "react";
import { FileText, Loader2, Mail, FolderLock, Play, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Notice, StatusPill } from "@/components/status";

type Info = { llmAvailable: boolean; sampleName: string; vaultFile: string; maxBytes: number };
type Entry = { action: string; resource: string; outcome: "allowed" | "denied"; code: string; reason: string; origin: string; explanation?: string };
type Decision = { outcome: "allowed" | "denied"; code: string; reason: string; explanation?: string };
type LabResponse = {
  token: string;
  taskId: string;
  contract: { task: string; allowedAction: string; allowedResource: string; issuedAt: number; expiresAt: number };
  modeLabel: string;
  result: {
    status: "completed" | "blocked" | "file_rejected" | "error";
    fileName: string;
    extraction:
      | { status: "extracted"; kind: string; bytes: number; pages?: number; characters: number }
      | { status: "rejected"; code: string; message: string }
      | { status: "not attempted"; message: string };
    summary: { sentences: string[]; text: string } | null;
    ignoredInstructions: { text: string; where: string }[];
    derived: { request: { action: string; resource: string }; decision: Decision }[];
    log: Entry[];
    error?: string;
  };
  baselineDerived: { request: { action: string; resource: string }; baseline: Decision }[];
};
type Sim = { request: { action: string; resource: string }; shield: Decision; baseline: Decision; note: string; entry: Entry };

const fmt = (t: number) => new Date(t).toLocaleTimeString();

export default function LabPage() {
  const [info, setInfo] = useState<Info | null>(null);
  const [source, setSource] = useState<"sample" | "upload">("sample");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"local" | "llm">("local");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LabResponse | null>(null);
  const [sims, setSims] = useState<Sim[]>([]);
  const [simBusy, setSimBusy] = useState(false);

  useEffect(() => {
    fetch("/api/lab/info").then((r) => r.json()).then(setInfo).catch(() => setInfo(null));
  }, []);

  async function run() {
    setState("running");
    setError(null);
    setSims([]);
    setData(null);
    try {
      const fd = new FormData();
      fd.set("source", source);
      fd.set("mode", mode);
      if (mode === "llm") fd.set("consent", consent ? "yes" : "no");
      if (source === "upload") {
        if (!file) throw new Error("Choose a file to upload first.");
        fd.set("file", file);
      }
      const res = await fetch("/api/lab/run", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "The run failed.");
      setData(json);
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The run failed.");
      setState("error");
    }
  }

  async function simulate(kind: "send_email" | "read_other_file") {
    if (!data) return;
    setSimBusy(true);
    try {
      const res = await fetch("/api/lab/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, token: data.token, taskId: data.taskId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Simulation failed.");
      setSims((s) => [json, ...s]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed.");
    } finally {
      setSimBusy(false);
    }
  }

  const log: Entry[] = data ? [...data.result.log, ...[...sims].reverse().map((s) => ({ ...s.entry, explanation: s.shield.explanation }))] : [];
  const canRun = state !== "running" && (source === "sample" || file !== null) && (mode === "local" || consent);
  const r = data?.result;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lab</h1>
        <p className="mt-1 text-steel">Pick a file, let the agent summarize it, then watch the shield decide what the agent may do.</p>
      </div>

      <Card className="space-y-5">
        <CardTitle>1. Choose a file</CardTitle>
        <fieldset className="space-y-3">
          <legend className="sr-only">File source</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-ink has-[:checked]:bg-wash">
            <input type="radio" name="source" value="sample" checked={source === "sample"} onChange={() => setSource("sample")} className="mt-1 h-4 w-4" />
            <span>
              <span className="flex items-center gap-2 font-semibold"><FileText aria-hidden className="h-4 w-4" /> Use the sample sales report</span>
              <span className="block text-sm text-steel">Fictional Q3 report ({info?.sampleName ?? "q3_sales_report.txt"}). It includes a pasted partner note with inert test instructions, so you can see the shield at work.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-ink has-[:checked]:bg-wash">
            <input type="radio" name="source" value="upload" checked={source === "upload"} onChange={() => setSource("upload")} className="mt-1 h-4 w-4" />
            <span className="flex-1">
              <span className="flex items-center gap-2 font-semibold"><Upload aria-hidden className="h-4 w-4" /> Upload your own file</span>
              <span className="block text-sm text-steel">TXT, Markdown or text-based PDF, up to 1 MB. Uploaded files go through the same access checks.</span>
              {source === "upload" && (
                <input
                  type="file"
                  accept=".txt,.md,.pdf"
                  aria-label="Upload a file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-sm file:mr-3 file:rounded-md file:border file:border-line file:bg-card file:px-3 file:py-2"
                />
              )}
            </span>
          </label>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-semibold">Summary mode</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="mode" checked={mode === "local"} onChange={() => setMode("local")} className="h-4 w-4" />
            Local extractive (default, works without an API key)
          </label>
          <label className={`flex items-center gap-2 text-sm ${info?.llmAvailable ? "" : "text-mist"}`}>
            <input type="radio" name="mode" disabled={!info?.llmAvailable} checked={mode === "llm"} onChange={() => setMode("llm")} className="h-4 w-4" />
            Language model (optional){info?.llmAvailable ? "" : ": not configured on this server"}
          </label>
          {mode === "llm" && (
            <label className="flex items-start gap-2 rounded-lg border border-line bg-wash p-3 text-sm">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4" />
              I agree to send this file&apos;s content to an external language-model provider.
            </label>
          )}
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={run} disabled={!canRun}>
            {state === "running" ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Play aria-hidden className="h-4 w-4" />}
            {state === "running" ? "Running" : "Run summary"}
          </Button>
          <span role="status" aria-live="polite" className="text-sm text-steel">
            {state === "running" && "The shield is checking the request and the agent is reading the file."}
            {state === "done" && r?.status === "completed" && "Done. Review the summary, contract and decision log below."}
          </span>
        </div>
        {error && <Notice tone="error" title="Something went wrong">{error}</Notice>}
      </Card>

      {r && data && (
        <>
          {r.status === "file_rejected" && r.extraction.status === "rejected" && (
            <Notice tone="warn" title={`File not accepted (${r.extraction.code})`}>{r.extraction.message}</Notice>
          )}
          {r.status === "blocked" && <Notice tone="error" title="The shield blocked this request">{r.log[0]?.reason}</Notice>}
          {r.status === "error" && <Notice tone="error" title="The summary could not be produced">{r.error}</Notice>}

          <Card className="space-y-3">
            <CardTitle>2. File and English summary</CardTitle>
            <dl className="grid gap-2 text-sm sm:grid-cols-3">
              <div><dt className="text-steel">File name</dt><dd className="font-semibold" data-testid="file-name">{r.fileName}</dd></div>
              <div>
                <dt className="text-steel">Extraction status</dt>
                <dd className="font-semibold" data-testid="extraction-status">
                  {r.extraction.status === "extracted"
                    ? `Extracted (${r.extraction.kind.toUpperCase()}, ${r.extraction.characters.toLocaleString()} characters${r.extraction.pages ? `, ${r.extraction.pages} page(s)` : ""})`
                    : r.extraction.status === "rejected" ? `Rejected (${r.extraction.code})` : "Not attempted"}
                </dd>
              </div>
              <div><dt className="text-steel">Summarization mode</dt><dd className="font-semibold" data-testid="summary-mode">{data.modeLabel}</dd></div>
            </dl>
            {r.summary && r.summary.sentences.length > 0 && (
              <div data-testid="summary">
                <h3 className="mb-1 font-semibold">Summary</h3>
                <p className="rounded-lg bg-wash p-3 leading-relaxed">{r.summary.text}</p>
              </div>
            )}
            {r.summary && r.summary.sentences.length === 0 && <Notice tone="warn" title="No summarizable text found">The file had no sentences the agent could safely summarize.</Notice>}
            {r.ignoredInstructions.length > 0 && (
              <div data-testid="ignored">
                <h3 className="mb-1 font-semibold">Instructions found inside the document ({r.ignoredInstructions.length})</h3>
                <p className="mb-2 text-sm text-steel">Document text is untrusted data. These lines were left out of the summary and never treated as commands.</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {r.ignoredInstructions.map((i, k) => <li key={k}><span className="text-steel">[{i.where}]</span> {i.text}</li>)}
                </ul>
              </div>
            )}
          </Card>

          <Card className="space-y-3" data-testid="contract">
            <CardTitle>3. Task contract</CardTitle>
            <p className="text-sm text-steel">Issued by the server for this one task. The shield checks it before any file is opened or action is taken.</p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-steel">Task</dt><dd className="font-semibold">{data.contract.task}</dd></div>
              <div><dt className="text-steel">Allowed action</dt><dd className="font-semibold">{data.contract.allowedAction}</dd></div>
              <div><dt className="text-steel">Allowed file (only this one)</dt><dd className="font-semibold">{data.contract.allowedResource}</dd></div>
              <div><dt className="text-steel">Valid</dt><dd className="font-semibold">{fmt(data.contract.issuedAt)} to {fmt(data.contract.expiresAt)} (5 minutes)</dd></div>
            </dl>
          </Card>

          <Card className="space-y-4">
            <CardTitle>4. Try to make the agent step out of line</CardTitle>
            <p className="text-sm text-steel">These are harmless local simulations. Nothing is sent and no other file is opened.</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => simulate("send_email")} disabled={simBusy}><Mail aria-hidden className="h-4 w-4" /> Simulate: send an email</Button>
              <Button variant="secondary" onClick={() => simulate("read_other_file")} disabled={simBusy}><FolderLock aria-hidden className="h-4 w-4" /> Simulate: read a different file</Button>
            </div>
            <div aria-live="polite" className="space-y-3">
              {sims.map((s, i) => (
                <div key={i} className="rounded-lg border border-line p-3 text-sm" data-testid="sim-result">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{s.request.action} on {s.request.resource}</span>
                    <StatusPill kind={s.shield.outcome} label={`With shield: ${s.shield.outcome === "denied" ? "Denied" : "Allowed"}`} />
                    <StatusPill kind="baseline" label="Without shield (simulated): would be accepted" />
                  </div>
                  <p>{s.shield.explanation}</p>
                  <p className="mt-1 text-steel">{s.note}</p>
                </div>
              ))}
            </div>
          </Card>

          {data.baselineDerived.length > 0 && (
            <Card className="space-y-3" data-testid="baseline-compare">
              <CardTitle>Before and after, same requests</CardTitle>
              <p className="text-sm text-steel">If an agent obeyed the instructions hidden in this document, it would make these requests. Here is what happens with and without the shield.</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead><tr className="border-b border-line"><th className="py-2 pr-3">Requested action</th><th className="pr-3">Without shield (simulated)</th><th>With shield</th></tr></thead>
                  <tbody>
                    {r.derived.map((d, i) => (
                      <tr key={i} className="border-b border-line align-top">
                        <td className="py-2 pr-3">{d.request.action} on {d.request.resource}</td>
                        <td className="pr-3"><StatusPill kind="baseline" label="Would be accepted" /></td>
                        <td><StatusPill kind={d.decision.outcome} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card className="space-y-3">
            <CardTitle>Decision log</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm" data-testid="decision-log">
                <thead><tr className="border-b border-line"><th className="py-2 pr-3">#</th><th className="pr-3">Action</th><th className="pr-3">Resource</th><th className="pr-3">Outcome</th><th className="pr-3">Reason</th><th>Origin</th></tr></thead>
                <tbody>
                  {log.map((l, i) => (
                    <tr key={i} className="border-b border-line align-top">
                      <td className="py-2 pr-3">{i + 1}</td>
                      <td className="pr-3 font-mono text-xs">{l.action}</td>
                      <td className="break-all pr-3 font-mono text-xs">{l.resource}</td>
                      <td className="pr-3"><StatusPill kind={l.outcome} /></td>
                      <td className="pr-3">{l.reason}</td>
                      <td className="text-steel">{l.origin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
