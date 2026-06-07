import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Factory, IndianRupee, Search, Eye, Download, MessageCircle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { useErp, active, newId } from "@/lib/store";
import { inr } from "@/lib/mock-data";
import { nextNo } from "@/lib/numbering";
import { generatePdf } from "@/lib/pdf";
import { shareWhatsApp } from "@/lib/share";

export const Route = createFileRoute("/ledger")({
  head: () => ({ meta: [{ title: "Ledger 360° — Honey Enterprises ERP" }] }),
  component: LedgerPage,
});

type Side = "customer" | "supplier";

interface LedgerLine {
  date: string;
  particulars: string;
  ref: string;
  debit: number;
  credit: number;
}

function LedgerPage() {
  const customers = active(useErp((s) => s.customers));
  const suppliers = active(useErp((s) => s.suppliers));
  const sales = active(useErp((s) => s.salesInvoices));
  const purchases = active(useErp((s) => s.purchaseInvoices));
  const payments = active(useErp((s) => s.payments));
  const add = useErp((s) => s.add);

  const [side, setSide] = useState<Side>("customer");
  const [q, setQ] = useState("");
  const [view, setView] = useState<{ name: string; side: Side } | null>(null);
  const [payOpen, setPayOpen] = useState<{ name: string; side: Side; amount: number } | null>(null);

  const totalRecv = customers.reduce((a, c) => a + outstandingFor(c.name, "customer", sales, payments, c.outstanding), 0);
  const totalPay = suppliers.reduce((a, s) => a + outstandingFor(s.name, "supplier", purchases, payments, s.outstanding), 0);

  const parties = (side === "customer" ? customers : suppliers)
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  function lines(name: string, side: Side): LedgerLine[] {
    const out: LedgerLine[] = [];
    if (side === "customer") {
      sales.filter((s) => s.party === name).forEach((s) => out.push({
        date: s.date, particulars: "Sales Invoice", ref: s.no, debit: s.amount, credit: 0,
      }));
      payments.filter((p) => p.party === name && p.direction === "In").forEach((p) => out.push({
        date: p.date, particulars: `Receipt (${p.mode})`, ref: p.no, debit: 0, credit: p.amount,
      }));
    } else {
      purchases.filter((s) => s.party === name).forEach((s) => out.push({
        date: s.date, particulars: "Purchase Bill", ref: s.no, debit: 0, credit: s.amount,
      }));
      payments.filter((p) => p.party === name && p.direction === "Out").forEach((p) => out.push({
        date: p.date, particulars: `Payment (${p.mode})`, ref: p.no, debit: p.amount, credit: 0,
      }));
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }

  function balanceFor(name: string, s: Side): number {
    const seedRow = s === "customer"
      ? customers.find((c) => c.name === name)
      : suppliers.find((x) => x.name === name);
    const seed = seedRow?.outstanding ?? 0;
    const ls = lines(name, s);
    const movement = ls.reduce((a, l) => a + (s === "customer" ? l.debit - l.credit : l.credit - l.debit), 0);
    return seed + movement;
  }

  function pdf(name: string, s: Side) {
    const ls = lines(name, s);
    let bal = (s === "customer" ? customers : suppliers).find((p) => p.name === name)?.outstanding ?? 0;
    const body = ls.map((l) => {
      bal += s === "customer" ? l.debit - l.credit : l.credit - l.debit;
      return [l.date, l.particulars, l.ref, l.debit ? inr(l.debit) : "—", l.credit ? inr(l.credit) : "—", inr(bal)];
    });
    generatePdf({
      title: `Ledger — ${name}`,
      subtitle: `${s === "customer" ? "Customer" : "Supplier"} account statement`,
      filename: `ledger-${name.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      head: ["Date", "Particulars", "Ref", "Debit", "Credit", "Balance"],
      body: body.length ? body : [[ "—", "Opening balance carried forward", "—", "—", "—", inr(bal)]],
      totals: [{ label: "Closing balance", value: inr(bal) }],
    });
  }

  function wa(name: string, s: Side) {
    const bal = balanceFor(name, s);
    const msg = `Dear ${name},\n${s === "customer" ? "Your outstanding balance with us" : "Our payable to you"} is ${inr(bal)} as on ${new Date().toLocaleDateString("en-IN")}.\n— Honey Enterprises`;
    shareWhatsApp(msg);
  }

  function recordPayment(form: { date: string; amount: number; mode: "Cash" | "Bank" | "UPI" | "Cheque"; reference: string; note: string }) {
    if (!payOpen) return;
    const no = nextNo("PAY" as never) || `PAY/${Date.now().toString().slice(-6)}`;
    add("payments", {
      id: newId("pay"),
      no,
      date: form.date,
      direction: payOpen.side === "customer" ? "In" : "Out",
      party: payOpen.name,
      mode: form.mode,
      amount: form.amount,
      reference: form.reference,
      note: form.note,
    });
    toast.success(`${payOpen.side === "customer" ? "Receipt" : "Payment"} recorded`, { description: `${inr(form.amount)} ${payOpen.side === "customer" ? "from" : "to"} ${payOpen.name}` });
    setPayOpen(null);
  }

  return (
    <div>
      <PageHeader
        title="Ledger 360°"
        description="Live party accounts with payments, ageing and one-tap PDF + WhatsApp reminders."
      />
      <div className="grid gap-4 px-6 pt-6 md:grid-cols-2">
        <StatCard label="Total receivable" value={inr(totalRecv)} hint={`${customers.length} customers`} icon={Users} tone="success" />
        <StatCard label="Total payable" value={inr(totalPay)} hint={`${suppliers.length} suppliers`} icon={Factory} tone="warning" />
      </div>

      <div className="p-6">
        <Tabs value={side} onValueChange={(v) => setSide(v as Side)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="customer"><Users className="mr-1 h-3.5 w-3.5" />Customers</TabsTrigger>
              <TabsTrigger value="supplier"><Factory className="mr-1 h-3.5 w-3.5" />Suppliers</TabsTrigger>
            </TabsList>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search party…" className="h-9 pl-8" />
            </div>
          </div>

          <TabsContent value={side} className="mt-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {parties.map((p) => {
                const bal = balanceFor(p.name, side);
                const limit = "creditLimit" in p ? p.creditLimit : 0;
                const overLimit = side === "customer" && limit > 0 && bal > limit;
                return (
                  <div key={p.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-sm font-semibold">{p.name}</h3>
                        <p className="text-xs text-muted-foreground">{p.mobile} • {("city" in p && p.city) || "—"}</p>
                      </div>
                      {overLimit && <Badge variant="outline" className="bg-destructive/15 text-destructive">Over limit</Badge>}
                    </div>
                    <div className="mt-3 rounded-md bg-muted/40 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{side === "customer" ? "Receivable" : "Payable"}</p>
                      <p className={`font-display text-lg font-semibold ${bal > 0 ? "text-warning" : "text-success"}`}>{inr(bal)}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1">
                      <Button size="sm" variant="ghost" className="h-8 text-[11px]" onClick={() => setView({ name: p.name, side })}>
                        <Eye className="mr-1 h-3 w-3" />Open
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-[11px]" onClick={() => wa(p.name, side)}>
                        <MessageCircle className="mr-1 h-3 w-3" />Remind
                      </Button>
                      <Button size="sm" variant="default" className="h-8 text-[11px]" onClick={() => setPayOpen({ name: p.name, side, amount: bal })}>
                        <IndianRupee className="mr-1 h-3 w-3" />{side === "customer" ? "Receive" : "Pay"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ledger drawer */}
      <Dialog open={!!view} onOpenChange={(v) => !v && setView(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{view?.name}</DialogTitle>
            <DialogDescription>Running ledger statement</DialogDescription>
          </DialogHeader>
          {view && <LedgerTable name={view.name} side={view.side} compute={lines} seed={(view.side === "customer" ? customers : suppliers).find((p) => p.name === view.name)?.outstanding ?? 0} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => view && wa(view.name, view.side)}><MessageCircle className="mr-1 h-4 w-4" />WhatsApp</Button>
            <Button onClick={() => view && pdf(view.name, view.side)}><Download className="mr-1 h-4 w-4" />Download PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentDialog open={!!payOpen} onClose={() => setPayOpen(null)} target={payOpen} onSubmit={recordPayment} />
    </div>
  );
}

function outstandingFor(name: string, side: Side, bills: { party: string; amount: number }[], payments: { party: string; direction: string; amount: number }[], seed: number) {
  const billed = bills.filter((b) => b.party === name).reduce((a, b) => a + b.amount, 0);
  const paid = payments.filter((p) => p.party === name && p.direction === (side === "customer" ? "In" : "Out")).reduce((a, p) => a + p.amount, 0);
  return seed + billed - paid;
}

function LedgerTable({ name, side, compute, seed }: { name: string; side: Side; compute: (n: string, s: Side) => LedgerLine[]; seed: number }) {
  const ls = useMemo(() => compute(name, side), [name, side, compute]);
  let bal = seed;
  return (
    <div className="overflow-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Particulars</th><th className="p-2 text-left">Ref</th><th className="p-2 text-right">Debit</th><th className="p-2 text-right">Credit</th><th className="p-2 text-right">Balance</th></tr>
        </thead>
        <tbody>
          <tr className="border-t border-border bg-muted/20"><td className="p-2 italic text-muted-foreground" colSpan={5}>Opening balance</td><td className="p-2 text-right font-medium tabular-nums">{inr(bal)}</td></tr>
          {ls.map((l, i) => {
            bal += side === "customer" ? l.debit - l.credit : l.credit - l.debit;
            return (
              <tr key={i} className="border-t border-border">
                <td className="p-2">{l.date}</td>
                <td className="p-2">{l.particulars}</td>
                <td className="p-2 font-mono">{l.ref}</td>
                <td className="p-2 text-right tabular-nums">{l.debit ? inr(l.debit) : "—"}</td>
                <td className="p-2 text-right tabular-nums">{l.credit ? inr(l.credit) : "—"}</td>
                <td className="p-2 text-right font-medium tabular-nums">{inr(bal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PaymentDialog({ open, onClose, target, onSubmit }: { open: boolean; onClose: () => void; target: { name: string; side: Side; amount: number } | null; onSubmit: (f: { date: string; amount: number; mode: "Cash" | "Bank" | "UPI" | "Cheque"; reference: string; note: string }) => void }) {
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), amount: 0, mode: "Bank" as const, reference: "", note: "" });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{target?.side === "customer" ? "Receive payment" : "Make payment"}</DialogTitle>
          <DialogDescription>{target?.name} • Outstanding {inr(target?.amount ?? 0)}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Amount"><Input type="number" value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} /></Field>
          <Field label="Mode">
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as typeof f.mode })}>
              <option>Cash</option><option>Bank</option><option>UPI</option><option>Cheque</option>
            </select>
          </Field>
          <Field label="Reference (UTR / Cheque)"><Input value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></Field>
          <Field label="Note" full><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Optional remark" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => f.amount > 0 ? onSubmit(f) : toast.error("Enter amount")}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={`grid gap-1.5 ${full ? "col-span-2" : ""}`}><Label className="text-xs">{label}</Label>{children}</div>;
}
