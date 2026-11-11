// File validation and text extraction (TXT, Markdown, text-based PDF).

export const MAX_BYTES = 1_048_576; // 1 MiB
export const ALLOWED_EXTENSIONS = [".txt", ".md", ".pdf"] as const;

export type ExtractErrorCode = "UNSUPPORTED_TYPE" | "EMPTY_FILE" | "FILE_TOO_LARGE" | "DAMAGED_FILE" | "IMAGE_ONLY_PDF";

export type ExtractResult =
  | { ok: true; text: string; kind: "txt" | "md" | "pdf"; bytes: number; pages?: number }
  | { ok: false; code: ExtractErrorCode; message: string };

const MESSAGES: Record<ExtractErrorCode, string> = {
  UNSUPPORTED_TYPE: "Unsupported file type. Upload a .txt, .md or text-based .pdf file.",
  EMPTY_FILE: "The file is empty, so there is nothing to summarize.",
  FILE_TOO_LARGE: "The file is larger than the 1 MB limit.",
  DAMAGED_FILE: "The file could not be read. It may be damaged or not real text.",
  IMAGE_ONLY_PDF: "This PDF has no selectable text (it looks like scanned images). Use a text-based PDF.",
};

function fail(code: ExtractErrorCode): ExtractResult {
  return { ok: false, code, message: MESSAGES[code] };
}

export function fileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export async function extractFile(name: string, bytes: Uint8Array): Promise<ExtractResult> {
  const ext = fileExtension(name);
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) return fail("UNSUPPORTED_TYPE");
  if (bytes.length === 0) return fail("EMPTY_FILE");
  if (bytes.length > MAX_BYTES) return fail("FILE_TOO_LARGE");

  if (ext === ".pdf") {
    const header = new TextDecoder("latin1").decode(bytes.slice(0, 5));
    if (header !== "%PDF-") return fail("DAMAGED_FILE");
    try {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(bytes));
      const { text, totalPages } = await extractText(pdf, { mergePages: true });
      const merged = (Array.isArray(text) ? text.join("\n") : text).trim();
      if (!merged) return fail("IMAGE_ONLY_PDF");
      return { ok: true, text: merged, kind: "pdf", bytes: bytes.length, pages: totalPages };
    } catch {
      return fail("DAMAGED_FILE");
    }
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return fail("DAMAGED_FILE");
  }
  if (text.includes("\u0000")) return fail("DAMAGED_FILE");
  if (text.trim().length === 0) return fail("EMPTY_FILE");
  return { ok: true, text, kind: ext === ".md" ? "md" : "txt", bytes: bytes.length };
}
