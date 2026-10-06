import Anthropic from "@anthropic-ai/sdk";

/** A task a vision model can do: look at one image, answer with JSON that matches `schema`. */
export interface VisionTask<T> {
  prompt: string;
  /** JSON Schema. Keep it strict-friendly: every property required, additionalProperties false. */
  schema: object;
  /** Validate and shape the model's JSON. Throw if it is not usable. */
  parse: (json: unknown) => T;
  /** What the "stub" provider answers (development without an API key). */
  stub?: () => T;
}

export interface VisionImage {
  base64: string;
  mediaType: string;
}

export type Provider = "stub" | "claude" | "openai" | "gemini";

/** BILL_PARSER picks explicitly; otherwise the first API key present wins (Anthropic, OpenAI, Gemini). */
export function pickProvider(env: Record<string, string | undefined> = process.env): Provider {
  const p = env.BILL_PARSER;
  if (p === "stub" || p === "claude" || p === "openai" || p === "gemini") return p;
  if (env.ANTHROPIC_API_KEY) return "claude";
  if (env.OPENAI_API_KEY) return "openai";
  if (env.GEMINI_API_KEY) return "gemini";
  throw new Error("No vision provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY or GEMINI_API_KEY (or BILL_PARSER=stub for development).");
}

/** Retry transient provider errors (rate limit / overload) with exponential backoff. */
export async function fetchWithRetry(url: string, init: RequestInit, tries = 5, baseMs = 1500): Promise<Response> {
  for (let i = 0; ; i++) {
    const res = await fetch(url, init);
    if (![429, 502, 503].includes(res.status) || i >= tries - 1) return res;
    await new Promise((r) => setTimeout(r, baseMs * 2 ** i));
  }
}

async function withOpenAI<T>(task: VisionTask<T>, img: VisionImage): Promise<T> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: task.prompt },
            { type: "image_url", image_url: { url: `data:${img.mediaType};base64,${img.base64}`, detail: "high" } },
          ],
        },
      ],
      response_format: { type: "json_schema", json_schema: { name: "result", strict: true, schema: task.schema } },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { choices: { message: { content: string | null } }[] };
  const content = json.choices[0]?.message.content;
  if (!content) throw new Error("The image could not be read");
  return task.parse(JSON.parse(content));
}

async function withGemini<T>(task: VisionTask<T>, img: VisionImage): Promise<T> {
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
  const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${task.prompt}\nReply with JSON only, matching this JSON Schema:\n${JSON.stringify(task.schema)}` },
            { inline_data: { mime_type: img.mediaType, data: img.base64 } },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new Error("The image could not be read");
  return task.parse(JSON.parse(text));
}

async function withClaude<T>(task: VisionTask<T>, img: VisionImage): Promise<T> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
    max_tokens: 2048,
    tools: [{ name: "record", description: "Record the structured result.", input_schema: task.schema as Anthropic.Tool.InputSchema }],
    tool_choice: { type: "tool", name: "record" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: img.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: img.base64 },
          },
          { type: "text", text: task.prompt },
        ],
      },
    ],
  });
  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("The image could not be read");
  return task.parse(block.input);
}

export async function visionJson<T>(task: VisionTask<T>, img: VisionImage): Promise<T> {
  switch (pickProvider()) {
    case "stub": {
      if (!task.stub) throw new Error("BILL_PARSER=stub has no canned answer for this task");
      return task.stub();
    }
    case "openai":
      return withOpenAI(task, img);
    case "gemini":
      return withGemini(task, img);
    default:
      return withClaude(task, img);
  }
}
