import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Factory, Star, IndianRupee, Receipt, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { newId, useErp, active } from "@/lib/store";
import { nextNo } from "@/lib/numbering";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inr } from "@/lib/mock-data";
import { supplierProfile } from "@/lib/insights";

export const Route = createFileRoute("/suppliers/$id")({
  head: () => ({ meta: [{ title: "Supplier 360 — Honey Enterprises ERP" }] }),
  component: Supplier360,
});

function Supplier360() {
  
 
  const { id } = useParams({ from: "/suppliers/$id" });

const supplier = useErp((s) =>
  s.suppliers.find((x) => String(x.id) === String(id))
);

const invoices = active(useErp((s) => s.purchaseInvoices));
const payments = useErp((s) => s.payments).filter((p) => !p.cancelled);

const [payOpen, setPayOpen] = useState(false);
const [amount, setAmount] = useState(0);
const [mode, setMode] =
  useState<"Cash" | "Bank" | "UPI" | "Cheque">("Bank");
const [reference, setReference] = useState("");
const [note, setNote] = useState("");

if (!supplier) {
  return (
    <div className="p-10">
      <Button variant="ghost" asChild>
        <Link to="/suppliers">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>
      </Button>

      <p className="mt-4 text-sm text-muted-foreground">
        Supplier not found.
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
        Supplier ID: {id}
      </p>
    </div>
  );
}

const p = supplierProfile(supplier, {
  invoices,
  payments,
});
const outstanding =
  p.purchases - p.paid + (supplier.outstanding || 0);
  return (
    <div>
      <PageHeader
        title={supplier.name}
        description={`${supplier.code} • ${supplier.city || "—"} • Supplier 360° view`}
        actions={<Button variant="outline" size="sm" asChild><Link to="/suppliers"><ArrowLeft className="mr-1 h-4 w-4" />All suppliers</Link></Button>}
      />

      <div className="grid gap-4 px-6 pt-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Outstanding" value={inr(outstanding)} icon={IndianRupee} tone={outstanding > 0 ? "warning" : "success"} />
        <StatCard label="Total purchases" value={inr(p.purchases)} hint={`${p.invoices.length} bills`} icon={Factory} tone="primary" />
        <StatCard label="Paid" value={inr(p.paid)} hint={`${p.payments.length} payments`} icon={Wallet} tone="info" />
        <StatCard label="Rating" value={"★".repeat(p.rating) + "☆".repeat(5 - p.rating)} hint={`Avg bill ${inr(p.avg)}`} icon={Star} tone={p.rating >= 4 ? "success" : p.rating >= 3 ? "warning" : "destructive"} />
      </div>

      <div className="grid gap-4 px-6 py-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Receipt className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold">Purchase history</h3>
          </div>
          {p.invoices.length === 0 ? <p className="px-4 py-8 text-center text-xs text-muted-foreground">No purchases.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Bill</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{p.invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.no}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{i.date}</TableCell>
                  <TableCell className="text-right tabular-nums">{inr(i.amount)}</TableCell>
                  <TableCell><Badge variant="outline">{i.status}</Badge></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Wallet className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold">Payment history</h3>
          </div>
          {p.payments.length === 0 ? <p className="px-4 py-8 text-center text-xs text-muted-foreground">No payments yet.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Voucher</TableHead><TableHead>Date</TableHead><TableHead>Mode</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>{p.payments.map((pay) => (
                <TableRow key={pay.id}>
                  <TableCell className="font-mono text-xs">{pay.no}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{pay.date}</TableCell>
                  <TableCell>{pay.mode}</TableCell>
                  <TableCell className="text-right tabular-nums">{inr(pay.amount)}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </div>
      </div>
      <div className="px-6 pb-6">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setPayOpen(true)}><Wallet className="mr-1 h-4 w-4" />Record payment</Button>
        </div>
      </div>

      <Dialog open={payOpen} onOpenChange={(v) => !v && setPayOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>{supplier.name} • Outstanding {inr(outstanding)}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label className="text-xs">Date</Label><Input type="date" value={new Date().toISOString().slice(0, 10)} readOnly /></div>
            <div className="grid gap-1.5"><Label className="text-xs">Amount</Label><Input type="number" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} /></div>
            <div className="grid gap-1.5"><Label className="text-xs">Mode</Label>
              <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={mode} onChange={(e) => setMode(e.target.value as any)}>
                <option>Cash</option><option>Bank</option><option>UPI</option><option>Cheque</option>
              </select>
            </div>
            <div className="grid gap-1.5"><Label className="text-xs">Reference</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} /></div>
            <div className="grid gap-1.5 col-span-2"><Label className="text-xs">Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (amount <= 0) return toast.error("Enter amount");
              const no = nextNo("PAY" as never) || `PAY/${Date.now().toString().slice(-6)}`;
              useErp.getState().add("payments", {
                id: newId("pay"), no, date: new Date().toISOString().slice(0, 10), direction: "Out", party: supplier.name, mode, amount, reference, note,
              });
              toast.success("Payment recorded", { description: `${inr(amount)} to ${supplier.name}` });
              setPayOpen(false);
              setAmount(0); setReference(""); setNote("");
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
