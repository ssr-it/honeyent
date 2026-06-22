import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Ban, Download, Eye } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { ListShell } from "@/components/list-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { daysUntil } from "@/lib/mock-data";
import { useErp, active, type CVehicle, loadBackendData } from "@/lib/store";
import { EntityDialog, CancelDialog, type FieldDef } from "@/components/entity-dialog";
import { generatePdf } from "@/lib/pdf";
import { createVehicle, updateVehicle, deleteVehicle } from "@/lib/api/clients";

export const Route = createFileRoute("/vehicles")({
  head: () => ({ meta: [{ title: "Vehicles — Honey Enterprises ERP" }] }),
  component: VehiclesPage,
});

const fields: FieldDef[] = [
  { name: "number", label: "Vehicle Number", required: true, half: true },
  { name: "vehicleType", label: "Vehicle Type", half: true },
  {
    name: "ownership", label: "Ownership", type: "select", required: true, half: true,
    options: [{ label: "Own", value: "Own" }, { label: "Hired", value: "Hired" }]
  },
  { name: "capacity", label: "Capacity (MT)", type: "number", required: true, half: true },
  { name: "rcExpiry", label: "RC Expiry", type: "date", half: true },
  { name: "insuranceExpiry", label: "Insurance Expiry", type: "date", half: true },
  { name: "fitnessExpiry", label: "Fitness Expiry", type: "date", half: true },
  { name: "permitExpiry", label: "Permit Expiry", type: "date", half: true },
  { name: "pucExpiry", label: "PUC Expiry", type: "date", half: true },
];

function expiryBadge(date?: string) {
  if (!date) {
    return (
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">—</span>
        <Badge variant="outline" className="mt-0.5 w-fit">—</Badge>
      </div>
    );
  }
  const d = daysUntil(date);
  const tone = d <= 7 ? "bg-destructive/15 text-destructive" : d <= 30 ? "bg-warning/15 text-warning" : "bg-success/15 text-success";
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{date}</span>
      <Badge variant="outline" className={`mt-0.5 w-fit ${tone}`}>{d <= 0 ? "Expired" : `${d}d left`}</Badge>
    </div>
  );
}

function VehiclesPage() {
  const vehicles = useErp((s) => s.vehicles);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CVehicle | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CVehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const visible = active(vehicles);

  async function handleSubmit(v: Record<string, unknown>) {
    setLoading(true);
    try {
      const data = {
        number: String(v.number),
        vehicleType: String(v.vehicleType || ""),
        ownership: (v.ownership as CVehicle["ownership"]) || "Own",
        capacity: Number(v.capacity || 0),
        rcExpiry: String(v.rcExpiry || ""),
        insuranceExpiry: String(v.insuranceExpiry || ""),
        fitnessExpiry: String(v.fitnessExpiry || ""),
        permitExpiry: String(v.permitExpiry || ""),
        pucExpiry: String(v.pucExpiry || ""),
      };

      if (editing) {
        await updateVehicle(String(editing.id), data);
        toast.success(`${editing.number} updated`);
      } else {
        await createVehicle(data);
        toast.success(`Vehicle ${v.number} added`);
      }

      await loadBackendData();
      setEditing(null);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  }

  function exportPdf() {
    generatePdf({
      title: "Vehicle Master & Document Expiry", filename: `vehicles-${Date.now()}.pdf`,
      head: ["Vehicle", "Ownership", "Capacity (MT)", "Insurance", "Fitness", "Permit"],
      body: visible.map((v) => [v.number, v.ownership, v.capacity, v.insuranceExpiry ?? "", v.fitnessExpiry ?? "", v.permitExpiry ?? ""]),
    });
  }

  return (
    <div>
      <PageHeader title="Vehicles"
        description="Fleet master with RC, insurance, fitness and permit expiry tracking."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-1 h-4 w-4" />Export PDF</Button>
            <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />New vehicle</Button>
          </>
        } />
      <div className="p-6">
        <ListShell toolbar={<p className="text-sm font-medium">{visible.length} vehicles</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle No</TableHead><TableHead>Ownership</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead>Insurance</TableHead><TableHead>Fitness</TableHead><TableHead>Permit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs font-semibold">{v.number}</TableCell>
                  <TableCell><Badge variant="outline" className={v.ownership === "Own" ? "bg-primary/15 text-primary" : "bg-info/15 text-info"}>{v.ownership}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{v.capacity} MT</TableCell>
                  <TableCell>{expiryBadge(v.insuranceExpiry)}</TableCell>
                  <TableCell>{expiryBadge(v.fitnessExpiry)}</TableCell>
                  <TableCell>{expiryBadge(v.permitExpiry)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" asChild><Link to="/vehicles/$id" params={{ id: String(v.id) }}><Eye className="h-3.5 w-3.5" /></Link></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(v); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setCancelTarget(v)}><Ban className="h-3.5 w-3.5 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ListShell>
      </div>

      <EntityDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        title="Vehicle" fields={fields} mode={editing ? "edit" : "create"}
        initial={editing ?? { ownership: "Own" }} onSubmit={handleSubmit} disabled={loading} />
      <CancelDialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}
        title={cancelTarget ? `Remove ${cancelTarget.number}` : "Remove"}
        onConfirm={async (remark) => {
          if (cancelTarget) {
            setLoading(true);
            try {
              await deleteVehicle(String(cancelTarget.id));
              toast.warning(`${cancelTarget.number} removed`);
              await loadBackendData();
            } catch (err) {
              toast.error(String(err));
            } finally {
              setLoading(false);
              setCancelTarget(null);
            }
          }
        }} />
      <Outlet />
    </div>
  );
}
