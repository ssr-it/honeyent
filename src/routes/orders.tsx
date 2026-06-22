import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Filter, Download, Pencil, Ban, FileDown, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { ListShell } from "@/components/list-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inr, statusTone, type OrderStatus } from "@/lib/mock-data";
import { useErp, active, type COrder, loadBackendData } from "@/lib/store";
import { EntityDialog, CancelDialog, type FieldDef } from "@/components/entity-dialog";
import { generateDocPdf, generatePdf } from "@/lib/pdf";
import { DateRangeFilter, EMPTY_RANGE, inRange, type DateRange } from "@/components/date-range-filter";
import { createOrder, updateOrder, deleteOrder } from "@/lib/api/clients";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — Honey Enterprises ERP" }] }),
  component: OrdersPage,
});

const STATUSES: OrderStatus[] = ["Pending", "Approved", "Loaded", "In Transit", "Delivered", "Billed", "Closed"];

function OrdersPage() {
  const orders = useErp((s) => s.orders);
  const customers = useErp((s) => s.customers);
  const suppliers = useErp((s) => s.suppliers);
  const products = useErp((s) => s.products);
  const vehicles = useErp((s) => s.vehicles);
  const drivers = useErp((s) => s.drivers);

  const [query, setQuery] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<COrder | null>(null);
  const [cancelTarget, setCancelTarget] = useState<COrder | null>(null);
  const [loading, setLoading] = useState(false);

  const fields: FieldDef[] = [
    { name: "date", label: "Date", type: "date", required: true, half: true },
    {
      name: "customer", label: "Customer", type: "select", required: true,
      options: active(customers).map((c) => ({ label: c.name, value: c.name }))
    },
    {
      name: "supplier", label: "Supplier", type: "select", half: true,
      options: active(suppliers).map((s) => ({ label: s.name, value: s.name }))
    },
    {
      name: "product", label: "Product", type: "select", required: true, half: true,
      options: active(products).map((p) => ({ label: p.name, value: p.name }))
    },
    { name: "qty", label: "Qty (MT)", type: "number", required: true, half: true },
    { name: "rate", label: "Rate / MT", type: "number", required: true, half: true },
    {
      name: "vehicle", label: "Vehicle", type: "select", required: true, half: true,
      options: active(vehicles).map((v) => ({ label: v.number, value: v.number }))
    },
    {
      name: "driver", label: "Driver", type: "select", half: true,
      options: active(drivers).map((d) => ({ label: d.name, value: d.name }))
    },
    { name: "freight", label: "Freight Amount", type: "number", half: true },
    { name: "paymentTerms", label: "Payment Terms", type: "text", half: true },
    { name: "expectedDelivery", label: "Expected Delivery", type: "date", half: true },
    { name: "remarks", label: "Remarks", type: "textarea", half: true },
    {
      name: "status", label: "Status", type: "select", required: true, half: true,
      options: STATUSES.map((s) => ({ label: s, value: s }))
    },
  ];

  const visible = orders.filter((o) => {
    if (showActive && o.cancelled) return false;
    if (!inRange(o.date, range)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return o.no.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.vehicle.toLowerCase().includes(q);
  });

  async function handleSubmit(v: Record<string, unknown>) {
    setLoading(true);
    try {
      const data = {
        date: String(v.date),
        customer: String(v.customer),
        supplier: String(v.supplier || ""),
        product: String(v.product),
        qty: Number(v.qty),
        rate: Number(v.rate),
        vehicle: String(v.vehicle),
        driver: String(v.driver || ""),
        freight: Number(v.freight || 0),
        paymentTerms: String(v.paymentTerms || ""),
        expectedDelivery: String(v.expectedDelivery || ""),
        remarks: String(v.remarks || ""),
        status: (v.status as OrderStatus) || "Pending",
      };

      if (editing) {
        await updateOrder(String(editing.id), data);
        toast.success(`Order ${editing.no} updated`);
      } else {
        const order = await createOrder(data);
        toast.success(`Order ${order.no} created`);
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
          </>
        }
      />
      <div className="space-y-3 p-6">
        <DateRangeFilter value={range} onChange={setRange} />
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
                    {(() => {
                      const FINAL = ["Delivered", "Billed", "Closed"];
                      const isFinal = FINAL.includes(o.status);
                      return (
                        <>
                          <Button variant="ghost" size="sm" disabled={o.cancelled || isFinal} onClick={() => { setEditing(o); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" disabled={o.cancelled} onClick={() => setCancelTarget(o)}><Ban className="h-3.5 w-3.5 text-destructive" /></Button>
                        </>
                      );
                    })()}
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
        mode="edit"
        initial={editing ?? { date: new Date().toISOString().slice(0, 10), status: "Pending" }}
        onSubmit={handleSubmit}
        disabled={loading}
      />

      <CancelDialog
        open={!!cancelTarget}
        onOpenChange={(v) => !v && setCancelTarget(null)}
        title={cancelTarget ? `Cancel ${cancelTarget.no}` : "Cancel"}
        onConfirm={async (remark) => {
          if (cancelTarget) {
            setLoading(true);
            try {
              await deleteOrder(String(cancelTarget.id));
              toast.warning(`Order ${cancelTarget.no} cancelled`, { description: remark });
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
  );
}
