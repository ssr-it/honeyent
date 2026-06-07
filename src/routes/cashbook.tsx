import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Plus, Download, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useErp, active, newId } from "@/lib/store";
import { inr } from "@/lib/mock-data";
import { generatePdf } from "@/lib/pdf";

export const Route = createFileRoute("/cashbook")({
  head: () => ({ meta: [{ title: "Cashbook — Honey Enterprises ERP" }] }),
  component: CashbookPage,
});

function CashbookPage() {
  const payments = useErp((s) => s.payments);
  const trips = active(useErp((s) => s.trips));
  const add = useErp((s) => s.add);

  const [open, setOpen] = useState(false);

  const movements = useMemo(() => {
    const out: { date: string; party: string; mode: string; direction: "In" | "Out"; amount: number; note: string; source: string }[] = [];
    active(payments).forEach((p) => out.push({
      date: p.date, party: p.party, mode: p.mode, direction: p.direction, amount: p.amount,
      note: p.note ?? "", source: p.no,
    }));
    trips.forEach((t) => {
      if (t.expense > 0) out.push({
        date: t.date, party: `Trip ${t.tripNo} (${t.driver})`, mode: "Cash", direction: "Out", amount: t.expense, note: `${t.source} → ${t.destination}`, source: t.tripNo,
      });
    });
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, trips]);

  const totalIn = movements.filter((m) => m.direction === "In").reduce((a, m) => a + m.amount, 0);
  const totalOut = movements.filter((m) => m.direction === "Out").reduce((a, m) => a + m.amount, 0);
  const balance = totalIn - totalOut;

  function exportPdf() {
    let bal = 0;
    const body = [...movements].reverse().map((m) => {
      bal += m.direction === "In" ? m.amount : -m.amount;
      return [m.date, m.party, m.mode, m.direction === "In" ? inr(m.amount) : "—", m.direction === "Out" ? inr(m.amount) : "—", inr(bal)];
    }).reverse();
    generatePdf({
      title: "Cashbook",
      subtitle: "All money movements — receipts, payments and trip expenses",
      filename: `cashbook-${Date.now()}.pdf`,
      head: ["Date", "Particulars", "Mode", "In", "Out", "Balance"],
      body,
      totals: [
        { label: "Total in", value: inr(totalIn) },
        { label: "Total out", value: inr(totalOut) },
        { label: "Net balance", value: inr(balance) },
      ],
    });
  }

  function quickAdd(form: { date: string; direction: "In" | "Out"; party: string; mode: "Cash" | "Bank" | "UPI" | "Cheque"; amount: number; note: string }) {
    add("payments", {
      id: newId("pay"),
      no: `PAY/${Date.now().toString().slice(-6)}`,
      ...form,
    });
    toast.success("Entry recorded", { description: `${form.direction === "In" ? "Received" : "Paid"} ${inr(form.amount)}` });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Cashbook"
        description="Single view of every rupee — receipts, payments, fuel and trip expenses."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-1 h-4 w-4" />Export PDF</Button>
            <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />New entry</Button>
          </>
        }
      />

      <div className="grid gap-4 px-6 pt-6 md:grid-cols-3">
        <StatCard label="Money in" value={inr(totalIn)} icon={ArrowDownCircle} tone="success" />
        <StatCard label="Money out" value={inr(totalOut)} icon={ArrowUpCircle} tone="warning" />
        <StatCard label="Net balance" value={inr(balance)} icon={Wallet} tone={balance >= 0 ? "primary" : "destructive"} />
      </div>

      <div className="p-6">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-semibold">Daybook</h2>
            </div>
            <Badge variant="outline">{movements.length} entries</Badge>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">In</TableHead>
                  <TableHead className="text-right">Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No money movements yet.</TableCell></TableRow>
                )}
                {movements.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground">{m.date}</TableCell>
                    <TableCell><div className="font-medium">{m.party}</div>{m.note && <div className="text-[11px] text-muted-foreground">{m.note}</div>}</TableCell>
                    <TableCell><Badge variant="outline">{m.mode}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums text-success">{m.direction === "In" ? inr(m.amount) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums text-warning">{m.direction === "Out" ? inr(m.amount) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <QuickAddDialog open={open} onClose={() => setOpen(false)} onSubmit={quickAdd} />
    </div>
  );
}

function QuickAddDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (f: { date: string; direction: "In" | "Out"; party: string; mode: "Cash" | "Bank" | "UPI" | "Cheque"; amount: number; note: string }) => void }) {
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), direction: "In" as "In" | "Out", party: "", mode: "Cash" as "Cash" | "Bank" | "UPI" | "Cheque", amount: 0, note: "" });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New cashbook entry</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <F label="Date"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></F>
          <F label="Direction">
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={f.direction} onChange={(e) => setF({ ...f, direction: e.target.value as "In" | "Out" })}>
              <option value="In">Money In</option><option value="Out">Money Out</option>
            </select>
          </F>
          <F label="Party / Head" full><Input value={f.party} onChange={(e) => setF({ ...f, party: e.target.value })} placeholder="Customer / Supplier / Diesel / Salary" /></F>
          <F label="Mode">
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value as typeof f.mode })}>
              <option>Cash</option><option>Bank</option><option>UPI</option><option>Cheque</option>
            </select>
          </F>
          <F label="Amount"><Input type="number" value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} /></F>
          <F label="Note" full><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Optional" /></F>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => f.party && f.amount ? onSubmit(f) : toast.error("Enter party and amount")}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={`grid gap-1.5 ${full ? "col-span-2" : ""}`}><Label className="text-xs">{label}</Label>{children}</div>;
}
