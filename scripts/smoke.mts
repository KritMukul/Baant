// Checks that your database and the app's rules work together, with no browser: npm run smoke
// Uses DATABASE_URL (or DIBS_STORE=memory). Creates one test bill, walks it through a whole evening, deletes it.
import { pool, postgresStore } from "../src/server/store/postgres.ts";
import { memoryStore } from "../src/server/store/memory.ts";
import * as svc from "../src/server/service.ts";
import { STUB_BILL } from "../src/lib/parseBill.ts";

const useMemory = process.env.DIBS_STORE === "memory";
const store = useMemory ? memoryStore() : postgresStore();
let bad = 0;
const ok = (c: unknown, m: string) => {
  console.log(`${c ? "  ok  " : "  FAIL"} ${m}`);
  if (!c) bad++;
};
console.log(`Smoke test on ${useMemory ? "the in-memory store" : "Postgres"}`);

const draft = await svc.createDraft(store, { payerName: "Smoke Test", payerVpa: "smoke@okaxis" }, STUB_BILL);
if (!draft.ok) throw new Error(draft.error);
const host: svc.Creds = { host: draft.hostToken };
const code = draft.code;
try {
  ok((await store.getBillData(code))?.bill.status === "draft", "draft created");
  ok((await svc.publish(store, code, host)).ok, "published (round-off added)");
  const join = async (n: string) => {
    const r = await svc.join(store, code, n);
    if (!r.ok) throw new Error(JSON.stringify(r));
    return { participant: `${r.participantId}.${r.token}` } as svc.Creds;
  };
  const a = await join("Asha");
  const b = await join("Bilal");
  ok((await svc.join(store, code, "asha")).ok === false, "a repeated name asks 'is that you?'");
  const d = (await store.getBillData(code))!;
  for (const [i, it] of d.items.entries()) await svc.claim(store, code, i % 2 ? a : b, it.id, true);
  const d2 = (await store.getBillData(code))!;
  ok(svc.buildView(d2, { role: "host", participantId: d2.participants[0].id })!.allClaimed, "everything claimed");
  ok((await svc.setClaimsLocked(store, code, host, true)).ok, "claims locked");
  ok((await svc.markPaid(store, code, a, { utr: "408129375518" })).ok, "friend says paid");
  ok((await svc.markPaid(store, code, b)).ok, "second friend says paid");
  const d3 = (await store.getBillData(code))!;
  for (const p of d3.payments) ok((await svc.decide(store, code, host, p.id, { action: "confirm" })).ok, "host confirms one payment");
  const d4 = (await store.getBillData(code))!;
  ok(svc.buildView(d4, { role: "host", participantId: d4.participants[0].id })!.settled, "bill is settled");
  ok((await svc.join(store, code, "Late")).ok === false, "nobody can join a settled bill");
} finally {
  await store.deleteBill(code);
  ok((await store.getBillData(code)) === null, "test bill deleted");
  if (!useMemory) await pool().end();
}
console.log(bad ? `\n${bad} check(s) failed` : "\nAll good.");
process.exit(bad ? 1 : 0);
