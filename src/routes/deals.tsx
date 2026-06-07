import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Truck, Scale, FileText, TrendingUp, Eye, Download } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useErp, active } from "@/lib/store";
import { inr } from "@/lib/mock-data";
import { OneShotOrderDialog } from "@/components/one-shot-order";
import { generatePdf } from "@/lib/pdf";

export const Route = createFileRoute("/deals")({
  head: () => ({ meta: [{ title: "Deals — Honey Enterprises ERP" }] }),
  component: DealsPage,
});

interface DealRow {
  date: string;
  customer: string;
  product: string;
  vehicle: string;
  qty: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  orderNo: string;
}

function DealsPage() {
  const orders = active(useErp((s) => s.orders));
  const trips = active(useErp((s) => s.trips));
  const sales = active(useErp((s) => s.salesInvoices));
  const purchases = active(useErp((s) => s.purchaseInvoices));
  const [openShot, setOpenShot] = useState(false);
  const [drill, setDrill] = useState<DealRow | null>(null);

  const rows: DealRow[] = orders.map((o) => {
    const trip = trips.find((t) => t.vehicle === o.vehicle && t.date === o.date);
    const inv = sales.find((s) => s.party === o.customer && s.date === o.date);
    const pur = purchases.find((p) => p.date === o.date);
    const revenue = inv?.amount ?? o.qty * o.rate * 1.05;
    const cost = (pur?.amount ?? Math.round(o.qty * o.rate * 0.7)) + (trip?.expense ?? 0);
    const profit = revenue - cost;
    return {
      date: o.date, customer: o.customer, product: o.product, vehicle: o.vehicle,
      qty: o.qty, revenue, cost, profit,
      margin: revenue ? Math.round((profit / revenue) * 100) : 0,
      orderNo: o.no,
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalRev = rows.reduce((a, r) => a + r.revenue, 0);
  const totalProfit = rows.reduce((a, r) => a + r.profit, 0);
  const avgMargin = rows.length ? Math.round(rows.reduce((a, r) => a + r.margin, 0) / rows.length) : 0;

  function exportPdf() {
    generatePdf({
      title: "Deal Tracker",
      subtitle: `${rows.length} deals • Profitability per dispatch`,
      filename: `deals-${Date.now()}.pdf`,
      head: ["Date", "Customer", "Product", "Vehicle", "Qty", "Revenue", "Cost", "Profit", "Margin"],
      body: rows.map((r) => [r.date, r.customer, r.product, r.vehicle, `${r.qty} MT`, inr(r.revenue), inr(r.cost), inr(r.profit), `${r.margin}%`]),
      totals: [
        { label: "Total revenue", value: inr(totalRev) },
        { label: "Total profit", value: inr(totalProfit) },
        { label: "Avg margin", value: `${avgMargin}%` },
      ],
    });
  }

  return (
    <div>
      <PageHeader
        title="Deal Tracker"
        description="Every dispatch as a unified deal — order, weigh, trip and invoice rolled into one P&L card."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-1 h-4 w-4" />Export PDF</Button>
            <Button size="sm" onClick={() => setOpenShot(true)}><Sparkles className="mr-1 h-4 w-4" />One-Shot Order</Button>
          </>
        }
      />

      <div className="grid gap-4 px-6 pt-6 md:grid-cols-3">
        <StatCard label="Deals" value={String(rows.length)} icon={FileText} tone="info" />
        <StatCard label="Revenue" value={inr(totalRev)} hint={`Profit ${inr(totalProfit)}`} icon={TrendingUp} tone="primary" />
        <StatCard label="Avg Margin" value={`${avgMargin}%`} icon={Sparkles} tone={avgMargin >= 15 ? "success" : "warning"} />
      </div>

      <div className="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-3">
        {rows.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            No deals yet — click <span className="font-medium text-foreground">One-Shot Order</span> to create your first.
          </div>
        )}
        {rows.map((r) => (
          <div key={r.orderNo} className="group rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[11px] text-muted-foreground">{r.orderNo}</p>
                <h3 className="font-display text-base font-semibold text-foreground">{r.customer}</h3>
                <p className="text-xs text-muted-foreground">{r.date}</p>
              </div>
              <Badge variant="outline" className={r.margin >= 20 ? "bg-success/15 text-success" : r.margin >= 10 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}>
                {r.margin}% margin
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1"><Truck className="h-3 w-3" />{r.vehicle}</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1"><Scale className="h-3 w-3" />{r.qty} MT</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1">{r.product}</span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenue</p>
                <p className="text-xs font-semibold tabular-nums">{inr(r.revenue)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost</p>
                <p className="text-xs font-semibold tabular-nums">{inr(r.cost)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Profit</p>
                <p className={`text-xs font-semibold tabular-nums ${r.profit >= 0 ? "text-success" : "text-destructive"}`}>{inr(r.profit)}</p>
              </div>
            </div>

            <Button size="sm" variant="ghost" className="mt-3 w-full" onClick={() => setDrill(r)}>
              <Eye className="mr-1 h-3.5 w-3.5" />View deal
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!drill} onOpenChange={(v) => !v && setDrill(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Deal {drill?.orderNo}</DialogTitle>
            <DialogDescription>{drill?.customer} • {drill?.date}</DialogDescription>
          </DialogHeader>
          {drill && (
            <div className="grid gap-2 text-sm">
              <Row k="Product" v={drill.product} />
              <Row k="Vehicle" v={drill.vehicle} />
              <Row k="Quantity" v={`${drill.qty} MT`} />
              <Row k="Revenue (incl. GST)" v={inr(drill.revenue)} />
              <Row k="Material + freight cost" v={inr(drill.cost)} />
              <div className="mt-2 flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
                <span className="font-medium">Net profit</span>
                <span className={`font-display text-lg font-semibold ${drill.profit >= 0 ? "text-success" : "text-destructive"}`}>{inr(drill.profit)} • {drill.margin}%</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <OneShotOrderDialog open={openShot} onOpenChange={setOpenShot} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="font-medium tabular-nums">{v}</span>
    </div>
  );
}
