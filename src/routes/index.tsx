import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  Route as RouteIcon,
  Sparkles,
} from "lucide-react";
import { OneShotOrderDialog } from "@/components/one-shot-order";
import { AlertCenter } from "@/components/alert-center";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
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
  inr,
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
  const orders = active(useErp((s) => s.orders));
  const [oneShot, setOneShot] = useState(false);
  const trips = active(useErp((s) => s.trips));

  const todayRevenue = trips.reduce((a, t) => a + t.revenue, 0);
  const todayProfit = trips.reduce((a, t) => a + (t.revenue - t.expense), 0);
  const outstanding = customers.reduce((a, c) => a + c.outstanding, 0);
  const inTransit = orders.filter((o) => o.status === "In Transit" || o.status === "Loaded").length;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Today at the yard"
        description="Live snapshot of orders, dispatch and fleet movements."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/operations">Open operations</Link>
            </Button>
            <Button onClick={() => setOneShot(true)}>
              <Sparkles className="mr-1 h-4 w-4" />One-Shot Order
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
              <h2 className="font-display text-base font-semibold">Today's orders</h2>
              <p className="text-xs text-muted-foreground">Active orders from the yard.</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/operations">View all</Link>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Vehicle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 6).map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-semibold">{o.no}</TableCell>
                  <TableCell className="text-sm">{o.customer}</TableCell>
                  <TableCell>{o.product}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.qty} MT</TableCell>
                  <TableCell className="font-mono text-xs">{o.vehicle}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-4">
          <AlertCenter limit={6} />
        </div>
      </div>

      <OneShotOrderDialog open={oneShot} onOpenChange={setOneShot} />
    </div>
  );
}
