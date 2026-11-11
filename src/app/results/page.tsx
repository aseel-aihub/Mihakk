"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Notice, StatusPill } from "@/components/status";
import { CATEGORIES, type CaseResult, type CategoryId, type RunResult, type RunSummary } from "@/lib/evaluation/types";

const SHORT: Record<CategoryId, string> = {
  "untrusted-content": "Untrusted content",
  permissions: "Permissions",
  "expiry-session": "Expiry and sessions",
  "file-validation": "File validation",
  legitimate: "Legitimate tasks",
};

const pct = (n: number, d: number) => (d === 0 ? "n/a" : `${Math.round((n / d) * 1000) / 10}%`);
const ratio = (n: number, d: number) => `${n} of ${d} (${pct(n, d)})`;

type Phase = "loading" | "idle" | "running" | "failed";

export default function ResultsPage() {
  const [run, setRun] = useState<RunResult | null>(null);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/evaluate", { cache: "no-store" });
    const json = await res.json();
    setRun(json.run);
    setSummary(json.summary);
    return json;
  }, []);

  useEffect(() => {
    load().then(() => setPhase("idle")).catch(() => { setError("Could not load saved results."); setPhase("failed"); });
  }, [load]);

  async function runEvaluation() {
    setPhase("running");
    setError(null);
    setProgress(0);
    let runId: string | undefined;
    try {
      for (let i = 0; i < CATEGORIES.length; i++) {
        const c = CATEGORIES[i];
        setCurrent(c.label);
        const res = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ category: c.id, reset: i === 0, runId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Evaluation failed.");
        runId = json.run.runId;
        setProgress(i + 1);
      }
      await load();
      setPhase("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluation failed.");
      await load().catch(() => undefined);
      setPhase("failed");
    }
  }

  const ran = summary ? summary.pass + summary.fail : 0;
  const hasRun = ran > 0;
  const complete = run?.status === "complete" && summary?.notRun === 0;

  const rows: CaseResult[] = useMemo(() => {
    const all = run?.cases ?? [];
    return all.filter((c) => (catFilter === "all" || c.category === catFilter) && (statusFilter === "all" || c.status === statusFilter));
  }, [run, catFilter, statusFilter]);

  const compare = summary
    ? [
        { name: "Simulated baseline (no shield)", accepted: summary.disallowed.baselineAccepted },
        { name: "With shield", accepted: summary.disallowed.shieldAccepted },
      ]
    : [];
  const stacked = summary?.byCategory.map((c) => ({ name: SHORT[c.id], Pass: c.pass, Fail: c.fail, "Not run": c.notRun })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results</h1>
          <p className="mt-1 text-steel">100 fixed English evaluation cases, run from the code. Numbers below are the actual output of the last run.</p>
        </div>
        <Button onClick={runEvaluation} disabled={phase === "running" || phase === "loading"}>
          {phase === "running" ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Play aria-hidden className="h-4 w-4" />}
          Run Evaluation
        </Button>
      </div>

      {phase === "running" && (
        <Card role="status" aria-live="polite">
          <p className="mb-2 font-semibold" data-testid="progress-text">Running category {Math.min(progress + 1, CATEGORIES.length)} of {CATEGORIES.length}: {current}</p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-wash" role="progressbar" aria-valuemin={0} aria-valuemax={CATEGORIES.length} aria-valuenow={progress} aria-label="Evaluation progress">
            <div className="h-full bg-ink transition-all" style={{ width: `${(progress / CATEGORIES.length) * 100}%` }} />
          </div>
        </Card>
      )}

      {phase === "failed" && (
        <Notice tone="error" title="The evaluation failed">
          {error} Results shown below (if any) are incomplete. Press Run Evaluation to try again.
        </Notice>
      )}

      {phase !== "loading" && !hasRun && phase !== "running" && phase !== "failed" && (
        <Notice tone="info" title="The evaluation has not run yet">
          All 100 cases are currently <strong>not run</strong>. Press Run Evaluation to execute them and see real results here.
        </Notice>
      )}

      {hasRun && summary && run && (
        <>
          {!complete && phase !== "running" && (
            <Notice tone="warn" title="This run is incomplete">
              {ran} of {summary.total} cases ran. The remaining {summary.notRun} are shown as not run and are not counted as passes.
            </Notice>
          )}

          <section aria-labelledby="headline" className="space-y-3">
            <h2 id="headline" className="text-xl font-semibold">Headline numbers</h2>
            <p data-testid="cases-ran" className="text-sm text-steel">{ran} of {summary.total} cases ran. Summarization mode used: {summary.mode}. Evaluation outcomes apply to these tested cases only.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card><p className="text-sm text-steel">Cases passed</p><p className="text-2xl font-bold" data-testid="kpi-pass">{ratio(summary.pass, summary.total)}</p><p className="text-sm text-steel">{summary.fail} failed, {summary.notRun} not run</p></Card>
              <Card><p className="text-sm text-steel">Disallowed requests accepted, simulated baseline</p><p className="text-2xl font-bold" data-testid="kpi-baseline">{ratio(summary.disallowed.baselineAccepted, summary.disallowed.total)}</p></Card>
              <Card><p className="text-sm text-steel">Disallowed requests accepted, with shield</p><p className="text-2xl font-bold" data-testid="kpi-shield">{ratio(summary.disallowed.shieldAccepted, summary.disallowed.total)}</p></Card>
              <Card><p className="text-sm text-steel">Legitimate tasks completed</p><p className="text-2xl font-bold" data-testid="kpi-legit">{ratio(summary.legit.completed, summary.legit.total)}</p><p className="text-sm text-steel" data-testid="kpi-falseblock">False blocks: {ratio(summary.legit.falseBlocks, summary.legit.total)}</p></Card>
            </div>
            <p className="text-sm text-steel">The baseline is a simulation of an agent with no enforcement (it accepts every request), so it shows what the shield changes, not how another product performs.</p>
          </section>

          <Card className="space-y-3">
            <CardTitle>Before and after: disallowed requests accepted</CardTitle>
            <div role="img" aria-label={`Bar chart. Simulated baseline accepted ${summary.disallowed.baselineAccepted} of ${summary.disallowed.total} disallowed requests. With the shield, ${summary.disallowed.shieldAccepted} of ${summary.disallowed.total} were accepted.`} className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compare} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D5D9DD" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, Math.max(summary.disallowed.total, 1)]} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="accepted" name="Disallowed requests accepted" fill="#1B1F23" isAnimationActive={false}>
                    <LabelList dataKey="accepted" position="top" style={{ fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-steel">Same {summary.disallowed.total} disallowed requests in both runs: {ratio(summary.disallowed.baselineAccepted, summary.disallowed.total)} accepted without the shield, {ratio(summary.disallowed.shieldAccepted, summary.disallowed.total)} with it.</p>
          </Card>

          <Card className="space-y-3">
            <CardTitle>Breakdown by test category</CardTitle>
            <div role="img" aria-label="Stacked bar chart of pass, fail and not-run cases for each of the five test categories." className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stacked} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D5D9DD" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Pass" stackId="a" fill="#1E5A3F" isAnimationActive={false} />
                  <Bar dataKey="Fail" stackId="a" fill="#8F2D1F" isAnimationActive={false} />
                  <Bar dataKey="Not run" stackId="a" fill="#8C949C" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm" data-testid="category-table">
                <thead><tr className="border-b border-line"><th className="py-2 pr-3">Category</th><th className="pr-3">Test type</th><th className="pr-3">Pass</th><th className="pr-3">Fail</th><th className="pr-3">Not run</th><th>What it measures</th></tr></thead>
                <tbody>
                  {summary.byCategory.map((c) => (
                    <tr key={c.id} className="border-b border-line align-top">
                      <td className="py-2 pr-3 font-medium">{c.label}</td>
                      <td className="pr-3">{c.kind === "policy" ? "Policy" : "Agent behavior"}</td>
                      <td className="pr-3">{c.pass} of {c.total}</td><td className="pr-3">{c.fail}</td><td className="pr-3">{c.notRun}</td>
                      <td className="text-steel">{c.measure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="space-y-3">
            <CardTitle>Policy tests and agent behavior tests, reported separately</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm" data-testid="kind-table">
                <thead><tr className="border-b border-line"><th className="py-2 pr-3">Group</th><th className="pr-3">Passed</th><th className="pr-3">Failed</th><th>Not run</th></tr></thead>
                <tbody>
                  <tr className="border-b border-line"><td className="py-2 pr-3">Policy tests (permissions, expiry and sessions, file validation)</td><td className="pr-3">{ratio(summary.byKind.policy.pass, summary.byKind.policy.total)}</td><td className="pr-3">{summary.byKind.policy.fail}</td><td>{summary.byKind.policy.notRun}</td></tr>
                  <tr className="border-b border-line"><td className="py-2 pr-3">Agent behavior tests (untrusted content, legitimate tasks), mode: {summary.mode}</td><td className="pr-3">{ratio(summary.byKind.agent.pass, summary.byKind.agent.total)}</td><td className="pr-3">{summary.byKind.agent.fail}</td><td>{summary.byKind.agent.notRun}</td></tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Export</CardTitle>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="secondary"><a href="/api/evaluate/export?format=json" download><Download aria-hidden className="h-4 w-4" /> Download JSON</a></Button>
                <Button asChild variant="secondary"><a href="/api/evaluate/export?format=csv" download><Download aria-hidden className="h-4 w-4" /> Download CSV</a></Button>
              </div>
            </div>
          </Card>

          <Card className="space-y-3">
            <CardTitle>All cases</CardTitle>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2">Category
                <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="min-h-[40px] rounded-md border border-line bg-card px-2">
                  <option value="all">All</option>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{SHORT[c.id]}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2">Status
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-[40px] rounded-md border border-line bg-card px-2">
                  <option value="all">All</option><option value="pass">Pass</option><option value="fail">Fail</option><option value="not-run">Not run</option>
                </select>
              </label>
              <span className="self-center text-steel">{rows.length} shown</span>
            </div>
            <div className="max-h-[480px] overflow-auto">
              <table className="w-full min-w-[720px] text-left text-sm" data-testid="cases-table">
                <thead className="sticky top-0 bg-card"><tr className="border-b border-line"><th className="py-2 pr-3">ID</th><th className="pr-3">Case</th><th className="pr-3">Expected</th><th className="pr-3">Actual</th><th>Status</th></tr></thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-b border-line align-top">
                      <td className="py-2 pr-3 font-mono text-xs">{c.id}</td><td className="pr-3">{c.title}</td>
                      <td className="pr-3 text-steel">{c.expected}</td><td className="pr-3">{c.actual}{c.detail ? ` (${c.detail})` : ""}</td>
                      <td><StatusPill kind={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Notice tone="info" title="How to read these results">
        The cases were written by the Mihakk team together with the detector, so they show that the shield and checks behave as designed on these 100 cases. They do not measure how an agent would fare against attacks no one has written yet.
      </Notice>
    </div>
  );
}
