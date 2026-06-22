import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Truck, Fuel, Wrench, ShieldCheck, IndianRupee, TrendingUp, Route as RouteIcon } from "lucide-react";
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
import { vehicleProfile } from "@/lib/insights";

export const Route = createFileRoute("/vehicles/$id")({
  head: () => ({ meta: [{ title: "Vehicle 360 — Honey Enterprises ERP" }] }),
  component: Vehicle360,
});

function expiryBadge(date?: string) {
  if (!date) return <Badge variant="outline">—</Badge>;
  const d = daysUntil(date);
  const tone = d <= 0 ? "bg-destructive/15 text-destructive" : d <= 30 ? "bg-warning/15 text-warning" : "bg-success/15 text-success";
  return <Badge variant="outline" className={tone}>{d <= 0 ? "Expired" : `${d}d left`}</Badge>;
}

function Vehicle360() {
 const { id } = useParams({ from: "/vehicles/$id" });

const v = useErp((s) =>
  s.vehicles.find((x) => String(x.id) === String(id))
);

const trips = active(useErp((s) => s.trips));
const expenses = useErp((s) => s.expenses);

const [expOpen, setExpOpen] = useState(false);
const [expAmount, setExpAmount] = useState(0);

const [expCategory, setExpCategory] =
  useState<typeof EXPENSE_CATEGORIES[number]>(
    EXPENSE_CATEGORIES[0]
  );

const [expMode, setExpMode] =
  useState<"Cash" | "Bank" | "UPI" | "Cheque">("Cash");

const [expNote, setExpNote] = useState("");

if (!v) {
  return (
    <div className="p-10">
      <Button variant="ghost" asChild>
        <Link to="/vehicles">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>
      </Button>

      <p className="mt-4 text-sm text-muted-foreground">
        Vehicle not found.
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
        Route ID: {id}
      </p>
    </div>
  );
}

const p = vehicleProfile(v, { trips, expenses });

  return (
    <div>
      <PageHeader
        title={v.number}
        description={`${v.ownership} • ${v.capacity} MT capacity • Vehicle 360°`}
        actions={<Button variant="outline" size="sm" asChild><Link to="/vehicles"><ArrowLeft className="mr-1 h-4 w-4" />All vehicles</Link></Button>}
      />

      <div className="grid gap-4 px-6 pt-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={inr(p.revenue)} hint={`${p.trips.length} trips`} icon={IndianRupee} tone="success" />
        <StatCard label="Profit" value={inr(p.profit)} hint={`Margin ${p.revenue ? Math.round((p.profit / p.revenue) * 100) : 0}%`} icon={TrendingUp} tone={p.profit >= 0 ? "primary" : "destructive"} />
        <StatCard label="Tons moved" value={`${p.tonsMoved} MT`} hint={`Cost/ton ${inr(p.costPerTon)}`} icon={RouteIcon} tone="info" />
        <StatCard label="Total op-ex" value={inr(p.tripExp + p.extras)} hint={`Fuel ${inr(p.fuel)}`} icon={Truck} tone="warning" />
      </div>

      <div className="px-6 pb-6">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setExpOpen(true)}><Truck className="mr-1 h-4 w-4" />Add expense</Button>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-display text-sm font-semibold">Documents</h3>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground"><ShieldCheck className="mr-1 inline h-3 w-3" />Insurance</span><span className="flex items-center gap-2"><span className="text-xs">{v.insuranceExpiry}</span>{expiryBadge(v.insuranceExpiry)}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Fitness</span><span className="flex items-center gap-2"><span className="text-xs">{v.fitnessExpiry}</span>{expiryBadge(v.fitnessExpiry)}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Permit</span><span className="flex items-center gap-2"><span className="text-xs">{v.permitExpiry}</span>{expiryBadge(v.permitExpiry)}</span></div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-display text-sm font-semibold">Cost breakdown</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <CostRow icon={Fuel} label="Diesel / Fuel" value={p.fuel} total={p.tripExp + p.extras} />
            <CostRow icon={Wrench} label="Repair & Maintenance" value={p.repair} total={p.tripExp + p.extras} />
            <CostRow icon={Truck} label="Tyre" value={p.tyre} total={p.tripExp + p.extras} />
            <CostRow icon={ShieldCheck} label="Insurance / Permit" value={p.insurance} total={p.tripExp + p.extras} />
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-display text-sm font-semibold">P&amp;L summary</h3>
          <div className="mt-3 space-y-2 text-sm">
            <KV k="Trip revenue" v={inr(p.revenue)} />
            <KV k="Trip expenses" v={`- ${inr(p.tripExp)}`} />
            <KV k="Other op-ex" v={`- ${inr(p.extras)}`} />
            <div className="mt-2 flex items-center justify-between rounded-md bg-muted/40 p-2">
              <span className="font-medium">Net profit</span>
              <span className={`font-display text-lg font-semibold ${p.profit >= 0 ? "text-success" : "text-destructive"}`}>{inr(p.profit)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 pb-6 lg:grid-cols-2">
        <Panel title="Trip history" empty={p.trips.length === 0}>
          <Table>
            <TableHeader><TableRow><TableHead>Trip</TableHead><TableHead>Date</TableHead><TableHead>Route</TableHead><TableHead className="text-right">MT</TableHead><TableHead className="text-right">Profit</TableHead></TableRow></TableHeader>
            <TableBody>{p.trips.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.tripNo}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
                <TableCell className="text-xs">{t.source} → {t.destination}</TableCell>
                <TableCell className="text-right tabular-nums">{t.weight}</TableCell>
                <TableCell className={`text-right tabular-nums ${t.revenue - t.expense >= 0 ? "text-success" : "text-destructive"}`}>{inr(t.revenue - t.expense)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </Panel>

        <Panel title="Service & expense register" empty={p.expenses.length === 0}>
          <Table>
            <TableHeader><TableRow><TableHead>Voucher</TableHead><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>{p.expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-xs">{e.no}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.date}</TableCell>
                <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{inr(e.amount)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </Panel>
      </div>
      <Dialog open={expOpen} onOpenChange={(v) => !v && setExpOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>{v.number}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label className="text-xs">Date</Label><Input type="date" value={new Date().toISOString().slice(0, 10)} readOnly /></div>
            <div className="grid gap-1.5"><Label className="text-xs">Amount</Label><Input type="number" value={expAmount || ""} onChange={(e) => setExpAmount(Number(e.target.value))} /></div>
            <div className="grid gap-1.5"><Label className="text-xs">Category</Label>
              <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={expCategory} onChange={(e) => setExpCategory(e.target.value as any)}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5"><Label className="text-xs">Mode</Label>
              <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={expMode} onChange={(e) => setExpMode(e.target.value as any)}>
                <option>Cash</option><option>Bank</option><option>UPI</option><option>Cheque</option>
              </select>
            </div>
            <div className="grid gap-1.5 col-span-2"><Label className="text-xs">Note</Label><Input value={expNote} onChange={(e) => setExpNote(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (expAmount <= 0) return toast.error("Enter amount");
              const no = nextNo("EXP" as never) || `EXP/${Date.now().toString().slice(-6)}`;
              useErp.getState().add("expenses", {
                id: newId("exp"), no, date: new Date().toISOString().slice(0, 10), category: expCategory, vehicle: v.number, paidTo: v.number, mode: expMode, amount: expAmount, remark: expNote,
              });
              toast.success("Expense recorded");
              setExpOpen(false); setExpAmount(0); setExpNote("");
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between border-b border-border/60 py-1.5"><span className="text-xs text-muted-foreground">{k}</span><span className="text-sm font-medium tabular-nums">{v}</span></div>;
}

function CostRow({ icon: Icon, label, value, total }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <li>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5"><Icon className="h-3 w-3" />{label}</span>
        <span className="tabular-nums">{inr(value)} • {pct}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
    </li>
  );
}

function Panel({ title, empty, children }: { title: string; empty?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3"><h3 className="font-display text-sm font-semibold">{title}</h3></div>
      {empty ? <p className="px-4 py-8 text-center text-xs text-muted-foreground">No records.</p> : children}
    </div>
  );
}
