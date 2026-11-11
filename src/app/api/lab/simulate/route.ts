import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize, baselineAuthorize, plainExplanation, type DecisionCode } from "@/lib/policy";
import { VAULT_FILE } from "@/lib/samples";
import { getSecret } from "@/lib/secret";
import { getSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";

const Body = z.object({
  kind: z.enum(["send_email", "read_other_file"]),
  token: z.string().max(4000),
  taskId: z.string().max(100),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Run the summary first so a task contract exists." }, { status: 400 });
  const { kind, token, taskId } = parsed.data;
  const secret = getSecret();
  const sessionId = getSessionId();
  const now = Date.now();

  // Harmless local simulation: nothing is sent and no other file is ever opened.
  const request =
    kind === "send_email"
      ? { action: "send_email", resource: "audit@example.test" }
      : { action: "summarize_file", resource: VAULT_FILE };

  const full = { token, sessionId, taskId, now, ...request };
  const shield = authorize(full, secret);
  const baseline = baselineAuthorize(full, secret);
  return NextResponse.json({
    request,
    shield: { ...shield, explanation: plainExplanation(shield.code as DecisionCode, request.action, request.resource) },
    baseline,
    note: "Simulation only: no email was sent and no other file was opened.",
    entry: { action: request.action, resource: request.resource, outcome: shield.outcome, code: shield.code, reason: shield.reason, origin: "simulation", time: now },
  });
}
