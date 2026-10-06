import { parsedBillSchema, type ParsedBill } from "./bill";
import { visionJson, type VisionTask } from "./vision";

const PROMPT = `Extract this restaurant/shop bill. Amounts are in INR rupees (decimals allowed).
- "price" is the TOTAL for that line (qty already multiplied).
- Put GST/CGST/SGST/VAT lines in "taxes", service charge in "serviceCharge", any coupon/discount (positive number) in "discount".
- "total" is the final payable amount printed on the bill.
- Item prices must be BEFORE tax. If the bill prints a "Sub Total", the item prices must add up to that Sub Total. Some bills have a per-line "Total" column that already includes tax (it will be larger than rate x qty and won't add up to the Sub Total); in that case use rate x qty instead.
- Include EVERY tax/charge line printed on the bill in "taxes", even if two lines look alike. Use null for amounts that are not on the bill.
- Do not invent items. If text is unreadable, make your best guess; the user will correct it.
- For each item set "doubt" to null when you are sure. If you are not sure about the name, the quantity or the price (blurry, smudged, cut off), set "doubt" to {"field": "name" | "qty" | "price", "note": "a few words on why"}.`;

const nullable = (type: string) => ({ type: [type, "null"] });

export const BILL_JSON_SCHEMA = {
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
          doubt: {
            anyOf: [
              {
                type: "object",
                properties: { field: { type: "string", enum: ["name", "qty", "price"] }, note: { type: "string" } },
                required: ["field", "note"],
                additionalProperties: false,
              },
              { type: "null" },
            ],
          },
        },
        required: ["name", "qty", "price", "doubt"],
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
    serviceCharge: nullable("number"),
    discount: nullable("number"),
    total: { type: "number" },
  },
  required: ["merchant", "items", "taxes", "serviceCharge", "discount", "total"],
  additionalProperties: false,
};

/** A believable bill so the whole app can be tried without an API key (BILL_PARSER=stub). */
export const STUB_BILL: ParsedBill = {
  merchant: "The Local Diners",
  items: [
    { name: "Flavoured Mojito", qty: 1, price: 330, doubt: null },
    { name: "Cucumber Mint", qty: 1, price: 170, doubt: null },
    { name: "Long Island Elec", qty: 2, price: 680, doubt: null },
    { name: "Crunchy Salad", qty: 1, price: 160, doubt: null },
    { name: "Assorted Satay", qty: 1, price: 260, doubt: null },
    { name: "Tequila Chicken", qty: 1, price: 320, doubt: null },
    { name: "Fajitas Chicken", qty: 1, price: 300, doubt: null },
    { name: "Surf N Turf", qty: 1, price: 360, doubt: { field: "price", note: "the price is smudged" } },
  ],
  taxes: [
    { label: "VAT 5.5%", amount: 55.55 },
    { label: "VAT 14.5%", amount: 227.65 },
    { label: "Service tax 5.6%", amount: 158.93 },
  ],
  serviceCharge: 258,
  discount: 0,
  total: 3280,
};

const task: VisionTask<ParsedBill> = {
  prompt: PROMPT,
  schema: BILL_JSON_SCHEMA,
  parse: (json) => parsedBillSchema.parse(json),
  stub: () => STUB_BILL,
};

export const parseBillImage = (base64: string, mediaType: string): Promise<ParsedBill> =>
  visionJson(task, { base64, mediaType });
