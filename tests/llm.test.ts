import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRequest, llmAvailable, llmProvider, parseResponse, summarizeWithLlm } from "@/lib/llm";

const KEYS = ["MIHAKK_LLM_PROVIDER", "MIHAKK_LLM_MODEL", "MIHAKK_LLM_BASE_URL", "ANTHROPIC_API_KEY", "NEBIUS_API_KEY", "GEMINI_API_KEY"];
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

function reset() {
  for (const k of KEYS) delete process.env[k];
}
afterEach(() => {
  reset();
  for (const k of KEYS) if (saved[k] !== undefined) process.env[k] = saved[k];
  vi.unstubAllGlobals();
});

describe("optional language-model providers", () => {
  it("is off by default (local extractive mode only)", () => {
    reset();
    expect(llmProvider()).toBeNull();
    expect(llmAvailable()).toBe(false);
  });

  it("needs the provider's own key and a model name", () => {
    reset();
    process.env.MIHAKK_LLM_PROVIDER = "gemini";
    process.env.MIHAKK_LLM_MODEL = "m";
    expect(llmAvailable()).toBe(false);
    process.env.NEBIUS_API_KEY = "x"; // key of another provider does not count
    expect(llmAvailable()).toBe(false);
    process.env.GEMINI_API_KEY = "x";
    expect(llmAvailable()).toBe(true);
  });

  it("keeps the older Anthropic-only setup working", () => {
    reset();
    process.env.ANTHROPIC_API_KEY = "x";
    process.env.MIHAKK_LLM_MODEL = "m";
    expect(llmProvider()).toBe("anthropic");
    expect(llmAvailable()).toBe(true);
  });

  it("builds the right request for each provider and sends the key in a header, not the URL", () => {
    const a = buildRequest("anthropic", "K", "m", "doc");
    expect(a.url).toContain("api.anthropic.com");
    expect(a.headers["x-api-key"]).toBe("K");
    const n = buildRequest("nebius", "K", "m", "doc");
    expect(n.url).toMatch(/\/chat\/completions$/);
    expect(n.headers.authorization).toBe("Bearer K");
    const g = buildRequest("gemini", "K", "gem-model", "doc");
    expect(g.url).toContain("/models/gem-model:generateContent");
    expect(g.url).not.toContain("K");
    expect(g.headers["x-goog-api-key"]).toBe("K");
    for (const r of [a, n, g]) expect(JSON.stringify(r.body)).toContain("untrusted data");
  });

  it("allows a custom Nebius base URL", () => {
    process.env.MIHAKK_LLM_BASE_URL = "https://example.test/v1/";
    expect(buildRequest("nebius", "K", "m", "doc").url).toBe("https://example.test/v1/chat/completions");
  });

  it("limits how much of the file is sent", () => {
    const body = JSON.stringify(buildRequest("nebius", "K", "m", "x".repeat(50000)).body);
    expect(body.length).toBeLessThan(21000);
  });

  it("reads each provider's response shape", () => {
    expect(parseResponse("anthropic", { content: [{ type: "text", text: " A. " }] })).toBe("A.");
    expect(parseResponse("nebius", { choices: [{ message: { content: " B. " } }] })).toBe("B.");
    expect(parseResponse("gemini", { candidates: [{ content: { parts: [{ text: "C." }, { text: "D." }] } }] })).toBe("C. D.");
    expect(parseResponse("gemini", {})).toBe("");
  });

  it("works end to end with a mocked network and reports only the status on errors", async () => {
    process.env.MIHAKK_LLM_PROVIDER = "nebius";
    process.env.NEBIUS_API_KEY = "SECRET-KEY";
    process.env.MIHAKK_LLM_MODEL = "m";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "Sales rose." } }] }), { status: 200 })));
    expect(await summarizeWithLlm("doc")).toBe("Sales rose.");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("echo SECRET-KEY", { status: 401 })));
    await expect(summarizeWithLlm("doc")).rejects.toThrow(/Nebius, HTTP 401/);
    await expect(summarizeWithLlm("doc")).rejects.not.toThrow(/SECRET-KEY/);
  });
});
