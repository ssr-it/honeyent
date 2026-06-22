import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Ban } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityDialog, CancelDialog, type FieldDef } from "@/components/entity-dialog";
import { useErp, type HsnCode, active, newId } from "@/lib/store";

export const Route = createFileRoute("/hsn")({
  head: () => ({ meta: [{ title: "HSN Codes — Honey Enterprises ERP" }] }),
  component: HsnPage,
});

const fields: FieldDef[] = [
  { name: "code", label: "HSN code", required: true },
  { name: "gstRate", label: "GST %", type: "number", required: true },
  { name: "description", label: "Description", type: "text" },
];

function HsnPage() {
  const codes = useErp((s) => s.hsnCodes);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HsnCode | null>(null);
  const [cancelTarget, setCancelTarget] = useState<HsnCode | null>(null);

  async function onSubmit(v: Record<string, unknown>) {
    const payload = { code: String(v.code), gstRate: Number(v.gstRate), description: String(v.description || "") };
    if (editing) {
      useErp.getState().update("hsnCodes", editing.id, payload as any);
      toast.success("HSN updated");
    } else {
      useErp.getState().add("hsnCodes", { id: newId("hsn"), ...payload } as any);
      toast.success("HSN added");
    }
    setOpen(false);
    setEditing(null);
  }

  return (
    <div>
      <PageHeader title="HSN Codes" description="Manage HSN codes and GST rates" actions={<>
        <Button variant="outline" size="sm">Import</Button>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />New HSN</Button>
      </>} />

      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow><TableHead>HSN</TableHead><TableHead>GST %</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {active(codes).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.code}</TableCell>
                <TableCell className="text-right tabular-nums">{c.gstRate}%</TableCell>
                <TableCell>{c.description}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setCancelTarget(c)}><Ban className="h-3.5 w-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EntityDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }} title="HSN" fields={fields} mode={editing ? "edit" : "create"} initial={editing ?? { gstRate: 0 }} onSubmit={onSubmit} />
      <CancelDialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)} title={cancelTarget ? `Remove ${cancelTarget.code}` : "Remove"} onConfirm={(remark) => { if (cancelTarget) { useErp.getState().remove("hsnCodes", cancelTarget.id); toast.warning("HSN removed"); setCancelTarget(null); } }} />
    </div>
  );
}
