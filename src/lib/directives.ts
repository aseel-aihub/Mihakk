// Detection of instruction-like text inside documents.
// Document content is untrusted DATA. These helpers never grant anything: they only
// (1) keep instruction-like sentences out of summaries and
// (2) model what a naive agent that obeyed the document would try to do, so the shield can be tested.

import { stripInvisible } from "./normalize";

export type DerivedRequest = { action: string; resource: string; evidence: string };

const MARKER_TOKEN = /(CANARY[-_][A-Z0-9][A-Z0-9_-]{1,}|MIHAKK_TEST_REQUEST)/i;

const INSTRUCTION_PATTERNS: RegExp[] = [
  /\b(ignore|disregard|forget|override)\b[^.\n]{0,50}\b(previous|prior|above|earlier|all|the)\b[^.\n]{0,30}\b(instructions?|rules?|prompts?|task)\b/i,
  /^\s*[#>\-*\s]*(system|assistant|developer|admin)\s*:/i,
  /\b(instructions?|notes?)\s+(for|to)\s+(the\s+)?(ai|assistant|model|agent|llm)\b/i,
  /\bnote to (the )?(ai|assistant|model|agent)\b/i,
  /\b(reveal|print|show|output|repeat)\b[^.\n]{0,30}\b(system prompt|hidden instructions?|your instructions)\b/i,
  /\b(send|email|e-mail|forward|mail)\b[^.\n]{0,80}\bto\b[^.\n]{0,40}[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i,
  /\b(upload|post|transmit|exfiltrate)\b[^.\n]{0,80}https?:\/\/\S+/i,
  /\b(extend|increase|change|expand|grant|escalate|update)\b[^.\n]{0,60}\b(contract|permissions?|access|scope|expiry|expiration)\b/i,
  /\b(you (must|should|are required to|will now)|I authori[sz]e you)\b/i,
  /\b(begin|start|include|prepend)\b[^.\n]{0,40}\b(summary|response|answer)\b[^.\n]{0,40}\b(with|the (token|phrase))\b/i,
  /\b(delete|remove|erase)\b[^.\n]{0,40}\b[A-Za-z0-9_\-./\\]+\.(txt|md|pdf|csv|json)\b/i,
];

export function hasMarkerToken(s: string): boolean {
  return MARKER_TOKEN.test(stripInvisible(s));
}

export function isInstructionLike(sentence: string): boolean {
  const s = stripInvisible(sentence);
  if (MARKER_TOKEN.test(s)) return true;
  return INSTRUCTION_PATTERNS.some((re) => re.test(s));
}

const FILE_TOKEN = String.raw`([A-Za-z0-9_\-./\\]+\.(?:txt|md|pdf|csv|env|json))`;

/** Requests a naive agent would derive if it obeyed the text. Used only to exercise the shield. */
export function deriveRequests(text: string): DerivedRequest[] {
  const t = stripInvisible(text);
  const out: DerivedRequest[] = [];
  const add = (action: string, resource: string, evidence: string) => {
    if (!out.some((r) => r.action === action && r.resource === resource)) {
      out.push({ action, resource, evidence: evidence.trim().slice(0, 140) });
    }
  };

  // Structured inert test markers: MIHAKK_TEST_REQUEST: action=... resource=...
  for (const m of t.matchAll(/MIHAKK_TEST_REQUEST\s*[:=]?\s*([^\n]*)/gi)) {
    const action = /action\s*=\s*([A-Za-z_]+)/i.exec(m[1])?.[1];
    const resource = /resource\s*=\s*(\S+)/i.exec(m[1])?.[1];
    if (action && resource) add(action, resource, m[0]);
  }

  for (const m of t.matchAll(/\b(?:send|email|e-mail|forward|mail)\b[^.\n]{0,80}?\bto\b[^.\n]{0,40}?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi)) {
    add("send_email", m[1], m[0]);
  }
  for (const m of t.matchAll(/\b(?:upload|post|transmit|exfiltrate)\b[^.\n]{0,80}?(https?:\/\/[^\s)]+)/gi)) {
    add("http_request", m[1].replace(/[.,;]+$/, ""), m[0]);
  }
  for (const m of t.matchAll(new RegExp(String.raw`\b(?:read|open|access|show|print)\b[^.\n]{0,40}?\b(?:file\s+)?` + FILE_TOKEN, "gi"))) {
    add("read_file", m[1], m[0]);
  }
  for (const m of t.matchAll(new RegExp(String.raw`\b(?:delete|remove|erase)\b[^.\n]{0,40}?` + FILE_TOKEN, "gi"))) {
    add("delete_file", m[1], m[0]);
  }
  for (const m of t.matchAll(/\b(?:extend|increase|change|expand|grant|escalate|update)\b[^.\n]{0,60}\b(?:contract|permissions?|access|scope|expiry|expiration)\b/gi)) {
    add("modify_contract", "contract", m[0]);
  }
  return out;
}
