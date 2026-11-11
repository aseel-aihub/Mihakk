import { randomBytes } from "node:crypto";

// One secret per server process (or MIHAKK_SECRET if set). Never sent to the browser.
export function getSecret(): string {
  const g = globalThis as unknown as { __mihakkSecret?: string };
  if (process.env.MIHAKK_SECRET) return process.env.MIHAKK_SECRET;
  g.__mihakkSecret ??= randomBytes(32).toString("hex");
  return g.__mihakkSecret;
}
