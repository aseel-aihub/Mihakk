// Task contracts: a signed, time-limited statement of exactly what one task may do.
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const ContractSchema = z.object({
  v: z.literal(1),
  id: z.string().min(1),
  sessionId: z.string(),
  taskId: z.string(),
  task: z.string(),
  allowedAction: z.literal("summarize_file"),
  allowedResource: z.string(),
  issuedAt: z.number().int(),
  expiresAt: z.number().int(),
});
export type Contract = z.infer<typeof ContractSchema>;

export const DEFAULT_TTL_MS = 5 * 60 * 1000;

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function issueContract(
  input: { sessionId: string; taskId: string; allowedResource: string; ttlMs?: number; now?: number; id?: string },
  secret: string,
): { contract: Contract; token: string } {
  const now = input.now ?? Date.now();
  const contract: Contract = {
    v: 1,
    id: input.id ?? randomUUID(),
    sessionId: input.sessionId,
    taskId: input.taskId,
    task: `Summarize ${input.allowedResource}`,
    allowedAction: "summarize_file",
    allowedResource: input.allowedResource,
    issuedAt: now,
    expiresAt: now + (input.ttlMs ?? DEFAULT_TTL_MS),
  };
  const payload = b64(JSON.stringify(contract));
  return { contract, token: `${payload}.${sign(payload, secret)}` };
}

export function verifyToken(token: string, secret: string): { ok: true; contract: Contract } | { ok: false } {
  if (typeof token !== "string") return { ok: false };
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false };
  const expected = Buffer.from(sign(parts[0], secret));
  const given = Buffer.from(parts[1]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false };
  try {
    const parsed = ContractSchema.safeParse(JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")));
    return parsed.success ? { ok: true, contract: parsed.data } : { ok: false };
  } catch {
    return { ok: false };
  }
}
