// Duplicate-entry guard. Returns a friendly error string, or null when OK.

import { useErp, active } from "./store";

function norm(s?: string): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export interface DupeOpts {
  excludeId?: string;
}

export function checkCustomer(name: string, gst: string, mobile: string, o: DupeOpts = {}): string | null {
  const list = active(useErp.getState().customers).filter((c) => String(c.id) !== o.excludeId);
  if (gst && list.some((c) => norm(c.gst) === norm(gst))) return `GSTIN already exists`;
  if (list.some((c) => norm(c.name) === norm(name) && c.mobile === mobile)) return `Customer "${name}" with same mobile exists`;
  return null;
}

export function checkSupplier(name: string, gst: string, mobile: string, o: DupeOpts = {}): string | null {
  const list = active(useErp.getState().suppliers).filter((s) => String(s.id) !== o.excludeId);
  if (gst && list.some((s) => norm(s.gst) === norm(gst))) return `Supplier GSTIN already exists`;
  if (list.some((s) => norm(s.name) === norm(name) && s.mobile === mobile)) return `Supplier "${name}" with same mobile exists`;
  return null;
}

export function checkVehicle(number: string, o: DupeOpts = {}): string | null {
  const list = active(useErp.getState().vehicles).filter((v) => String(v.id) !== o.excludeId);
  return list.some((v) => norm(v.number) === norm(number)) ? `Vehicle ${number} already registered` : null;
}

export function checkDriver(name: string, license: string, o: DupeOpts = {}): string | null {
  const list = active(useErp.getState().drivers).filter((d) => String(d.id) !== o.excludeId);
  if (license && list.some((d) => norm(d.license) === norm(license))) return `Driving licence already exists`;
  if (list.some((d) => norm(d.name) === norm(name))) return `Driver "${name}" already exists`;
  return null;
}

export function checkProduct(code: string, name: string, o: DupeOpts = {}): string | null {
  const list = active(useErp.getState().products).filter((p) => String(p.id) !== o.excludeId);
  if (code && list.some((p) => norm(p.code) === norm(code))) return `Product code "${code}" already exists`;
  if (list.some((p) => norm(p.name) === norm(name))) return `Product "${name}" already exists`;
  return null;
}

export function checkDocNo(kind: "orders" | "weighSlips" | "trips" | "salesInvoices" | "purchaseInvoices", no: string): string | null {
  const s = useErp.getState();
  const field = kind === "weighSlips" ? "slipNo" : kind === "trips" ? "tripNo" : "no";
  const list = s[kind] as unknown as Array<Record<string, unknown>>;
  return list.some((it) => (it[field] as string) === no) ? `Document ${no} already exists` : null;
}
