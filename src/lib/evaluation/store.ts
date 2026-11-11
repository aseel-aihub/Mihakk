// Persists the latest evaluation run on the server so the dashboard and exports read the same data.
import fs from "node:fs/promises";
import path from "node:path";
import type { RunResult } from "./types";

const FILE = path.join(process.cwd(), ".mihakk", "last-run.json");

export async function loadRun(): Promise<RunResult | null> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as RunResult;
  } catch {
    return null;
  }
}

export async function saveRun(run: RunResult): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(run, null, 2), "utf8");
}
