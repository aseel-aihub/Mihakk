// The shield: server-side, default-deny authorization against a signed task contract.
import { verifyToken } from "./contract";

export type DecisionCode =
  | "ALLOWED"
  | "CONTRACT_INVALID"
  | "CONTRACT_NOT_YET_VALID"
  | "CONTRACT_EXPIRED"
  | "SESSION_MISMATCH"
  | "TASK_MISMATCH"
  | "ACTION_NOT_ALLOWED"
  | "RESOURCE_NOT_ALLOWED"
  | "NO_ENFORCEMENT";

export type Decision = { outcome: "allowed" | "denied"; code: DecisionCode; reason: string };

export type AuthRequest = {
  token: string;
  sessionId: string;
  taskId: string;
  action: string;
  resource: string;
  now: number;
};

export type Authorizer = (req: AuthRequest, secret: string) => Decision;

const deny = (code: DecisionCode, reason: string): Decision => ({ outcome: "denied", code, reason });

export const authorize: Authorizer = (req, secret) => {
  const v = verifyToken(req.token, secret);
  if (!v.ok) return deny("CONTRACT_INVALID", "The task contract is missing, damaged or was changed after it was issued.");
  const c = v.contract;
  if (req.now < c.issuedAt) return deny("CONTRACT_NOT_YET_VALID", "The task contract is not valid yet.");
  if (req.now >= c.expiresAt) return deny("CONTRACT_EXPIRED", "The task contract has expired, so no new access is granted.");
  if (req.sessionId !== c.sessionId) return deny("SESSION_MISMATCH", "This contract was issued to a different session.");
  if (req.taskId !== c.taskId) return deny("TASK_MISMATCH", "This contract was issued for a different task.");
  if (req.action !== c.allowedAction) {
    return deny("ACTION_NOT_ALLOWED", `The contract only allows "${c.allowedAction}". "${req.action || "(empty)"}" is not part of this task.`);
  }
  if (req.resource !== c.allowedResource) {
    return deny("RESOURCE_NOT_ALLOWED", `The contract only covers "${c.allowedResource}". "${req.resource || "(empty)"}" is a different resource.`);
  }
  return { outcome: "allowed", code: "ALLOWED", reason: "The request matches the task contract." };
};

/** Simulated "no shield" baseline: an agent that accepts whatever it is asked to do. Nothing real is executed. */
export const baselineAuthorize: Authorizer = () => ({
  outcome: "allowed",
  code: "NO_ENFORCEMENT",
  reason: "No shield is active in this simulated baseline, so the request would be accepted.",
});

export function plainExplanation(code: DecisionCode, action: string, resource: string): string {
  switch (code) {
    case "ACTION_NOT_ALLOWED":
      return `Blocked: this task only lets the agent summarize its file. Asking it to "${action}" is outside the task, so the shield refused it.`;
    case "RESOURCE_NOT_ALLOWED":
      return `Blocked: the agent may only touch the one file named in its contract. "${resource}" is a different file, so access was refused.`;
    case "CONTRACT_EXPIRED":
      return "Blocked: the permission has timed out. A new contract is needed.";
    case "SESSION_MISMATCH":
    case "TASK_MISMATCH":
      return "Blocked: this permission was issued for a different session or task and cannot be reused.";
    case "CONTRACT_INVALID":
    case "CONTRACT_NOT_YET_VALID":
      return "Blocked: the contract could not be trusted.";
    case "NO_ENFORCEMENT":
      return "No shield: this request would be accepted.";
    default:
      return "Allowed: the request matches the contract.";
  }
}
