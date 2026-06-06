import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Truck,
  ShoppingCart,
  Scale,
  IndianRupee,
  AlertTriangle,
  CalendarClock,
  TrendingUp,
  Route as RouteIcon,
  Sparkles,
} from "lucide-react";
import { OneShotOrderDialog } from "@/components/one-shot-order";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  daysUntil,
  inr,
  statusTone,
} from "@/lib/mock-data";
import { useErp, active } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Honey Enterprises ERP" },
      { name: "description", content: "Daily operations dashboard: orders, dispatch, trips, revenue and alerts." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const customers = active(useErp((s) => s.customers));
  const vehicles = active(useErp((s) => s.vehicles));
  const orders = active(useErp((s) => s.orders));
  const [oneShot, setOneShot] = useState(false);
  const trips = active(useErp((s) => s.trips));

  const todayRevenue = trips.reduce((a, t) => a + t.revenue, 0);
  const todayProfit = trips.reduce((a, t) => a + (t.revenue - t.expense), 0);
  const outstanding = customers.reduce((a, c) => a + c.outstanding, 0);
  const inTransit = orders.filter((o) => o.status === "In Transit" || o.status === "Loaded").length;

  const expiring = vehicles
    .flatMap((v) => [
      { vehicle: v.number, doc: "Insurance", date: v.insuranceExpiry },
      { vehicle: v.number, doc: "Fitness", date: v.fitnessExpiry },
      { vehicle: v.number, doc: "Permit", date: v.permitExpiry },
    ])
    .map((x) => ({ ...x, days: daysUntil(x.date) }))
    .filter((x) => x.days <= 60)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Today at the yard"
        description="Live snapshot of orders, dispatch and fleet movements."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/reports">View reports</Link>
            </Button>
            <Button asChild>
              <Link to="/orders">New order</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open Orders" value={String(orders.length)} hint={`${inTransit} in motion`} icon={ShoppingCart} tone="primary" />
        <StatCard label="Trips Today" value={String(trips.length)} hint={`${trips.reduce((a, t) => a + t.weight, 0)} MT moved`} icon={RouteIcon} tone="info" />
        <StatCard label="Revenue Today" value={inr(todayRevenue)} hint={`Profit ${inr(todayProfit)}`} icon={IndianRupee} tone="success" />
        <StatCard label="Receivables" value={inr(outstanding)} hint={`${customers.filter((c) => c.outstanding > 0).length} customers`} icon={TrendingUp} tone="warning" />
      </div>

      <div className="grid gap-4 px-6 pb-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="font-display text-base font-semibold">Live order pipeline</h2>
              <p className="text-xs text-muted-foreground">From the yard to the customer site.</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/orders">Open all</Link>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 6).map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.no}</TableCell>
                  <TableCell>{o.customer}</TableCell>
                  <TableCell className="font-mono text-xs">{o.vehicle}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.qty} MT</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusTone[o.status]}>
                      {o.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="font-display text-sm font-semibold">Document alerts</h2>
            </div>
            <ul className="mt-3 space-y-3">
              {expiring.length === 0 ? (
                <li className="text-xs text-muted-foreground">No expiries in the next 60 days.</li>
              ) : (
                expiring.map((e, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 text-sm">
                    <div>
                      <p className="font-mono text-xs text-foreground">{e.vehicle}</p>
                      <p className="text-xs text-muted-foreground">{e.doc} • {e.date}</p>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${e.days <= 7 ? "bg-destructive/15 text-destructive" : e.days <= 30 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>
                      {e.days <= 0 ? "Expired" : `${e.days}d`}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-semibold">Fleet status</h2>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/40 p-2">
                <p className="font-display text-lg font-semibold">{vehicles.filter((v) => v.ownership === "Own").length}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Own</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2">
                <p className="font-display text-lg font-semibold">{vehicles.filter((v) => v.ownership === "Hired").length}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hired</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2">
                <p className="font-display text-lg font-semibold">{inTransit}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Moving</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-info" />
              <h2 className="font-display text-sm font-semibold">Weighbridge today</h2>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Capture gross/tare weights, attach slip images and reconcile with customer weights.
            </p>
            <Button size="sm" variant="outline" className="mt-3 w-full" asChild>
              <Link to="/weighbridge">Open weighbridge</Link>
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-accent-foreground" />
              <h2 className="font-display text-sm font-semibold">Coming next</h2>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <li>• Auto WhatsApp invoice &amp; challan share</li>
              <li>• Driver payroll &amp; advance ledger</li>
              <li>• GST returns &amp; e-Way bill push</li>
              <li>• AI chatbot: "Show today's dispatch"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
