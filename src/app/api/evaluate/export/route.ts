import { NextResponse } from "next/server";
import { summarizeRun, toCsv } from "@/lib/evaluation/run";
import { loadRun } from "@/lib/evaluation/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const format = new URL(req.url).searchParams.get("format") === "csv" ? "csv" : "json";
  const run = await loadRun();
  if (!run || run.cases.length === 0) {
    return NextResponse.json({ error: "No evaluation results yet. Run the evaluation first." }, { status: 404 });
  }
  if (format === "csv") {
    return new NextResponse(toCsv(run), {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="mihakk-evaluation.csv"' },
    });
  }
  return new NextResponse(JSON.stringify({ run, summary: summarizeRun(run) }, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": 'attachment; filename="mihakk-evaluation.json"' },
  });
}
