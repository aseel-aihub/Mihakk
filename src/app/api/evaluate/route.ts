import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runCategory, summarizeRun } from "@/lib/evaluation/run";
import { loadRun, saveRun } from "@/lib/evaluation/store";
import { CATEGORIES, type RunResult } from "@/lib/evaluation/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const run = await loadRun();
  return NextResponse.json({ run, summary: summarizeRun(run) });
}

const Body = z.object({ category: z.enum(["untrusted-content", "permissions", "expiry-session", "file-validation", "legitimate"]), runId: z.string().optional(), reset: z.boolean().optional() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unknown evaluation category." }, { status: 400 });
  const { category, reset, runId } = parsed.data;

  let run: RunResult | null = reset ? null : await loadRun();
  if (!run || reset) {
    run = { runId: randomUUID(), startedAt: new Date().toISOString(), status: "running", summarizationMode: "local-extractive", categoriesDone: [], cases: [] };
  } else if (run.runId !== runId) {
    return NextResponse.json({ error: "This evaluation run was replaced. Start a new run." }, { status: 409 });
  }

  try {
    const results = await runCategory(category);
    run.cases = [...run.cases.filter((c) => c.category !== category), ...results];
    run.categoriesDone = Array.from(new Set([...run.categoriesDone, category]));
    if (run.categoriesDone.length === CATEGORIES.length) {
      run.status = "complete";
      run.finishedAt = new Date().toISOString();
    }
    await saveRun(run);
    return NextResponse.json({ run, summary: summarizeRun(run) });
  } catch (e) {
    run.status = "failed";
    run.error = e instanceof Error ? e.message : "Evaluation failed.";
    await saveRun(run).catch(() => undefined);
    return NextResponse.json({ error: run.error, run }, { status: 500 });
  }
}
