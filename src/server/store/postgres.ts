import { Pool, type PoolClient } from "pg";
import type { Bill, BillData, Charge, Item, Participant, Payment } from "@/lib/model";
import { hashToken, newCode, newRef, newToken, tokenMatches } from "./ids";
import type { NewBill, NewPayment, PaymentPatch, Store } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const iso = (d: Date | string | null): string | null => (d ? new Date(d).toISOString() : null);

const toBill = (r: Row): Bill => ({
  id: r.id,
  code: r.code,
  ref: r.ref,
  merchant: r.merchant,
  total: r.total,
  status: r.status,
  payerName: r.payer_name,
  payerVpa: r.payer_vpa,
  thumb: r.thumb ?? null,
  shortAtShare: r.short_at_share,
  claimsLocked: r.claims_locked ?? false,
  createdAt: iso(r.created_at)!,
  sharedAt: iso(r.shared_at),
});
const toItem = (r: Row): Item => ({
  id: r.id,
  name: r.name,
  qty: r.qty,
  price: r.price,
  position: r.position,
  flag: r.flag ?? null,
});
const toCharge = (r: Row): Charge => ({ id: r.id, label: r.label, kind: r.kind, amount: r.amount, position: r.position });
const toParticipant = (r: Row): Participant => ({ id: r.id, name: r.name, isHost: r.is_host, createdAt: iso(r.created_at)! });
const toPayment = (r: Row): Payment => ({
  id: r.id,
  participantId: r.participant_id,
  kind: r.kind,
  said: r.said,
  utr: r.utr ?? null,
  shot: r.shot ?? null,
  status: r.status,
  confirmed: r.confirmed,
  waived: r.waived,
  createdAt: iso(r.created_at)!,
  decidedAt: iso(r.decided_at),
});

const json = (v: unknown) => (v == null ? null : JSON.stringify(v));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether to use TLS. Supabase's database requires it (and its certificate chain is not in the
 * system store, hence rejectUnauthorized:false). A local or Docker Postgres normally does not.
 * DATABASE_SSL=on|off overrides the guess.
 */
function sslFor(url: string): false | { rejectUnauthorized: false } {
  const v = (process.env.DATABASE_SSL ?? "").toLowerCase();
  if (v === "on" || v === "true" || v === "1") return { rejectUnauthorized: false };
  if (v === "off" || v === "false" || v === "0") return false;
  try {
    const host = new URL(url).hostname;
    return /\.supabase\.(co|com)$/.test(host) ? { rejectUnauthorized: false } : false;
  } catch {
    return false;
  }
}

const g = globalThis as unknown as { __dibsPool?: Pool };

export function pool(url = process.env.DATABASE_URL): Pool {
  if (g.__dibsPool) return g.__dibsPool;
  if (!url) throw new Error("DATABASE_URL is not set");
  g.__dibsPool = new Pool({ connectionString: url, ssl: sslFor(url), max: 8, idleTimeoutMillis: 30_000 });
  g.__dibsPool.on("error", (e) => console.error("postgres pool error", e.message));
  return g.__dibsPool;
}

