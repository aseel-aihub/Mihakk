// The file-reading agent. It can only reach a file through the shield:
// authorize() runs BEFORE loadFile() is ever called. Document text is treated as untrusted data.
import { deriveRequests, type DerivedRequest } from "./directives";
import { extractFile, type ExtractResult } from "./extract";
import { authorize as defaultAuthorize, type Authorizer, type Decision } from "./policy";
import { summarizeLocal, type IgnoredInstruction } from "./summarize";

export type LogEntry = {
  seq: number;
  time: number;
  action: string;
  resource: string;
  outcome: "allowed" | "denied";
  code: string;
  reason: string;
  origin: "user task" | "document instruction" | "simulation";
};

export type AgentInput = {
  token: string;
  sessionId: string;
  taskId: string;
  fileName: string;
  loadFile: () => Promise<Uint8Array>;
  mode: "local" | "llm";
  now: number;
  secret: string;
  authorizer?: Authorizer;
  llmSummarize?: (text: string) => Promise<string>;
};

export type AgentResult = {
  status: "completed" | "blocked" | "file_rejected" | "error";
  fileName: string;
  fileLoaded: boolean;
  extraction:
    | { status: "extracted"; kind: string; bytes: number; pages?: number; characters: number }
    | { status: "rejected"; code: string; message: string }
    | { status: "not attempted"; message: string };
  summary: { mode: "local-extractive" | "language-model"; sentences: string[]; text: string } | null;
  ignoredInstructions: IgnoredInstruction[];
  derived: { request: DerivedRequest; decision: Decision }[];
  log: LogEntry[];
  error?: string;
};

export async function runFileAgent(input: AgentInput): Promise<AgentResult> {
  const authorize = input.authorizer ?? defaultAuthorize;
  const log: LogEntry[] = [];
  const record = (action: string, resource: string, d: Decision, origin: LogEntry["origin"]) =>
    log.push({ seq: log.length + 1, time: input.now, action, resource, outcome: d.outcome, code: d.code, reason: d.reason, origin });

  const base: AgentResult = {
    status: "blocked",
    fileName: input.fileName,
    fileLoaded: false,
    extraction: { status: "not attempted", message: "The shield did not authorize reading this file." },
    summary: null,
    ignoredInstructions: [],
    derived: [],
    log,
  };

  const req = (action: string, resource: string) => ({
    token: input.token,
    sessionId: input.sessionId,
    taskId: input.taskId,
    action,
    resource,
    now: input.now,
  });

  // 1. Default-deny check BEFORE touching the file.
  const first = authorize(req("summarize_file", input.fileName), input.secret);
  record("summarize_file", input.fileName, first, "user task");
  if (first.outcome !== "allowed") return base;

  // 2. Read and extract.
  const bytes = await input.loadFile();
  base.fileLoaded = true;
  const ex: ExtractResult = await extractFile(input.fileName, bytes);
  if (!ex.ok) {
    return { ...base, status: "file_rejected", extraction: { status: "rejected", code: ex.code, message: ex.message } };
  }
  base.extraction = { status: "extracted", kind: ex.kind, bytes: ex.bytes, pages: ex.pages, characters: ex.text.length };

  // 3. Summarize. The document never changes what the agent is allowed to do.
  const local = summarizeLocal(ex.text);
  base.ignoredInstructions = local.ignoredInstructions;
  try {
    if (input.mode === "llm" && input.llmSummarize) {
      const text = await input.llmSummarize(ex.text);
      base.summary = { mode: "language-model", sentences: [text], text };
    } else {
      base.summary = { mode: "local-extractive", sentences: local.sentences, text: local.text };
    }
  } catch (e) {
    return { ...base, status: "error", error: e instanceof Error ? e.message : "Summarization failed." };
  }

  // 4. Model a naive agent that would obey the document: each derived request must still pass the shield.
  for (const request of deriveRequests(ex.text)) {
    const decision = authorize(req(request.action, request.resource), input.secret);
    record(request.action, request.resource, decision, "document instruction");
    base.derived.push({ request, decision });
  }

  return { ...base, status: "completed" };
}
