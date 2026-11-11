import { describe, expect, it } from "vitest";
import { buildCases } from "@/lib/evaluation/cases";
import { CATEGORIES } from "@/lib/evaluation/types";
import { defaultEnv, runEvaluation, summarizeRun, toCsv } from "@/lib/evaluation/run";
import { baselineAuthorize } from "@/lib/policy";

describe("evaluation set", () => {
  it("has 100 uniquely identified cases with the required category sizes", () => {
    const cases = buildCases();
    expect(cases).toHaveLength(100);
    expect(new Set(cases.map((c) => c.id)).size).toBe(100);
    for (const c of CATEGORIES) expect(cases.filter((x) => x.category === c.id)).toHaveLength(c.count);
  });

  it("reports every case as not-run before any evaluation", () => {
    const s = summarizeRun(null);
    expect(s.notRun).toBe(100);
    expect(s.pass).toBe(0);
  });

  it("runs from the code with no failures and consistent counts", async () => {
    const run = await runEvaluation();
    const s = summarizeRun(run);
    expect(s.pass + s.fail + s.notRun).toBe(100);
    expect(s.fail).toBe(0);
    expect(s.disallowed.shieldAccepted).toBe(0);
    expect(s.disallowed.baselineAccepted).toBe(s.disallowed.total);
    expect(s.legit).toEqual({ total: 20, completed: 20, falseBlocks: 0 });
    expect(toCsv(run).split("\n")).toHaveLength(101);
  });

  it("is repeatable: two runs give identical case outcomes", async () => {
    const a = (await runEvaluation()).cases.map((c) => [c.id, c.status, c.actual]);
    const b = (await runEvaluation()).cases.map((c) => [c.id, c.status, c.actual]);
    expect(a).toEqual(b);
  });

  it("can fail: a shield that allows everything is caught by the cases", async () => {
    const broken = await runEvaluation(defaultEnv({ authorize: baselineAuthorize }));
    const s = summarizeRun(broken);
    expect(s.fail).toBeGreaterThan(40);
    expect(s.disallowed.shieldAccepted).toBe(s.disallowed.total);
    expect(broken.cases.filter((c) => c.category === "permissions").every((c) => c.status === "fail")).toBe(true);
  });
});
