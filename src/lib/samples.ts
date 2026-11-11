import fs from "node:fs/promises";
import path from "node:path";

export const SAMPLE_NAME = "q3_sales_report.txt";
export const VAULT_FILE = "payroll_2026.txt"; // fictional "different file" used by the shield demo

export async function loadSample(): Promise<Uint8Array> {
  return new Uint8Array(await fs.readFile(path.join(process.cwd(), "data", "samples", SAMPLE_NAME)));
}
