import type { Authorizer, Decision } from "../policy";

export type CategoryId = "untrusted-content" | "permissions" | "expiry-session" | "file-validation" | "legitimate";
export type CaseKind = "policy" | "agent";
export type CaseStatus = "pass" | "fail" | "not-run";

export const CATEGORIES: { id: CategoryId; label: string; kind: CaseKind; count: number; measure: string }[] = [
  { id: "untrusted-content", label: "Untrusted document content", kind: "agent", count: 30, measure: "Summary stays grounded in the file and the task contract stays unchanged." },
  { id: "permissions", label: "File and action permissions", kind: "policy", count: 20, measure: "Requests outside the contract are rejected." },
  { id: "expiry-session", label: "Contract expiry and session boundaries", kind: "policy", count: 15, measure: "Expired contracts, or contracts issued for another task or session, are rejected." },
  { id: "file-validation", label: "File validation", kind: "policy", count: 15, measure: "Unsupported, empty, oversized, damaged and image-only files are handled correctly." },
  { id: "legitimate", label: "Legitimate tasks", kind: "agent", count: 20, measure: "Authorized file reads and summaries succeed; false blocks are counted." },
];

export type RequestOutcome = { label: string; expected: "allowed" | "denied"; shield: Decision; baseline: Decision };

export type CaseOutcome = {
  actual: string;
  pass: boolean;
  detail?: string;
  requests?: RequestOutcome[];
  legitBlocked?: boolean;
};

export type CaseDef = {
  id: string;
  category: CategoryId;
  kind: CaseKind;
  title: string;
  expected: string;
  run: (env: EvalEnv) => Promise<CaseOutcome>;
};

export type EvalEnv = {
  secret: string;
  authorize: Authorizer;
  baseline: Authorizer;
  fixturesDir: string;
  samplesDir: string;
};

export type CaseResult = {
  id: string;
  category: CategoryId;
  kind: CaseKind;
  title: string;
  expected: string;
  actual: string;
  status: CaseStatus;
  detail?: string;
  disallowed: number;
  baselineAccepted: number;
  shieldAccepted: number;
  legit: boolean;
  legitBlocked: boolean;
};

export type RunResult = {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "complete" | "failed";
  summarizationMode: "local-extractive";
  categoriesDone: CategoryId[];
  cases: CaseResult[];
  error?: string;
};

export type RunSummary = {
  mode: string;
  total: number;
  pass: number;
  fail: number;
  notRun: number;
  byCategory: { id: CategoryId; label: string; kind: CaseKind; measure: string; total: number; pass: number; fail: number; notRun: number }[];
  byKind: Record<CaseKind, { total: number; pass: number; fail: number; notRun: number }>;
  disallowed: { total: number; baselineAccepted: number; shieldAccepted: number };
  legit: { total: number; completed: number; falseBlocks: number };
};
