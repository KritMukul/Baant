import Anthropic from "@anthropic-ai/sdk";
import { parsedBillSchema, type ParsedBill } from "./bill";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

const PROMPT = `Extract this restaurant/shop bill. Amounts are in INR rupees (decimals allowed).
- "price" is the TOTAL for that line (qty already multiplied).
- Put GST/CGST/SGST/VAT lines in "taxes", service charge in "serviceCharge", any coupon/discount (positive number) in "discount".
- "total" is the final payable amount printed on the bill.
- Do not invent items. If text is unreadable, make your best guess; the user will correct it.`;

const BILL_JSON_SCHEMA = {
  type: "object",
  properties: {
    merchant: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, qty: { type: "integer" }, price: { type: "number" } },
        required: ["name", "qty", "price"],
        additionalProperties: false,
      },
    },
    taxes: {
      type: "array",
      items: {
        type: "object",
        properties: { label: { type: "string" }, amount: { type: "number" } },
        required: ["label", "amount"],
        additionalProperties: false,
      },
    },
    serviceCharge: { type: "number" },
    discount: { type: "number" },
    total: { type: "number" },
  },
  required: ["merchant", "items", "taxes", "serviceCharge", "discount", "total"],
  additionalProperties: false,
};

/** OpenAI vision via Chat Completions + strict structured output (plain fetch, no SDK). */
async function parseWithOpenAI(base64: string, mediaType: string): Promise<ParsedBill> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}`, detail: "high" } },
          ],
        },
      ],
      response_format: { type: "json_schema", json_schema: { name: "bill", strict: true, schema: BILL_JSON_SCHEMA } },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { choices: { message: { content: string | null } }[] };
  const content = json.choices[0]?.message.content;
  if (!content) throw new Error("Bill could not be read");
  return parsedBillSchema.parse(JSON.parse(content));
}

export async function parseBillImage(base64: string, mediaType: string): Promise<ParsedBill> {
  const useOpenAI =
    process.env.BILL_PARSER === "openai" || (!process.env.BILL_PARSER && !process.env.ANTHROPIC_API_KEY && !!process.env.OPENAI_API_KEY);
  if (useOpenAI) return parseWithOpenAI(base64, mediaType);
  const client = new Anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    tools: [
      {
        name: "record_bill",
        description: "Record the structured contents of the bill.",
        input_schema: {
          type: "object",
          properties: {
            merchant: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  qty: { type: "integer" },
                  price: { type: "number" },
                },
                required: ["name", "qty", "price"],
              },
            },
            taxes: {
              type: "array",
              items: {
                type: "object",
                properties: { label: { type: "string" }, amount: { type: "number" } },
                required: ["label", "amount"],
              },
            },
            serviceCharge: { type: "number" },
            discount: { type: "number" },
            total: { type: "number" },
          },
          required: ["items", "total"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "record_bill" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
              data: base64,
            },
          },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("Bill could not be read");
  return parsedBillSchema.parse(block.input);
}
