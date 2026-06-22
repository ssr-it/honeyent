import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Phone, MapPin, CreditCard, TrendingUp, ShoppingCart, Receipt, Wallet, Calendar } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inr, statusTone } from "@/lib/mock-data";
import { useErp, active, loadBackendData, newId } from "@/lib/store";
import { nextNo } from "@/lib/numbering";
import { customerProfile } from "@/lib/insights";
import { DateRangeFilter, EMPTY_RANGE, inRange, type DateRange } from "@/components/date-range-filter";

export const Route = createFileRoute("/customers/$id")({
  head: () => ({ meta: [{ title: "Customer 360 — Honey Enterprises ERP" }] }),
  component: Customer360,
  notFoundComponent: () => <div className="p-10 text-sm text-muted-foreground">Customer not found.</div>,
});

function Customer360() {
  const { id } = useParams({ from: "/customers/$id" });
  const allCustomers = useErp((s) => s.customers);
  const customer = allCustomers.find((c) => String(c.id) === id);
  const orders = active(useErp((s) => s.orders));
  const invoices = active(useErp((s) => s.salesInvoices));
  const payments = useErp((s) => s.payments).filter((p) => !p.cancelled);
  const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
  const [loading, setLoading] = useState(allCustomers.length === 0);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState(0);
  const [receiptMode, setReceiptMode] = useState<"Cash" | "Bank" | "UPI" | "Cheque">("Bank");
  const [receiptReference, setReceiptReference] = useState("");
  const [receiptNote, setReceiptNote] = useState("");

  useEffect(() => {
    // Always load data on mount to ensure customer exists
    setLoading(true);
    loadBackendData().then(() => {
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-10 text-sm text-muted-foreground">Loading customer data...</div>;
  }

  if (!customer) {
    return (
      <div className="p-10">
        <Button variant="ghost" asChild><Link to="/customers"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link></Button>
        <p className="mt-4 text-sm text-muted-foreground">Customer not found.</p>
        <p className="mt-2 text-xs text-muted-foreground">Looking for ID: {id}</p>
        <p className="mt-2 text-xs text-muted-foreground">Available customers ({allCustomers.length}): {allCustomers.map((c) => `${c.id}(${c.name})`).join(", ")}</p>
      </div>
    );
  }

  const p = customerProfile(customer, { orders, invoices, payments });
  const balance = customer.outstanding;
  const limitUsed = customer.creditLimit ? Math.round((balance / customer.creditLimit) * 100) : 0;

  const visibleOrders = orders.filter((o) => o.customer === customer.name && inRange(o.date, range));
  const visibleInvoices = invoices.filter((i) => i.party === customer.name && inRange(i.date, range));
  const visiblePayments = payments.filter((pmt) => pmt.party === customer.name && pmt.direction === "In" && inRange(pmt.date, range));

  const salesTotal = visibleOrders.reduce((sum, o) => sum + o.qty * o.rate, 0);
  const invoiceTotal = visibleInvoices.reduce((sum, i) => sum + i.amount, 0);
  const receiptTotal = visiblePayments.reduce((sum, pmt) => sum + pmt.amount, 0);

  const supplierTotals = Array.from(
    visibleOrders.reduce((map, order) => {
      const supplier = order.supplier || "Unknown supplier";
      const value = order.qty * order.rate;
      const existing = map.get(supplier) ?? { amount: 0, orders: 0 };
      existing.amount += value;
      existing.orders += 1;
      map.set(supplier, existing);
      return map;
    }, new Map<string, { amount: number; orders: number }>()),
  );

  const recordReceipt = () => {
    if (receiptAmount <= 0) {
      toast.error("Enter a receipt amount");
      return;
    }
    const no = nextNo("PAY" as never) || `PAY/${Date.now().toString().slice(-6)}`;
    useErp.getState().add("payments", {
      id: newId("pay"),
      no,
      date: new Date().toISOString().slice(0, 10),
      direction: "In",
      party: customer.name,
      mode: receiptMode,
      amount: receiptAmount,
      reference: receiptReference,
      note: receiptNote,
    });
    toast.success("Receipt recorded", { description: `${inr(receiptAmount)} from ${customer.name}` });
    setReceiptOpen(false);
    setReceiptAmount(0);
    setReceiptReference("");
    setReceiptNote("");
  };

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={`${customer.code} • ${customer.city || "—"} • Customer register with sales, receipts, orders, and supplier activity`}
        actions={<Button variant="outline" size="sm" asChild><Link to="/customers"><ArrowLeft className="mr-1 h-4 w-4" />All customers</Link></Button>}
      />

      <div className="space-y-4 px-6 pb-6">
        <DateRangeFilter value={range} onChange={setRange} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Outstanding" value={inr(balance)} hint={`${limitUsed}% of limit`} icon={CreditCard} tone={limitUsed > 100 ? "destructive" : limitUsed > 80 ? "warning" : "info"} />
          <StatCard label="Sales value" value={inr(salesTotal)} hint={`${visibleOrders.length} orders`} icon={ShoppingCart} tone="success" />
          <StatCard label="Invoice value" value={inr(invoiceTotal)} hint={`${visibleInvoices.length} invoices`} icon={TrendingUp} tone="info" />
          <StatCard label="Receipts" value={inr(receiptTotal)} hint={`${visiblePayments.length} receipts`} icon={Receipt} tone="primary" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => setReceiptOpen(true)}><Wallet className="mr-1 h-4 w-4" />Record receipt</Button>
          <Button size="sm" variant="outline" asChild><Link to="/operations"><ShoppingCart className="mr-1 h-4 w-4" />Open Operations</Link></Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="font-display text-sm font-semibold">Profile</h3>
            <div className="mt-3 space-y-2 text-sm">
              <Row icon={Phone} label="Mobile" value={customer.mobile} />
              <Row label="GSTIN" value={customer.gst || "—"} mono />
              <Row icon={MapPin} label="City" value={customer.city || "—"} />
              <Row label="Credit limit" value={inr(customer.creditLimit)} />
              <Row label="Status" value={customer.status} />
              <Row label="Suppliers" value={`${supplierTotals.length}`} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-2">
            <h3 className="font-display text-sm font-semibold">Top products purchased</h3>
            {p.topProducts.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">No purchases yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {p.topProducts.map(([prod, qty]) => {
                  const max = p.topProducts[0][1];
                  return (
                    <li key={prod}>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{prod}</span>
                        <span className="tabular-nums text-muted-foreground">{qty} MT</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(qty / max) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Order register" icon={ShoppingCart} empty={visibleOrders.length === 0}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.no}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.date}</TableCell>
                    <TableCell>{o.product}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.qty}</TableCell>
                    <TableCell className="text-right tabular-nums">{inr(o.qty * o.rate)}</TableCell>
                    <TableCell className="font-mono text-xs">{o.vehicle}</TableCell>
                    <TableCell>{o.driver || "—"}</TableCell>
                    <TableCell>{o.supplier || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={statusTone[o.status]}>{o.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>

          <div className="space-y-4">
            <Panel title="Invoice register" icon={TrendingUp} empty={visibleInvoices.length === 0}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleInvoices.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.no}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{i.date}</TableCell>
                      <TableCell className="text-right tabular-nums">{inr(i.amount)}</TableCell>
                      <TableCell><Badge variant="outline" className={i.status === "Paid" ? "bg-success/15 text-success" : i.status === "Partial" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}>{i.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>

            <Panel title="Receipt register" icon={Wallet} empty={visiblePayments.length === 0}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblePayments.map((pay) => (
                    <TableRow key={pay.id}>
                      <TableCell className="font-mono text-xs">{pay.no}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{pay.date}</TableCell>
                      <TableCell className="text-right tabular-nums text-success">{inr(pay.amount)}</TableCell>
                      <TableCell>{pay.mode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
          </div>
        </div>

        <Panel title="Supplier activity" icon={ShoppingCart} empty={supplierTotals.length === 0}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplierTotals.map(([name, summary]) => (
                <TableRow key={name}>
                  <TableCell>{name}</TableCell>
                  <TableCell className="text-right tabular-nums">{summary.orders}</TableCell>
                  <TableCell className="text-right tabular-nums">{inr(summary.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>

      <Dialog open={receiptOpen} onOpenChange={(open) => !open && setReceiptOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record receipt</DialogTitle>
            <DialogDescription>{customer.name} • Outstanding {inr(balance)}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><Input type="date" value={new Date().toISOString().slice(0, 10)} readOnly /></Field>
            <Field label="Amount"><Input type="number" value={receiptAmount || ""} onChange={(e) => setReceiptAmount(Number(e.target.value))} /></Field>
            <Field label="Mode">
              <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={receiptMode} onChange={(e) => setReceiptMode(e.target.value as typeof receiptMode)}>
                <option>Cash</option>
                <option>Bank</option>
                <option>UPI</option>
                <option>Cheque</option>
              </select>
            </Field>
            <Field label="Reference"><Input value={receiptReference} onChange={(e) => setReceiptReference(e.target.value)} /></Field>
            <Field label="Note" full><Input value={receiptNote} onChange={(e) => setReceiptNote(e.target.value)} placeholder="Optional remark" /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptOpen(false)}>Cancel</Button>
            <Button onClick={recordReceipt}>Save receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={`grid gap-1.5 ${full ? "col-span-2" : ""}`}><Label className="text-xs">{label}</Label>{children}</div>;
}

function Row({ icon: Icon, label, value, mono }: { icon?: React.ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{Icon && <Icon className="h-3 w-3" />}{label}</span>
      <span className={mono ? "font-mono text-xs" : "text-sm font-medium"}>{value}</span>
    </div>
  );
}

function Panel({ title, icon: Icon, empty, children }: { title: string; icon: React.ComponentType<{ className?: string }>; empty?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold">{title}</h3>
      </div>
      {empty ? <p className="px-4 py-8 text-center text-xs text-muted-foreground">No records yet.</p> : children}
    </div>
  );
}
