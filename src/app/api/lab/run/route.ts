import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runFileAgent } from "@/lib/agent";
import { issueContract } from "@/lib/contract";
import { MAX_BYTES } from "@/lib/extract";
import { llmAvailable, summarizeWithLlm } from "@/lib/llm";
import { baselineAuthorize, plainExplanation } from "@/lib/policy";
import { loadSample, SAMPLE_NAME } from "@/lib/samples";
import { getSecret } from "@/lib/secret";
import { getSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";

const Form = z.object({
  source: z.enum(["sample", "upload"]),
  mode: z.enum(["local", "llm"]).default("local"),
  consent: z.string().optional(),
});
const HARD_LIMIT = 10 * 1024 * 1024; // refuse to even read files above 10 MB

export async function POST(req: Request) {
  const form = await req.formData();
  const parsed = Form.safeParse({
    source: form.get("source"),
    mode: form.get("mode") ?? "local",
    consent: form.get("consent") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Choose the sample report or upload a file." }, { status: 400 });
  const { source, mode, consent } = parsed.data;

  if (mode === "llm") {
    if (!llmAvailable()) return NextResponse.json({ error: "Language-model mode is not configured on this server." }, { status: 400 });
    if (consent !== "yes") return NextResponse.json({ error: "Consent is required before file content is sent to an external provider." }, { status: 400 });
  }

  let fileName = SAMPLE_NAME;
  let loadFile: () => Promise<Uint8Array> = loadSample;
  if (source === "upload") {
    const f = form.get("file");
    if (!(f instanceof File)) return NextResponse.json({ error: "Choose a file to upload first." }, { status: 400 });
    fileName = f.name.replace(/[\\/]/g, "_").slice(0, 120) || "upload";
    if (f.size > HARD_LIMIT) {
      // Never read very large uploads; present a bounded buffer so the normal size check rejects it.
      loadFile = async () => new Uint8Array(MAX_BYTES + 1);
    } else {
      loadFile = async () => new Uint8Array(await f.arrayBuffer());
    }
  }

  const secret = getSecret();
  const sessionId = getSessionId();
  const taskId = `task-${randomUUID().slice(0, 8)}`;
  const now = Date.now();
  const { contract, token } = issueContract({ sessionId, taskId, allowedResource: fileName, now }, secret);

  const result = await runFileAgent({
    token, sessionId, taskId, fileName, loadFile, mode, now, secret,
    llmSummarize: mode === "llm" ? summarizeWithLlm : undefined,
  });

  const withExplanations = result.log.map((l) => ({
    ...l,
    explanation: plainExplanation(l.code as never, l.action, l.resource),
  }));
  const baselineDerived = result.derived.map((d) => ({
    request: d.request,
    baseline: baselineAuthorize({ token, sessionId, taskId, action: d.request.action, resource: d.request.resource, now }, secret),
  }));

  return NextResponse.json({
    token,
    taskId,
    contract: { id: contract.id, task: contract.task, allowedAction: contract.allowedAction, allowedResource: contract.allowedResource, issuedAt: contract.issuedAt, expiresAt: contract.expiresAt },
    result: { ...result, log: withExplanations },
    baselineDerived,
    modeLabel: result.summary?.mode === "language-model" ? "Language model (external provider, user consented)" : "Local extractive (no language model, no network)",
  });
}
