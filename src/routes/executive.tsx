import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, TrendingUp, IndianRupee, Users, Truck, IdCard, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { AlertCenter } from "@/components/alert-center";
import { Button } from "@/components/ui/button";
import { useErp, active } from "@/lib/store";
import { inr } from "@/lib/mock-data";
import { businessInsights } from "@/lib/insights";

export const Route = createFileRoute("/executive")({
  head: () => ({ meta: [{ title: "Executive Dashboard — Honey Enterprises ERP" }] }),
  component: Executive,
});

function Executive() {
  const customers = active(useErp((s) => s.customers));
  const vehicles = active(useErp((s) => s.vehicles));
  const drivers = active(useErp((s) => s.drivers));
  const orders = active(useErp((s) => s.orders));
  const trips = active(useErp((s) => s.trips));
  const invoices = active(useErp((s) => s.salesInvoices));
  const purchases = active(useErp((s) => s.purchaseInvoices));
  const payments = useErp((s) => s.payments).filter((p) => !p.cancelled);
  const expenses = useErp((s) => s.expenses).filter((e) => !e.cancelled);

  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);

  const todayTrips = trips.filter((t) => t.date === today);
  const monthTrips = trips.filter((t) => typeof t.date === "string" && t.date.startsWith(month));
  const todayRevenue = todayTrips.reduce((a, t) => a + t.revenue, 0);
  const todayProfit = todayTrips.reduce((a, t) => a + (t.revenue - t.expense), 0);
  const todayCollection = payments.filter((p) => p.date === today && p.direction === "In").reduce((a, p) => a + p.amount, 0);
  const monthRevenue = monthTrips.reduce((a, t) => a + t.revenue, 0);
  const monthProfit = monthTrips.reduce((a, t) => a + (t.revenue - t.expense), 0);

  const outCust = customers.reduce((a, c) => a + c.outstanding, 0);
  const outSupp = purchases.reduce((a, i) => a + i.amount, 0) - payments.filter((p) => p.direction === "Out").reduce((a, p) => a + p.amount, 0);

  // top lists
  const custRev = new Map<string, number>();
  invoices.forEach((i) => custRev.set(i.party, (custRev.get(i.party) ?? 0) + i.amount));
  const topCust = [...custRev.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const prodQty = new Map<string, number>();
  orders.forEach((o) => prodQty.set(o.product, (prodQty.get(o.product) ?? 0) + o.qty));
  const topProd = [...prodQty.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const routeMap = new Map<string, number>();
  trips.forEach((t) => { const k = `${t.source} → ${t.destination}`; routeMap.set(k, (routeMap.get(k) ?? 0) + (t.revenue - t.expense)); });
  const topRoutes = [...routeMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const vehMap = new Map<string, number>();
  trips.forEach((t) => vehMap.set(t.vehicle, (vehMap.get(t.vehicle) ?? 0) + (t.revenue - t.expense)));
  const topVeh = [...vehMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const drvMap = new Map<string, number>();
  trips.forEach((t) => drvMap.set(t.driver, (drvMap.get(t.driver) ?? 0) + t.weight));
  const topDrv = [...drvMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const insights = businessInsights({ customers, vehicles, drivers, trips, invoices, payments, expenses, orders });

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="Director-level view: revenue, profitability, outstanding and business intelligence."
        actions={<Button variant="outline" size="sm" asChild><Link to="/control-tower">Live operations</Link></Button>}
      />

      <div className="grid gap-4 px-6 pt-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today revenue" value={inr(todayRevenue)} hint={`Profit ${inr(todayProfit)}`} icon={IndianRupee} tone="success" />
        <StatCard label="Today collection" value={inr(todayCollection)} icon={ArrowUpRight} tone="primary" />
        <StatCard label="Month revenue" value={inr(monthRevenue)} hint={`Profit ${inr(monthProfit)}`} icon={TrendingUp} tone="info" />
        <StatCard label="Net receivable" value={inr(outCust - outSupp)} hint={`Cust ${inr(outCust)} · Supp ${inr(outSupp)}`} icon={ArrowDownRight} tone={outCust > outSupp ? "warning" : "success"} />
      </div>

      <div className="grid gap-4 px-6 py-6 lg:grid-cols-3">
        <RankCard title="Top customers" icon={Users} items={topCust.map(([k, v]) => ({ k, v: inr(v) }))} />
        <RankCard title="Top products" icon={Crown} items={topProd.map(([k, v]) => ({ k, v: `${v} MT` }))} />
        <RankCard title="Top routes by profit" icon={ArrowUpRight} items={topRoutes.map(([k, v]) => ({ k, v: inr(v) }))} />
        <RankCard title="Top vehicles" icon={Truck} items={topVeh.map(([k, v]) => ({ k, v: inr(v) }))} />
        <RankCard title="Top drivers (MT moved)" icon={IdCard} items={topDrv.map(([k, v]) => ({ k, v: `${v} MT` }))} />

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold">Business intelligence</h3>
          </div>
          <ul className="divide-y divide-border">
            {insights.length === 0 && <li className="p-4 text-xs text-muted-foreground">Not enough data yet.</li>}
            {insights.map((i, idx) => (
              <li key={idx} className="flex items-start justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{i.label}</p>
                  <p className="truncate text-sm font-medium">{i.value}</p>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] tabular-nums ${i.tone === "good" ? "bg-success/15 text-success" : i.tone === "bad" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{i.sub}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="px-6 pb-6">
        <AlertCenter limit={6} />
      </div>
    </div>
  );
}

function RankCard({ title, icon: Icon, items }: { title: string; icon: React.ComponentType<{ className?: string }>; items: { k: string; v: string }[] }) {
  const max = items.length;
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold">{title}</h3>
      </div>
      {items.length === 0 ? <p className="px-4 py-6 text-center text-xs text-muted-foreground">No data yet.</p> : (
        <ol className="divide-y divide-border">
          {items.map((it, i) => (
            <li key={it.k} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">{i + 1}</span>
                <span className="truncate">{it.k}</span>
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{it.v}</span>
            </li>
          )).slice(0, max)}
        </ol>
      )}
    </div>
  );
}