export function postgresStore(db: Pool = pool()): Store {
  const q = async (text: string, params: unknown[] = []): Promise<Row[]> => (await db.query(text, params)).rows;
  const one = async (text: string, params: unknown[] = []): Promise<Row | null> => (await q(text, params))[0] ?? null;
  const billId = async (code: string): Promise<string> => {
    const r = await one("select id from bills where code = $1", [code]);
    if (!r) throw new Error("Bill not found");
    return r.id;
  };
  const tx = async <T>(fn: (c: PoolClient) => Promise<T>): Promise<T> => {
    const c = await db.connect();
    try {
      await c.query("begin");
      const out = await fn(c);
      await c.query("commit");
      return out;
    } catch (e) {
      await c.query("rollback").catch(() => {});
      throw e;
    } finally {
      c.release();
    }
  };

  return {
    async createBill(input: NewBill) {
      for (let attempt = 0; ; attempt++) {
        const code = newCode();
        try {
          return await tx(async (c) => {
            const hostToken = newToken();
            const hostPartToken = newToken();
            const b = (
              await c.query(
                `insert into bills (code, ref, merchant, total, payer_name, payer_vpa, thumb)
                 values ($1,$2,$3,$4,$5,$6,$7) returning id`,
                [code, newRef(), input.merchant, input.total, input.payerName, input.payerVpa, input.thumb],
              )
            ).rows[0];
            await c.query("insert into bill_secrets (bill_id, host_token_hash) values ($1,$2)", [b.id, hashToken(hostToken)]);
            for (const [position, i] of input.items.entries())
              await c.query(
                "insert into items (bill_id, name, qty, price, position, flag) values ($1,$2,$3,$4,$5,$6::jsonb)",
                [b.id, i.name, i.qty, i.price, position, json(i.flag)],
              );
            for (const [position, ch] of input.charges.entries())
              await c.query("insert into charges (bill_id, label, kind, amount, position) values ($1,$2,$3,$4,$5)", [
                b.id,
                ch.label,
                ch.kind,
                ch.amount,
                position,
              ]);
            const host = (
              await c.query("insert into participants (bill_id, name, is_host) values ($1,$2,true) returning id", [b.id, input.hostName])
            ).rows[0];
            await c.query("insert into participant_secrets (participant_id, token_hash) values ($1,$2)", [host.id, hashToken(hostPartToken)]);
            return { code, hostToken, host: { id: host.id as string, token: hostPartToken } };
          });
        } catch (e: any) {
          if (e?.code === "23505" && e?.constraint === "bills_code_key" && attempt < 5) continue; // code clash: pick another
          throw e;
        }
      }
    },

    async getBillData(code) {
      const b = await one("select * from bills where code = $1", [code]);
      if (!b) return null;
      const [items, charges, parts, claims, pays] = await Promise.all([
        q("select * from items where bill_id = $1 order by position, name", [b.id]),
        q("select * from charges where bill_id = $1 order by position", [b.id]),
        q("select * from participants where bill_id = $1 order by created_at, id", [b.id]),
        q("select item_id, participant_id from claims where bill_id = $1", [b.id]),
        q("select * from payments where bill_id = $1 order by created_at, id", [b.id]),
      ]);
      const data: BillData = {
        bill: toBill(b),
        items: items.map(toItem),
        charges: charges.map(toCharge),
        participants: parts.map(toParticipant),
        claims: claims.map((c) => ({ itemId: c.item_id, participantId: c.participant_id })),
        payments: pays.map(toPayment),
      };
      return data;
    },

    async checkHost(code, token) {
      const r = await one(
        "select s.host_token_hash h from bills b join bill_secrets s on s.bill_id = b.id where b.code = $1",
        [code],
      );
      return !!r && tokenMatches(token, r.h);
    },

    async checkParticipant(code, participantId, token) {
      if (!UUID.test(participantId)) return false;
      const r = await one(
        `select s.token_hash h from bills b
           join participants p on p.bill_id = b.id
           join participant_secrets s on s.participant_id = p.id
          where b.code = $1 and p.id = $2`,
        [code, participantId],
      );
      return !!r && tokenMatches(token, r.h);
    },

    async patchBill(code, patch) {
      const cols: Record<string, unknown> = {};
      if (patch.status !== undefined) cols.status = patch.status;
      if (patch.shortAtShare !== undefined) cols.short_at_share = patch.shortAtShare;
      if (patch.sharedAt !== undefined) cols.shared_at = patch.sharedAt;
      if (patch.claimsLocked !== undefined) cols.claims_locked = patch.claimsLocked;
      if (patch.merchant !== undefined) cols.merchant = patch.merchant;
      if (patch.total !== undefined) cols.total = patch.total;
      const keys = Object.keys(cols);
      if (!keys.length) return;
      await q(`update bills set ${keys.map((k, i) => `${k} = $${i + 2}`).join(", ")} where code = $1`, [code, ...keys.map((k) => cols[k])]);
    },

    async saveItem(code, item) {
      const id = await billId(code);
      if (item.id) {
        if (!UUID.test(item.id)) throw new Error("Item not found");
        const sets = ["name = $3", "qty = $4", "price = $5"];
        const params: unknown[] = [item.id, id, item.name, item.qty, item.price];
        if (item.flag !== undefined) {
          sets.push("flag = $6::jsonb");
          params.push(json(item.flag));
        }
        const r = await one(`update items set ${sets.join(", ")} where id = $1 and bill_id = $2 returning *`, params);
        if (!r) throw new Error("Item not found");
        return toItem(r);
      }
      const r = await one(
        `insert into items (bill_id, name, qty, price, position, flag)
         values ($1,$2,$3,$4,(select coalesce(max(position), -1) + 1 from items where bill_id = $1),$5::jsonb)
         returning *`,
        [id, item.name, item.qty, item.price, json(item.flag)],
      );
      return toItem(r!);
    },

    async removeItem(code, itemId) {
      if (!UUID.test(itemId)) return;
      const id = await billId(code);
      await q("delete from items where id = $1 and bill_id = $2", [itemId, id]);
    },

    async saveCharge(code, charge) {
      const id = await billId(code);
      if (charge.id) {
        if (!UUID.test(charge.id)) throw new Error("Charge not found");
        const r = await one(
          "update charges set label = $3, kind = $4, amount = $5 where id = $1 and bill_id = $2 returning *",
          [charge.id, id, charge.label, charge.kind, charge.amount],
        );
        if (!r) throw new Error("Charge not found");
        return toCharge(r);
      }
      const r = await one(
        `insert into charges (bill_id, label, kind, amount, position)
         values ($1,$2,$3,$4,(select coalesce(max(position), -1) + 1 from charges where bill_id = $1)) returning *`,
        [id, charge.label, charge.kind, charge.amount],
      );
      return toCharge(r!);
    },

    async removeCharge(code, chargeId) {
      if (!UUID.test(chargeId)) return;
      const id = await billId(code);
      await q("delete from charges where id = $1 and bill_id = $2", [chargeId, id]);
    },

    async addParticipant(code, name) {
      const id = await billId(code);
      return tx(async (c) => {
        const p = (await c.query("insert into participants (bill_id, name, is_host) values ($1,$2,false) returning *", [id, name])).rows[0];
        const token = newToken();
        await c.query("insert into participant_secrets (participant_id, token_hash) values ($1,$2)", [p.id, hashToken(token)]);
        return { participant: toParticipant(p), token };
      });
    },

    async rotateParticipantToken(code, participantId) {
      if (!UUID.test(participantId)) throw new Error("Participant not found");
      const id = await billId(code);
      const token = newToken();
      const r = await one(
        `update participant_secrets s set token_hash = $3
           from participants p where s.participant_id = p.id and p.id = $1 and p.bill_id = $2 returning s.participant_id`,
        [participantId, id, hashToken(token)],
      );
      if (!r) throw new Error("Participant not found");
      return token;
    },

    async setClaim(code, participantId, itemId, on) {
      if (!UUID.test(itemId)) throw new Error("Item not found");
      if (!UUID.test(participantId)) throw new Error("Participant not found");
      const id = await billId(code);
      if (!(await one("select 1 from items where id = $1 and bill_id = $2", [itemId, id]))) throw new Error("Item not found");
      if (!(await one("select 1 from participants where id = $1 and bill_id = $2", [participantId, id]))) throw new Error("Participant not found");
      if (on)
        await q("insert into claims (bill_id, item_id, participant_id) values ($1,$2,$3) on conflict do nothing", [id, itemId, participantId]);
      else await q("delete from claims where item_id = $1 and participant_id = $2", [itemId, participantId]);
    },

    async addPayment(code, p: NewPayment) {
      if (!UUID.test(p.participantId)) throw new Error("Participant not found");
      const id = await billId(code);
      if (!(await one("select 1 from participants where id = $1 and bill_id = $2", [p.participantId, id]))) throw new Error("Participant not found");
      const status = p.status ?? "says";
      const done = status === "confirmed";
      const r = await one(
        `insert into payments (bill_id, participant_id, kind, said, utr, shot, status, confirmed, decided_at)
         values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9) returning *`,
        [id, p.participantId, p.kind, p.said, p.utr ?? null, json(p.shot), status, done ? (p.confirmed ?? p.said) : 0, done ? new Date() : null],
      );
      return toPayment(r!);
    },

    async updatePayment(code, paymentId, patch: PaymentPatch) {
      if (!UUID.test(paymentId)) throw new Error("Payment not found");
      const id = await billId(code);
      const cols: Record<string, unknown> = {};
      if (patch.status !== undefined) cols.status = patch.status;
      if (patch.confirmed !== undefined) cols.confirmed = patch.confirmed;
      if (patch.waived !== undefined) cols.waived = patch.waived;
      if (patch.decidedAt !== undefined) cols.decided_at = patch.decidedAt;
      const keys = Object.keys(cols);
      if (!keys.length) {
        const cur = await one("select * from payments where id = $1 and bill_id = $2", [paymentId, id]);
        if (!cur) throw new Error("Payment not found");
        return toPayment(cur);
      }
      const r = await one(
        `update payments set ${keys.map((k, i) => `${k} = $${i + 3}`).join(", ")} where id = $1 and bill_id = $2 returning *`,
        [paymentId, id, ...keys.map((k) => cols[k])],
      );
      if (!r) throw new Error("Payment not found");
      return toPayment(r);
    },

    async removePayment(code, paymentId) {
      if (!UUID.test(paymentId)) return;
      const id = await billId(code);
      await q("delete from payments where id = $1 and bill_id = $2", [paymentId, id]);
    },

    async deleteBill(code) {
      await q("delete from bills where code = $1", [code]);
    },
  };
}
