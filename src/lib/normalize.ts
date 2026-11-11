// Text helpers shared by the extractor, summarizer and evaluation checks.

// Zero-width and bidi control characters are often used to hide text from readers.
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

export function stripInvisible(s: string): string {
  return s.replace(INVISIBLE, "");
}

export function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Canonical form used to compare a summary sentence with the source document. */
export function normalizeForMatch(s: string): string {
  return normalizeWhitespace(stripInvisible(s));
}
