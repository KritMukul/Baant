import Anthropic from "@anthropic-ai/sdk";
import { parsedBillSchema, type ParsedBill } from "./bill";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

const PROMPT = `Extract this restaurant/shop bill. Amounts are in INR rupees (decimals allowed).
- "price" is the TOTAL for that line (qty already multiplied).
- Put GST/CGST/SGST/VAT lines in "taxes", service charge in "serviceCharge", any coupon/discount (positive number) in "discount".
- "total" is the final payable amount printed on the bill.
- Do not invent items. If text is unreadable, make your best guess; the user will correct it.`;

export async function parseBillImage(base64: string, mediaType: string): Promise<ParsedBill> {
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
