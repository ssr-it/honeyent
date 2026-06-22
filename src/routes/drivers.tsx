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
import { useErp, active, type CDriver, loadBackendData } from "@/lib/store";
import { EntityDialog, CancelDialog, type FieldDef } from "@/components/entity-dialog";
import { generatePdf } from "@/lib/pdf";
import { createDriver, updateDriver, deleteDriver } from "@/lib/api/clients";

export const Route = createFileRoute("/drivers")({
  head: () => ({ meta: [{ title: "Drivers — Honey Enterprises ERP" }] }),
  component: DriversPage,
});

const fields: FieldDef[] = [
  { name: "name", label: "Name", required: true, half: true },
  { name: "mobile", label: "Mobile", required: true, half: true },
  { name: "email", label: "Email", type: "text", half: true },
  { name: "address", label: "Address", type: "textarea", half: true },
  { name: "license", label: "License No", half: true },
  { name: "licenseExpiry", label: "License Expiry", type: "date", half: true },
  { name: "joiningDate", label: "Joining Date", type: "date", half: true },
  {
    name: "status", label: "Status", type: "select", half: true,
    options: [{ label: "Active", value: "Active" }, { label: "Off Duty", value: "Off Duty" }]
  },
];

function DriversPage() {
  const drivers = useErp((s) => s.drivers);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CDriver | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CDriver | null>(null);
  const [loading, setLoading] = useState(false);
  const visible = active(drivers);

  async function handleSubmit(v: Record<string, unknown>) {
    setLoading(true);
    try {
      const data = {
        name: String(v.name),
        mobile: String(v.mobile),
        email: String(v.email || ""),
        address: String(v.address || ""),
        licenseNumber: String(v.license || ""),
        licenseExpiry: String(v.licenseExpiry || ""),
        joiningDate: String(v.joiningDate || ""),
        status: (v.status as CDriver["status"]) || "Active",
      };

      if (editing) {
        await updateDriver(String(editing.id), data);
        toast.success(`${editing.name} updated`);
      } else {
        await createDriver(data);
        toast.success(`Driver ${v.name} added`);
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
      title: "Driver Master", filename: `drivers-${Date.now()}.pdf`,
      head: ["Name", "Mobile", "License", "Expiry", "Status"],
      body: visible.map((d) => [d.name, d.mobile, d.license ?? "", d.licenseExpiry ?? "", d.status ?? ""]),
    });
  }

  return (
    <div>
      <PageHeader title="Drivers"
        description="Driver master with license, attendance and performance hooks."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-1 h-4 w-4" />Export PDF</Button>
            <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />New driver</Button>
          </>
        } />
      <div className="p-6">
        <ListShell toolbar={<p className="text-sm font-medium">{visible.length} drivers</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Mobile</TableHead>
                <TableHead>License</TableHead><TableHead>License Expiry</TableHead>
                <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((d) => {
                const days = daysUntil(d.licenseExpiry ?? "");
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="font-mono text-xs">{d.mobile}</TableCell>
                    <TableCell className="font-mono text-xs">{d.license}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{d.licenseExpiry}</span>
                      <Badge variant="outline" className={`ml-2 ${days <= 30 ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>{days}d</Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={d.status === "Active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>{d.status}</Badge></TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" asChild><Link to="/drivers/$id" params={{ id: String(d.id) }}><Eye className="h-3.5 w-3.5" /></Link></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(d); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setCancelTarget(d)}><Ban className="h-3.5 w-3.5 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ListShell>
      </div>

      <EntityDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        title="Driver" fields={fields} mode={editing ? "edit" : "create"}
        initial={editing ?? { status: "Active" }} onSubmit={handleSubmit} disabled={loading} />
      <CancelDialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}
        title={cancelTarget ? `Remove ${cancelTarget.name}` : "Remove"}
        onConfirm={async (remark) => {
          if (cancelTarget) {
            setLoading(true);
            try {
              await deleteDriver(String(cancelTarget.id));
              toast.warning(`${cancelTarget.name} removed`);
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
