import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Ban, Download, Eye } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { ListShell } from "@/components/list-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inr } from "@/lib/mock-data";
import { useErp, active, type CCustomer, loadBackendData } from "@/lib/store";
import { EntityDialog, CancelDialog, type FieldDef } from "@/components/entity-dialog";
import { checkCustomer } from "@/lib/dedupe";
import { generatePdf } from "@/lib/pdf";
import { createCustomer, updateCustomer, deleteCustomer } from "@/lib/api/clients";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — Honey Enterprises ERP" }] }),
  component: CustomersPage,
});

const fields: FieldDef[] = [
  { name: "name", label: "Name", required: true, half: true },
  { name: "gst", label: "GSTIN", half: true },
  { name: "mobile", label: "Mobile", required: true, half: true },
  { name: "email", label: "Email", type: "text", half: true },
  { name: "address", label: "Address", type: "textarea", half: true },
  { name: "city", label: "City", half: true },
  { name: "state", label: "State", half: true },
  { name: "creditLimit", label: "Credit Limit", type: "number", half: true },
  { name: "outstanding", label: "Opening Outstanding", type: "number", half: true },
  {
    name: "status", label: "Status", type: "select", half: true,
    options: [{ label: "Active", value: "Active" }, { label: "Inactive", value: "Inactive" }]
  },
];

function CustomersPage() {
  const customers = useErp((s) => s.customers);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CCustomer | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CCustomer | null>(null);
  const [loading, setLoading] = useState(false);

  const visible = customers.filter((c) => {
    if (c.cancelled) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.gst.toLowerCase().includes(q) || c.mobile.includes(q);
  });

  async function handleSubmit(v: Record<string, unknown>) {
    const excludeId: string | undefined = editing ? String(editing.id) : undefined;
    const err = checkCustomer(String(v.name), String(v.gst || ""), String(v.mobile), { excludeId });
    if (err) { toast.error(err); return; }

    setLoading(true);
    try {
      const data = {
        name: String(v.name),
        gst: String(v.gst || ""),
        mobile: String(v.mobile),
        email: String(v.email || ""),
        address: String(v.address || ""),
        city: String(v.city || ""),
        state: String(v.state || ""),
        creditLimit: Number(v.creditLimit || 0),
        openingBalance: Number(v.outstanding || 0),
        outstanding: Number(v.outstanding || 0),
        status: (v.status as CCustomer["status"]) || "Active",
      };

      if (editing) {
        await updateCustomer(String(editing.id), data);
        toast.success(`${editing.name} updated`);
      } else {
        await createCustomer(data);
        toast.success(`Customer ${v.name} added`);
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
      title: "Customer Master",
      subtitle: "Active customers only",
      filename: `customers-${Date.now()}.pdf`,
      head: ["Code", "Name", "GST", "Mobile", "City", "Credit Limit", "Outstanding", "Status"],
      body: active(customers).map((c) => [c.code, c.name, c.gst, c.mobile, c.city, inr(c.creditLimit), inr(c.outstanding), c.status]),
      totals: [{ label: "Total outstanding", value: inr(active(customers).reduce((a, c) => a + c.outstanding, 0)) }],
    });
  }

  return (
    <>
      <div>
        <PageHeader
          title="Customers"
          description="Customer master with GST, credit limits and outstanding."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-1 h-4 w-4" />Export PDF</Button>
              <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />New customer</Button>
            </>
          }
        />
        <div className="p-6">
          <ListShell
            toolbar={
              <>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, GST, mobile…" className="h-9 max-w-sm bg-background" />
                <p className="text-xs text-muted-foreground">{visible.length} customers</p>
              </>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Credit Limit</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.code}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs">{c.gst}</TableCell>
                    <TableCell className="font-mono text-xs">{c.mobile}</TableCell>
                    <TableCell>{c.city}</TableCell>
                    <TableCell className="text-right tabular-nums">{inr(c.creditLimit)}</TableCell>
                    <TableCell className={`text-right tabular-nums ${c.outstanding > 0 ? "text-warning" : "text-muted-foreground"}`}>{inr(c.outstanding)}</TableCell>
                    <TableCell><Badge variant="outline" className={c.status === "Active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>{c.status}</Badge></TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/customers/$id" params={{ id: String(c.id) }}><Eye className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setCancelTarget(c)}>
                        <Ban className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ListShell>
        </div>

        <EntityDialog
          open={open}
          onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
          title="Customer"
          fields={fields}
          mode={editing ? "edit" : "create"}
          initial={editing ?? { status: "Active" }}
          onSubmit={handleSubmit}
          disabled={loading}
        />
        <CancelDialog
          open={!!cancelTarget}
          onOpenChange={(v) => { if (!v) setCancelTarget(null); setOpen(false); }}
          title={cancelTarget ? `Remove ${cancelTarget.name}` : "Remove"}
          onConfirm={async (remark) => {
            if (cancelTarget) {
              setLoading(true);
              try {
                await deleteCustomer(String(cancelTarget.id));
                toast.warning(`${cancelTarget.name} removed`, { description: remark });
                await loadBackendData();
              } catch (err) {
                toast.error(String(err));
              } finally {
                setLoading(false);
                setCancelTarget(null);
              }
            }
          }}
        />
      </div>
      <Outlet />
    </>
  );
}
