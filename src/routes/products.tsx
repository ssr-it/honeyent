import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Ban, Download } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { ListShell } from "@/components/list-shell";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inr } from "@/lib/mock-data";
import { useErp, active, type CProduct, loadBackendData } from "@/lib/store";
import { EntityDialog, CancelDialog, type FieldDef } from "@/components/entity-dialog";
import { generatePdf } from "@/lib/pdf";
import { createProduct, updateProduct, deleteProduct } from "@/lib/api/clients";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Products — Honey Enterprises ERP" }] }),
  component: ProductsPage,
});

// Fields defined inside component to include dynamic HSN options

function ProductsPage() {
  const products = useErp((s) => s.products);
  const hsnCodes = useErp((s) => s.hsnCodes);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CProduct | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const visible = active(products);
  const fields: FieldDef[] = [
    { name: "name", label: "Name", required: true, half: true },
    { name: "hsn", label: "HSN", type: "select", half: true, options: (hsnCodes || []).map((h: any) => ({ label: h.code + (h.description ? ` — ${h.description}` : ""), value: h.code })) },
    { name: "category", label: "Category", type: "text", half: true },
    { name: "unit", label: "Unit", half: true, placeholder: "MT" },
    { name: "gst", label: "GST %", type: "number", half: true },
    { name: "rate", label: "Standard Rate", type: "number", half: true },
  ];

  async function handleSubmit(v: Record<string, unknown>) {
    setLoading(true);
    try {
      const data = {
        name: String(v.name),
        hsn: String(v.hsn || ""),
        category: String(v.category || ""),
        unit: String(v.unit || "MT"),
        gstRate: Number(v.gst || 5),
        defaultRate: Number(v.rate || 0),
      };

      if (editing) {
        await updateProduct(String(editing.id), data);
        toast.success(`${editing.name} updated`);
      } else {
        await createProduct(data);
        toast.success(`Product ${v.name} added`);
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
      title: "Product Master", filename: `products-${Date.now()}.pdf`,
      head: ["Code", "Name", "HSN", "Unit", "GST %", "Rate"],
      body: visible.map((p) => [p.code, p.name, p.hsn ?? "", p.unit ?? "", p.gst ?? 0, inr(p.rate ?? 0)]),
    });
  }

  return (
    <div>
      <PageHeader title="Products"
        description="Aggregate and sand catalogue with HSN, GST and standard rates."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-1 h-4 w-4" />Export PDF</Button>
            <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />New product</Button>
          </>
        } />
      <div className="p-6">
        <ListShell toolbar={<p className="text-sm font-medium">{visible.length} products</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>HSN</TableHead>
                <TableHead>Unit</TableHead><TableHead className="text-right">GST %</TableHead>
                <TableHead className="text-right">Standard Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.code}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs">{p.hsn}</TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.gst}%</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{inr(p.rate ?? 0)} / {p.unit}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setCancelTarget(p)}><Ban className="h-3.5 w-3.5 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ListShell>
      </div>

      <EntityDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        title="Product" fields={fields} mode={editing ? "edit" : "create"}
        initial={editing ?? { unit: "MT", gst: 5 }} onSubmit={handleSubmit} disabled={loading} />
      <CancelDialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}
        title={cancelTarget ? `Remove ${cancelTarget.name}` : "Remove"}
        onConfirm={async (remark) => {
          if (cancelTarget) {
            setLoading(true);
            try {
              await deleteProduct(String(cancelTarget.id));
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
    </div>
  );
}
