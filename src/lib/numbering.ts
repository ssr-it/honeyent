// Auto-generated document numbers with fiscal-year prefix (April–March).
// Pure function: looks at existing records in the store and returns next No.

import { useErp } from "./store";
import { loadCompany } from "./company";

export type DocKind = "ORD" | "DC" | "WB" | "TR" | "INV" | "PUR" | "EXP" | "PAY";

export function fyTag(d = new Date()): string {
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  const next = (y + 1) % 100;
  return `${String(y % 100).padStart(2, "0")}-${String(next).padStart(2, "0")}`;
}

export function effectiveFyTag(): string {
  if (typeof window === "undefined") return fyTag();
  const company = loadCompany();
  return company.financialYear?.trim() || fyTag();
}

function maxSeq(nos: string[], prefix?: string): number {
  const re = prefix
    ? new RegExp(`^${prefix}/\\d{2}-\\d{2}/(\\d+)$`)
    : /\/(\d+)$/;
  let max = 0;
  for (const n of nos) {
    const m = n?.match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

export function nextNo(kind: DocKind): string {
  const s = useErp.getState();
  const fy = effectiveFyTag();
  let pool: string[] = [];
  switch (kind) {
    case "ORD": pool = s.orders.map((o) => o.no); break;
    case "DC": pool = s.deliveryChallans.map((d) => d.challanNo); break;
    case "WB": pool = s.weighSlips.map((w) => w.slipNo); break;
    case "TR": pool = s.trips.map((t) => t.tripNo); break;
    case "INV": pool = s.salesInvoices.map((i) => i.no); break;
    case "PUR": pool = s.purchaseInvoices.map((i) => i.no); break;
    case "EXP": pool = s.expenses.map((e) => e.no); break;
    case "PAY": pool = s.payments.map((p) => p.no); break;
  }
  const seq = maxSeq(pool, kind) + 1;
  return `${kind}/${fy}/${String(seq).padStart(4, "0")}`;
}

export function nextSharedSequence(): string {
  const s = useErp.getState();
  const fy = effectiveFyTag();
  const pool: string[] = [
    ...s.orders.map((o) => o.no),
    ...s.deliveryChallans.map((d) => d.challanNo),
    ...s.weighSlips.map((w) => w.slipNo),
    ...s.trips.map((t) => t.tripNo),
    ...s.salesInvoices.map((i) => i.no),
    ...s.purchaseInvoices.map((p) => p.no),
  ].filter((no) => no.includes(`/${fy}/`));
  const seq = maxSeq(pool) + 1;
  return String(seq).padStart(4, "0");
}

export function nextSharedNo(kind: DocKind, seq?: string): string {
  const fy = effectiveFyTag();
  const sequence = seq ?? nextSharedSequence();
  return `${kind}/${fy}/${sequence}`;
}
