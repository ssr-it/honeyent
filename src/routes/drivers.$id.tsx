import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, IdCard, Star, IndianRupee, Route as RouteIcon, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { newId, useErp, EXPENSE_CATEGORIES, active } from "@/lib/store";
import { nextNo } from "@/lib/numbering";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inr, daysUntil } from "@/lib/mock-data";
// useErp and active imported above
import { driverProfile } from "@/lib/insights";

export const Route = createFileRoute("/drivers/$id")({
  head: () => ({ meta: [{ title: "Driver 360 — Honey Enterprises ERP" }] }),
  component: Driver360,
});

function Driver360() {
  const { id } = useParams({ from: "/drivers/$id" });
  const driver = useErp((s) =>
  s.drivers.find(
    (x) => String(x.id) === String(id)
  )
);

  const trips = active(useErp((s) => s.trips));
  const expenses = useErp((s) => s.expenses);
  const orders = active(useErp((s) => s.orders));

  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payCategory, setPayCategory] =
    useState<typeof EXPENSE_CATEGORIES[number]>(
      EXPENSE_CATEGORIES[0]
    );
  const [payMode, setPayMode] =
    useState<"Cash" | "Bank" | "UPI" | "Cheque">("Cash");
  const [payNote, setPayNote] = useState("");

  if (!driver) {
    return (
      <div className="p-10">
        <Button variant="ghost" asChild>
          <Link to="/drivers">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>

        <p className="mt-4 text-sm text-muted-foreground">
          Driver not found.
        </p>

        <p className="mt-2 text-xs text-muted-foreground">
          Driver ID: {id}
        </p>
      </div>
    );
  }

  const p = driverProfile(driver, {
    trips,
    expenses,
    orders,
  });

  const licDays = driver.licenseExpiry
    ? daysUntil(driver.licenseExpiry)
    : 0;

  // keep all remaining code exactly as it is
  return (
    <div>
      <PageHeader
        title={driver.name}
        description={`${driver.mobile} • License ${driver.license} • Driver 360°`}
        actions={<>
          <Button size="sm" onClick={() => setPayOpen(true)}>Pay</Button>
          <Button variant="outline" size="sm" asChild><Link to="/drivers"><ArrowLeft className="mr-1 h-4 w-4" />All drivers</Link></Button>
        </>}
      />

      <div className="grid gap-4 px-6 pt-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Trips" value={String(p.trips.length)} hint={`${p.tonsMoved} MT moved`} icon={RouteIcon} tone="info" />
        <StatCard label="Revenue generated" value={inr(p.revenue)} icon={IndianRupee} tone="success" />
        <StatCard label="Total salary paid" value={inr(p.salary)} icon={IdCard} tone="primary" />
        <StatCard label="Performance" value={"★".repeat(p.rating) + "☆".repeat(5 - p.rating)} hint={`${p.successPct}% on-time`} icon={Star} tone={p.rating >= 4 ? "success" : "warning"} />
      </div>

      <div className="grid gap-4 px-6 py-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-display text-sm font-semibold">Profile</h3>
          <div className="mt-3 space-y-2 text-sm">
            <KV k="Status" v={driver.status} />
            <KV k="Mobile" v={driver.mobile} />
            <KV k="License" v={driver.license} />
            <div className="flex items-center justify-between border-b border-border/60 py-1.5">
              <span className="text-xs text-muted-foreground">License expiry</span>
              <Badge variant="outline" className={licDays <= 0 ? "bg-destructive/15 text-destructive" : licDays <= 30 ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}>{driver.licenseExpiry} • {licDays <= 0 ? "Expired" : `${licDays}d`}</Badge>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-display text-sm font-semibold">Salary & advances</h3>
          {p.salary === 0 ? <p className="mt-3 text-xs text-muted-foreground">No salary payments recorded.</p> : (
            <ul className="mt-3 space-y-1.5">
              {expenses.filter((e) => !e.cancelled && e.driver === driver.name).map((e) => (
                <li key={e.id} className="flex justify-between text-sm">
                  <span className="text-xs text-muted-foreground">{e.date} • {e.category}</span>
                  <span className="font-medium tabular-nums">{inr(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-display text-sm font-semibold">Performance</h3>
          <div className="mt-3 space-y-2 text-sm">
            <KV k="Orders assigned" v={String(p.orders.length)} />
            <KV k="Delivered" v={`${p.successPct}%`} />
            <KV k="Avg revenue/trip" v={inr(p.trips.length ? p.revenue / p.trips.length : 0)} />
            <KV k="Avg MT/trip" v={(p.trips.length ? p.tonsMoved / p.trips.length : 0).toFixed(1)} />
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3"><h3 className="font-display text-sm font-semibold">Trip history</h3></div>
          {p.trips.length === 0 ? <p className="px-4 py-8 text-center text-xs text-muted-foreground">No trips.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Trip</TableHead><TableHead>Date</TableHead><TableHead>Vehicle</TableHead><TableHead>Route</TableHead><TableHead className="text-right">MT</TableHead><TableHead className="text-right">Profit</TableHead></TableRow></TableHeader>
              <TableBody>{p.trips.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.tripNo}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
                  <TableCell className="font-mono text-xs">{t.vehicle}</TableCell>
                  <TableCell className="text-xs">{t.source} → {t.destination}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.weight}</TableCell>
                  <TableCell className={`text-right tabular-nums ${t.revenue - t.expense >= 0 ? "text-success" : "text-destructive"}`}>{inr(t.revenue - t.expense)}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </div>
      </div>
      <Dialog open={payOpen} onOpenChange={(v) => !v && setPayOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay driver</DialogTitle>
            <DialogDescription>{driver.name}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label className="text-xs">Date</Label><Input type="date" value={new Date().toISOString().slice(0, 10)} readOnly /></div>
            <div className="grid gap-1.5"><Label className="text-xs">Amount</Label><Input type="number" value={payAmount || ""} onChange={(e) => setPayAmount(Number(e.target.value))} /></div>
            <div className="grid gap-1.5"><Label className="text-xs">Category</Label>
              <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={payCategory} onChange={(e) => setPayCategory(e.target.value as any)}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5"><Label className="text-xs">Mode</Label>
              <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={payMode} onChange={(e) => setPayMode(e.target.value as any)}>
                <option>Cash</option><option>Bank</option><option>UPI</option><option>Cheque</option>
              </select>
            </div>
            <div className="grid gap-1.5 col-span-2"><Label className="text-xs">Note</Label><Input value={payNote} onChange={(e) => setPayNote(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (payAmount <= 0) return toast.error("Enter amount");
              const no = nextNo("EXP" as never) || `EXP/${Date.now().toString().slice(-6)}`;
              useErp.getState().add("expenses", { id: newId("exp"), no, date: new Date().toISOString().slice(0, 10), category: payCategory, driver: driver.name, paidTo: driver.name, mode: payMode, amount: payAmount, remark: payNote });
              toast.success("Payment recorded");
              setPayOpen(false); setPayAmount(0); setPayNote("");
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KV({ k, v }: { k: string; v?: string }) {
  return <div className="flex items-center justify-between border-b border-border/60 py-1.5"><span className="text-xs text-muted-foreground">{k}</span><span className="text-sm font-medium">{String(v ?? "—")}</span></div>;
}
