import { NextResponse } from "next/server";
import { MAX_BYTES } from "@/lib/extract";
import { llmAvailable } from "@/lib/llm";
import { SAMPLE_NAME, VAULT_FILE } from "@/lib/samples";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ llmAvailable: llmAvailable(), sampleName: SAMPLE_NAME, vaultFile: VAULT_FILE, maxBytes: MAX_BYTES });
}
