import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Ban, FileDown, Download, IndianRupee, Route as RouteIcon, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { ListShell } from "@/components/list-shell";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inr } from "@/lib/mock-data";
import { useErp, active, type CTrip, loadBackendData } from "@/lib/store";
import { EntityDialog, CancelDialog, type FieldDef } from "@/components/entity-dialog";
import { generateDocPdf, generatePdf } from "@/lib/pdf";
import { createTrip, updateTrip, deleteTrip } from "@/lib/api/clients";

export const Route = createFileRoute("/trips")({
  head: () => ({ meta: [{ title: "Trips — Honey Enterprises ERP" }] }),
  component: TripsPage,
});

function TripsPage() {
  const trips = useErp((s) => s.trips);
  const vehicles = useErp((s) => s.vehicles);
  const drivers = useErp((s) => s.drivers);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CTrip | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CTrip | null>(null);
  const [loading, setLoading] = useState(false);

  const liveTrips = active(trips);
  const revenue = liveTrips.reduce((a, t) => a + t.revenue, 0);
  const expense = liveTrips.reduce((a, t) => a + t.expense, 0);

  const fields: FieldDef[] = [
    { name: "date", label: "Date", type: "date", required: true, half: true },
    {
      name: "vehicle", label: "Vehicle", type: "select", required: true, half: true,
      options: active(vehicles).map((v) => ({ label: v.number, value: v.number }))
    },
    {
      name: "driver", label: "Driver", type: "select", required: true, half: true,
      options: active(drivers).map((d) => ({ label: d.name, value: d.name }))
    },
    { name: "source", label: "Source", required: true, half: true },
    { name: "destination", label: "Destination", required: true, half: true },
    { name: "weight", label: "Weight (MT)", type: "number", required: true, half: true },
    { name: "revenue", label: "Revenue", type: "number", required: true, half: true },
    { name: "tripExpenses", label: "Expense", type: "number", required: true, half: true },
  ];

  async function handleSubmit(v: Record<string, unknown>) {
    setLoading(true);
    try {
      const data = {
        date: String(v.date),
        vehicle: String(v.vehicle),
        driver: String(v.driver),
        source: String(v.source),
        destination: String(v.destination),
        weight: Number(v.weight),
        revenue: Number(v.revenue),
        tripExpenses: Number(v.tripExpenses),
      };

      if (editing) {
        await updateTrip(String(editing.id), data);
        toast.success(`Trip updated`);
      } else {
        await createTrip(data);
        toast.success(`Trip created`);
      }

      await loadBackendData();
      setEditing(null);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  }

  function downloadTrip(t: CTrip) {
    generateDocPdf({
      type: "Trip Sheet", no: t.tripNo, date: t.date,
      rows: [
        { label: "Vehicle", value: t.vehicle },
        { label: "Driver", value: t.driver },
        { label: "Route", value: `${t.source} → ${t.destination}` },
      ],
      lines: {
        head: ["Weight (MT)", "Revenue", "Expense", "Profit"],
        body: [[t.weight, inr(t.revenue), inr(t.expense), inr(t.revenue - t.expense)]],
      },
      totals: [{ label: "Net Profit", value: inr(t.revenue - t.expense) }],
      remark: t.cancelled ? `CANCELLED — ${t.cancelRemark ?? ""}` : undefined,
      filename: `${t.tripNo}.pdf`,
    });
  }

  function exportPdf() {
    generatePdf({
      title: "Trip Register & P&L",
      subtitle: "Cancelled trips excluded",
      filename: `trips-${Date.now()}.pdf`,
      head: ["Trip", "Date", "Vehicle", "Driver", "Source", "Destination", "MT", "Revenue", "Expense", "Profit"],
      body: liveTrips.map((t) => [t.tripNo, t.date, t.vehicle, t.driver, t.source, t.destination, t.weight, t.revenue, t.expense, t.revenue - t.expense]),
      totals: [
        { label: "Total revenue", value: inr(revenue) },
        { label: "Total expense", value: inr(expense) },
        { label: "Net profit", value: inr(revenue - expense) },
      ],
    });
  }

  return (
    <div>
      <PageHeader title="Trips"
        description="Trip-wise revenue, expense and profitability across the fleet."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-1 h-4 w-4" />Export PDF</Button>
          </>
        } />
      <div className="grid gap-4 px-6 pt-6 md:grid-cols-3">
        <StatCard label="Trips" value={String(liveTrips.length)} icon={RouteIcon} tone="info" />
        <StatCard label="Revenue" value={inr(revenue)} icon={IndianRupee} tone="success" />
        <StatCard label="Profit" value={inr(revenue - expense)} hint={`Expenses ${inr(expense)}`} icon={TrendingUp} tone="primary" />
      </div>
      <div className="p-6">
        <ListShell toolbar={<p className="text-sm font-medium">All trips</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip No</TableHead><TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead><TableHead>Driver</TableHead>
                <TableHead>Source</TableHead><TableHead>Destination</TableHead>
                <TableHead className="text-right">MT</TableHead>
                <TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Expense</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((t) => {
                const profit = t.revenue - t.expense;
                return (
                  <TableRow key={t.id} className={t.cancelled ? "opacity-60" : ""}>
                    <TableCell className="font-mono text-xs">{t.tripNo}{t.cancelled && <Badge variant="outline" className="ml-2 bg-destructive/15 text-destructive">Cancelled</Badge>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
                    <TableCell className="font-mono text-xs">{t.vehicle}</TableCell>
                    <TableCell>{t.driver}</TableCell>
                    <TableCell>{t.source}</TableCell><TableCell>{t.destination}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.weight}</TableCell>
                    <TableCell className="text-right tabular-nums">{inr(t.revenue)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{inr(t.expense)}</TableCell>
                    <TableCell className={`text-right font-medium tabular-nums ${profit >= 0 ? "text-success" : "text-destructive"}`}>{inr(profit)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => downloadTrip(t)}><FileDown className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" disabled={t.cancelled} onClick={() => { setEditing(t); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" disabled={t.cancelled} onClick={() => setCancelTarget(t)}><Ban className="h-3.5 w-3.5 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ListShell>
      </div>

      <EntityDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        title="Trip" fields={fields} mode={editing ? "edit" : "create"}
        initial={editing ?? { date: new Date().toISOString().slice(0, 10), tripNo: `TRP-${1000 + trips.length + 1}` }}
        onSubmit={handleSubmit} disabled={loading} />
      <CancelDialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}
        title={cancelTarget ? `Cancel ${cancelTarget.tripNo}` : "Cancel"}
        onConfirm={async (remark) => {
          if (cancelTarget) {
            setLoading(true);
            try {
              await deleteTrip(String(cancelTarget.id));
              toast.warning(`${cancelTarget.tripNo} cancelled`, { description: remark });
              await loadBackendData();
            } catch (err) {
              toast.error(String(err));
            } finally {
              setLoading(false);
              setCancelTarget(null);
            }
          }
        }} />
    </div>
  );
}
