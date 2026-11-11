import path from "node:path";
import { randomUUID } from "node:crypto";
import { authorize, baselineAuthorize } from "../policy";
import { buildCases } from "./cases";
import { CATEGORIES, type CaseResult, type CategoryId, type EvalEnv, type RunResult, type RunSummary } from "./types";

export const EVAL_SECRET = "mihakk-evaluation-fixed-secret";

export function defaultEnv(overrides: Partial<EvalEnv> = {}): EvalEnv {
  return {
    secret: EVAL_SECRET,
    authorize,
    baseline: baselineAuthorize,
    fixturesDir: path.join(process.cwd(), "fixtures"),
    samplesDir: path.join(process.cwd(), "data", "samples"),
    ...overrides,
  };
}

export async function runCategory(category: CategoryId, env: EvalEnv = defaultEnv()): Promise<CaseResult[]> {
  const results: CaseResult[] = [];
  for (const def of buildCases().filter((c) => c.category === category)) {
    const base = { id: def.id, category: def.category, kind: def.kind, title: def.title, expected: def.expected };
    try {
      const o = await def.run(env);
      const reqs = o.requests ?? [];
      const disallowedReqs = reqs.filter((r) => r.expected === "denied");
      results.push({
        ...base,
        actual: o.actual,
        status: o.pass ? "pass" : "fail",
        detail: o.detail,
        disallowed: disallowedReqs.length,
        baselineAccepted: disallowedReqs.filter((r) => r.baseline.outcome === "allowed").length,
        shieldAccepted: disallowedReqs.filter((r) => r.shield.outcome === "allowed").length,
        legit: def.category === "legitimate",
        legitBlocked: Boolean(o.legitBlocked),
      });
    } catch (e) {
      results.push({
        ...base,
        actual: "error",
        status: "fail",
        detail: e instanceof Error ? e.message : "Unexpected error",
        disallowed: 0,
        baselineAccepted: 0,
        shieldAccepted: 0,
        legit: def.category === "legitimate",
        legitBlocked: false,
      });
    }
  }
  return results;
}

export async function runEvaluation(env: EvalEnv = defaultEnv()): Promise<RunResult> {
  const run: RunResult = {
    runId: randomUUID(),
    startedAt: new Date().toISOString(),
    status: "running",
    summarizationMode: "local-extractive",
    categoriesDone: [],
    cases: [],
  };
  for (const c of CATEGORIES) {
    run.cases.push(...(await runCategory(c.id, env)));
    run.categoriesDone.push(c.id);
  }
  run.status = "complete";
  run.finishedAt = new Date().toISOString();
  return run;
}

/** Cases that have not run yet are reported as not-run (never silently counted as passes). */
export function summarizeRun(run: RunResult | null): RunSummary {
  const defs = buildCases();
  const byId = new Map((run?.cases ?? []).map((c) => [c.id, c]));
  const status = (id: string) => byId.get(id)?.status ?? "not-run";
  const count = (filter: (d: (typeof defs)[number]) => boolean) => {
    const sel = defs.filter(filter);
    return {
      total: sel.length,
      pass: sel.filter((d) => status(d.id) === "pass").length,
      fail: sel.filter((d) => status(d.id) === "fail").length,
      notRun: sel.filter((d) => status(d.id) === "not-run").length,
    };
  };
  const cases = run?.cases ?? [];
  const legit = cases.filter((c) => c.legit);
  return {
    mode: "Local extractive summarizer (no language model)",
    ...count(() => true),
    byCategory: CATEGORIES.map((c) => ({ id: c.id, label: c.label, kind: c.kind, measure: c.measure, ...count((d) => d.category === c.id) })),
    byKind: { policy: count((d) => d.kind === "policy"), agent: count((d) => d.kind === "agent") },
    disallowed: {
      total: cases.reduce((a, c) => a + c.disallowed, 0),
      baselineAccepted: cases.reduce((a, c) => a + c.baselineAccepted, 0),
      shieldAccepted: cases.reduce((a, c) => a + c.shieldAccepted, 0),
    },
    legit: {
      total: defs.filter((d) => d.category === "legitimate").length,
      completed: legit.filter((c) => c.status === "pass").length,
      falseBlocks: legit.filter((c) => c.legitBlocked).length,
    },
  };
}

export function toCsv(run: RunResult): string {
  const esc = (v: string | number | boolean | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["id", "category", "kind", "title", "expected", "actual", "status", "disallowed_requests", "baseline_accepted", "shield_accepted", "detail"];
  const rows = run.cases.map((c) =>
    [c.id, c.category, c.kind, c.title, c.expected, c.actual, c.status, c.disallowed, c.baselineAccepted, c.shieldAccepted, c.detail].map(esc).join(","),
  );
  return [head.join(","), ...rows].join("\n");
}
