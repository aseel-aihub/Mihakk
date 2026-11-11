// Local extractive summarizer: no API key, no network, deterministic.
// Every summary sentence is copied from the document, so it is grounded by construction.

import { deriveRequests, hasMarkerToken, isInstructionLike } from "./directives";
import { normalizeWhitespace, stripInvisible } from "./normalize";

export type IgnoredInstruction = { text: string; where: "body" | "hidden comment" };

export type SummaryResult = {
  mode: "local-extractive";
  sentences: string[];
  text: string;
  ignoredInstructions: IgnoredInstruction[];
};

const STOP = new Set(
  "a an and are as at be by for from has have in is it its of on or that the this to was were will with we our their they them these those but not into than then also over per".split(" "),
);
const KEYWORDS = /(revenue|total|growth|grew|decline|decreas|increas|rose|fell|summary|conclusion|recommend|margin|forecast|target|risk)/i;

function clean(line: string): string {
  return line
    .replace(/^\s*(#{1,6}\s+|[-*+]\s+|>\s+|\d+[.)]\s+)/, "")
    .replace(/^\|\s*|\s*\|$/g, "")
    .trim();
}

function splitSentences(text: string): string[] {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = clean(rawLine);
    if (!line || /^[-=|:\s]+$/.test(line)) continue;
    for (const part of line.split(/(?<=[.!?])\s+(?=[A-Z0-9"(])/)) {
      const s = part.trim();
      if (s) out.push(s);
    }
  }
  return out;
}

function words(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => !STOP.has(w));
}

export function summarizeLocal(rawText: string, maxSentences = 4): SummaryResult {
  const ignored: IgnoredInstruction[] = [];
  let text = stripInvisible(rawText);

  // Hidden HTML comments are never summarized; report them if they look like instructions.
  text = text.replace(/<!--([\s\S]*?)-->/g, (_m, inner: string) => {
    ignored.push({ text: normalizeWhitespace(inner).slice(0, 200), where: "hidden comment" });
    return " ";
  });

  const all = splitSentences(text);
  const candidates: { s: string; idx: number }[] = [];
  all.forEach((s, idx) => {
    const flagged = isInstructionLike(s) || hasMarkerToken(s) || deriveRequests(s).length > 0;
    if (flagged) {
      ignored.push({ text: s.slice(0, 200), where: "body" });
      return;
    }
    if (s.split(/\s+/).length >= 4) candidates.push({ s, idx });
  });

  if (candidates.length === 0) {
    return { mode: "local-extractive", sentences: [], text: "", ignoredInstructions: ignored };
  }

  const tf = new Map<string, number>();
  for (const c of candidates) for (const w of new Set(words(c.s))) tf.set(w, (tf.get(w) ?? 0) + 1);

  const scored = candidates.map((c, i) => {
    const ws = new Set(words(c.s));
    let score = 0;
    ws.forEach((w) => (score += tf.get(w) ?? 0));
    score = score / Math.pow(Math.max(ws.size, 1), 0.6);
    if (i < 3) score += 1.5;
    if (/\d/.test(c.s)) score += 1;
    if (KEYWORDS.test(c.s)) score += 0.8;
    return { ...c, score };
  });

  const picked = [...scored]
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .slice(0, maxSentences)
    .sort((a, b) => a.idx - b.idx)
    .map((p) => p.s);

  return { mode: "local-extractive", sentences: picked, text: picked.join(" "), ignoredInstructions: ignored };
}
