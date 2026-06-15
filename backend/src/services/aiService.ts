/**
 * Provider-agnostic AI service.
 *
 * Picks a provider at request time based on which env var is populated:
 *   HF_TOKEN        → HuggingFace Inference Router (OpenAI-compatible)
 *                     default model: meta-llama/Llama-3.1-8B-Instruct
 *   OPENAI_API_KEY  → OpenAI Chat Completions (default model: gpt-4o-mini)
 *   GEMINI_API_KEY  → Google Gemini             (default model: gemini-1.5-flash)
 *   (none)          → deterministic mock so frontend can develop without a key
 *
 * Every endpoint that uses this service returns a `provider` field so the
 * client can tell whether real AI ran. When provider === "mock" the data
 * is hand-crafted but realistic.
 */

import dotenv from "dotenv";
dotenv.config();

export type AIProvider = "hf" | "openai" | "gemini" | "mock";

export function pickProvider(): AIProvider {
  if (process.env.HF_TOKEN) return "hf";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "mock";
}

interface ChatOptions {
  // System instruction (separate from the user prompt)
  system?: string;
  // Free-form user prompt
  user: string;
  // If set, the model is asked to reply with JSON matching this shape.
  // We don't validate — controllers do shallow parsing and fall back to mock if it fails.
  jsonOnly?: boolean;
  // Override default per-provider model
  model?: string;
  // Temperature (0–2). Default 0.6.
  temperature?: number;
  // Cap output tokens — keep responses snappy and cheap.
  maxTokens?: number;
}

interface ChatResult {
  provider: AIProvider;
  text: string;
}

const HF_DEFAULT     = process.env.HF_MODEL          || "meta-llama/Llama-3.1-8B-Instruct";
// Optional cheaper/free-tier model to retry with if the primary is rate-limited
// or unavailable (the 72B model often needs HF PRO). Mirrors the claude_ai project.
const HF_FALLBACK    = process.env.HF_MODEL_FALLBACK || "Qwen/Qwen2.5-7B-Instruct";
const OPENAI_DEFAULT = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GEMINI_DEFAULT = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export async function chat(opts: ChatOptions): Promise<ChatResult> {
  const provider = pickProvider();

  if (provider === "hf") {
    return { provider, text: await chatHF(opts) };
  }
  if (provider === "openai") {
    return { provider, text: await chatOpenAI(opts) };
  }
  if (provider === "gemini") {
    return { provider, text: await chatGemini(opts) };
  }
  return { provider, text: "" }; // caller must handle empty text → mock fallback
}

// HuggingFace Inference Router — OpenAI-compatible /v1/chat/completions endpoint.
// Works for any chat-capable model in HF's serverless inference.
async function chatHF(opts: ChatOptions): Promise<string> {
  const messages: any[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: opts.user });

  const callModel = async (model: string): Promise<string> => {
    const body: any = {
      model,
      messages,
      temperature: opts.temperature ?? 0.6,
      max_tokens: opts.maxTokens ?? 600,
    };
    // NOTE: the HF Inference Router rejects `response_format: json_object` for
    // the Qwen models ("not supported" → 400). Our prompts already instruct the
    // model to return JSON and safeParseJSON() strips any fences/prose, so we
    // rely on that instead of the API param. (jsonOnly is still honoured upstream.)

    const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const data: any = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || data?.error || `HF error ${res.status}`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return data?.choices?.[0]?.message?.content?.trim() || "";
  };

  const primary = opts.model || HF_DEFAULT;
  try {
    return await callModel(primary);
  } catch (err: any) {
    // Retry once on the fallback model for transient/availability errors
    // (rate limit, model cold/unavailable, free-tier gating on the big model).
    const msg = String(err?.message || err);
    const shouldFallback =
      HF_FALLBACK &&
      HF_FALLBACK !== primary &&
      /\b(404|429|503)\b|quota|rate.?limit|overloaded|not supported|does not exist|currently loading/i.test(msg);
    if (!shouldFallback) throw err;
    console.warn(
      `[ai] HF primary "${primary}" unavailable (${msg.slice(0, 120)}). Falling back to ${HF_FALLBACK}.`
    );
    return await callModel(HF_FALLBACK);
  }
}

async function chatOpenAI(opts: ChatOptions): Promise<string> {
  const messages: any[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: opts.user });

  const body: any = {
    model: opts.model || OPENAI_DEFAULT,
    messages,
    temperature: opts.temperature ?? 0.6,
    max_tokens: opts.maxTokens ?? 600,
  };
  if (opts.jsonOnly) body.response_format = { type: "json_object" };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data: any = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `OpenAI error ${res.status}`;
    throw new Error(msg);
  }
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

async function chatGemini(opts: ChatOptions): Promise<string> {
  const model = opts.model || GEMINI_DEFAULT;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const contents: any[] = [];
  if (opts.system) {
    contents.push({ role: "user", parts: [{ text: `[System]\n${opts.system}` }] });
  }
  contents.push({ role: "user", parts: [{ text: opts.user }] });

  const body: any = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.6,
      maxOutputTokens: opts.maxTokens ?? 600,
      ...(opts.jsonOnly && { responseMimeType: "application/json" }),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data: any = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `Gemini error ${res.status}`;
    throw new Error(msg);
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

/**
 * Parse model JSON output that may be wrapped in markdown fences or have leading prose.
 * Returns null on any failure — callers should fall back to a mock.
 */
export function safeParseJSON(text: string): any | null {
  if (!text) return null;
  let cleaned = text.trim();
  // Strip ```json ... ``` fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  // Find first { or [ if the model added intro prose
  const objStart = cleaned.indexOf("{");
  const arrStart = cleaned.indexOf("[");
  const start = objStart === -1
    ? arrStart
    : arrStart === -1
      ? objStart
      : Math.min(objStart, arrStart);
  if (start > 0) cleaned = cleaned.slice(start);
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
