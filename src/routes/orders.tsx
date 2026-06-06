import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Filter, Download, Pencil, Ban, FileDown, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { ListShell } from "@/components/list-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inr, statusTone, type OrderStatus } from "@/lib/mock-data";
import { useErp, newId, active, type COrder } from "@/lib/store";
import { EntityDialog, CancelDialog, type FieldDef } from "@/components/entity-dialog";
import { generateDocPdf, generatePdf } from "@/lib/pdf";
import { OneShotOrderDialog } from "@/components/one-shot-order";
import { nextNo } from "@/lib/numbering";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — Honey Enterprises ERP" }] }),
  component: OrdersPage,
});

const STATUSES: OrderStatus[] = ["Pending", "Approved", "Loaded", "In Transit", "Delivered", "Billed", "Closed"];

function OrdersPage() {
  const orders = useErp((s) => s.orders);
  const customers = useErp((s) => s.customers);
  const products = useErp((s) => s.products);
  const vehicles = useErp((s) => s.vehicles);
  const drivers = useErp((s) => s.drivers);
  const add = useErp((s) => s.add);
  const update = useErp((s) => s.update);
  const cancel = useErp((s) => s.cancel);

  const [query, setQuery] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<COrder | null>(null);
  const [cancelTarget, setCancelTarget] = useState<COrder | null>(null);

  const fields: FieldDef[] = [
    { name: "no", label: "Order No", required: true, half: true, placeholder: "ORD-..." },
    { name: "date", label: "Date", type: "date", required: true, half: true },
    { name: "customer", label: "Customer", type: "select", required: true,
      options: active(customers).map((c) => ({ label: c.name, value: c.name })) },
    { name: "product", label: "Product", type: "select", required: true, half: true,
      options: active(products).map((p) => ({ label: p.name, value: p.name })) },
    { name: "qty", label: "Qty (MT)", type: "number", required: true, half: true },
    { name: "rate", label: "Rate / MT", type: "number", required: true, half: true },
    { name: "vehicle", label: "Vehicle", type: "select", required: true, half: true,
      options: active(vehicles).map((v) => ({ label: v.number, value: v.number })) },
    { name: "driver", label: "Driver", type: "select", half: true,
      options: active(drivers).map((d) => ({ label: d.name, value: d.name })) },
    { name: "status", label: "Status", type: "select", required: true, half: true,
      options: STATUSES.map((s) => ({ label: s, value: s })) },
  ];

  const visible = orders.filter((o) => {
    if (showActive && o.cancelled) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return o.no.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.vehicle.toLowerCase().includes(q);
  });

  function handleSubmit(v: Record<string, unknown>) {
    if (editing) {
      update("orders", editing.id, { ...(v as Partial<COrder>) });
      toast.success(`Order ${editing.no} updated`);
    } else {
      const item: COrder = {
        id: newId("o"),
        no: String(v.no || `ORD-${Date.now().toString().slice(-6)}`),
        date: String(v.date),
        customer: String(v.customer),
        product: String(v.product),
        qty: Number(v.qty),
        rate: Number(v.rate),
        vehicle: String(v.vehicle),
        driver: String(v.driver || "—"),
        status: (v.status as OrderStatus) || "Pending",
      };
      add("orders", item);
      toast.success(`Order ${item.no} created`);
    }
    setEditing(null);
  }

  function exportPdf() {
    generatePdf({
      title: "Orders Register",
      subtitle: `${visible.length} active records  •  Cancelled documents are excluded`,
      filename: `orders-${Date.now()}.pdf`,
      head: ["Order", "Date", "Customer", "Product", "Qty", "Rate", "Value", "Vehicle", "Status"],
      body: active(visible).map((o) => [
        o.no, o.date, o.customer, o.product, o.qty, o.rate, o.qty * o.rate, o.vehicle, o.status,
      ]),
      totals: [
        { label: "Total qty (MT)", value: String(active(visible).reduce((a, o) => a + o.qty, 0)) },
        { label: "Total value", value: inr(active(visible).reduce((a, o) => a + o.qty * o.rate, 0)) },
      ],
    });
  }

  function downloadOrder(o: COrder) {
    generateDocPdf({
      type: "Delivery Challan",
      no: o.no,
      date: o.date,
      party: o.customer,
      rows: [
        { label: "Vehicle", value: o.vehicle },
        { label: "Driver", value: o.driver },
        { label: "Status", value: o.status },
      ],
      lines: {
        head: ["Product", "Qty (MT)", "Rate", "Amount"],
        body: [[o.product, o.qty, inr(o.rate), inr(o.qty * o.rate)]],
      },
      totals: [
        { label: "Sub Total", value: inr(o.qty * o.rate) },
        { label: "GST 5%", value: inr(o.qty * o.rate * 0.05) },
        { label: "Grand Total", value: inr(o.qty * o.rate * 1.05) },
      ],
      remark: o.cancelled ? `CANCELLED — ${o.cancelRemark ?? ""}` : undefined,
      filename: `${o.no}.pdf`,
    });
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Customer orders from booking to delivery and billing."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-1 h-4 w-4" />Export PDF</Button>
            <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />New order</Button>
          </>
        }
      />
      <div className="p-6">
        <ListShell
          toolbar={
            <>
              <div className="flex flex-1 items-center gap-2">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order no, customer, vehicle…" className="h-9 max-w-sm bg-background" />
                <Button variant={showActive ? "outline" : "secondary"} size="sm" onClick={() => setShowActive((s) => !s)}>
                  <Filter className="mr-1 h-4 w-4" />{showActive ? "Active only" : "Show all"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{visible.length} of {orders.length}</p>
            </>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((o) => (
                <TableRow key={o.id} className={o.cancelled ? "opacity-60" : ""}>
                  <TableCell className="font-mono text-xs">{o.no}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{o.date}</TableCell>
                  <TableCell className={`font-medium ${o.cancelled ? "line-through" : ""}`}>{o.customer}</TableCell>
                  <TableCell>{o.product}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.qty}</TableCell>
                  <TableCell className="text-right tabular-nums">{inr(o.rate)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{inr(o.qty * o.rate)}</TableCell>
                  <TableCell className="font-mono text-xs">{o.vehicle}</TableCell>
                  <TableCell>
                    {o.cancelled
                      ? <Badge variant="outline" className="bg-destructive/15 text-destructive">Cancelled</Badge>
                      : <Badge variant="outline" className={statusTone[o.status]}>{o.status}</Badge>}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => downloadOrder(o)}><FileDown className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" disabled={o.cancelled} onClick={() => { setEditing(o); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" disabled={o.cancelled} onClick={() => setCancelTarget(o)}><Ban className="h-3.5 w-3.5 text-destructive" /></Button>
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
        title="Order"
        fields={fields}
        mode={editing ? "edit" : "create"}
        initial={editing ?? { date: new Date().toISOString().slice(0, 10), status: "Pending" }}
        onSubmit={handleSubmit}
      />

      <CancelDialog
        open={!!cancelTarget}
        onOpenChange={(v) => !v && setCancelTarget(null)}
        title={cancelTarget ? `Cancel ${cancelTarget.no}` : "Cancel"}
        onConfirm={(remark) => {
          if (cancelTarget) {
            cancel("orders", cancelTarget.id, remark);
            toast.warning(`Order ${cancelTarget.no} cancelled`, { description: remark });
          }
        }}
      />
    </div>
  );
}
