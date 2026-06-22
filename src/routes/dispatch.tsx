import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, FileDown, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { ListShell } from "@/components/list-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { statusTone, inr } from "@/lib/mock-data";
import { useErp, active, type COrder } from "@/lib/store";
import { generateDocPdf, generatePdf } from "@/lib/pdf";

export const Route = createFileRoute("/dispatch")({
  head: () => ({ meta: [{ title: "Dispatch — Honey Enterprises ERP" }] }),
  component: DispatchPage,
});

function DispatchPage() {
  const orders = useErp((s) => s.orders);
  const update = useErp((s) => s.update);

  const [filter, setFilter] = useState<"all" | "pipeline">("pipeline");
  const list = active(orders).filter((o) =>
    filter === "all"
      ? true
      : ["Approved", "Loaded", "In Transit", "Delivered"].includes(o.status),
  );

  function downloadChallan(o: COrder) {
    generateDocPdf({
      type: "Delivery Challan", no: `DC-${o.no.slice(-3)}`, date: o.date, party: o.customer,
      rows: [
        { label: "Order Ref", value: o.no },
        { label: "Vehicle", value: o.vehicle },
        { label: "Driver", value: o.driver },
      ],
      lines: {
        head: ["Product", "Qty (MT)", "Rate", "Amount"],
        body: [[o.product, o.qty, inr(o.rate), inr(o.qty * o.rate)]],
      },
      totals: [{ label: "Grand Total", value: inr(o.qty * o.rate * 1.05) }],
      filename: `DC-${o.no}.pdf`,
    });
  }

  function exportPdf() {
    generatePdf({
      title: "Dispatch Pipeline",
      subtitle: "Cancelled orders excluded",
      filename: `dispatch-${Date.now()}.pdf`,
      head: ["Challan", "Vehicle", "Driver", "Customer", "Product", "Qty", "Status"],
      body: list.map((o) => [`DC-${o.no.slice(-3)}`, o.vehicle, o.driver, o.customer, o.product, o.qty, o.status]),
    });
  }

  function markPod(o: COrder) {
    update("orders", String(o.id), { status: "Delivered" });
    toast.success(`POD captured for ${o.no}`);
  }

  return (
    <div>
      <PageHeader title="Dispatch"
        description="Generate challans, track in-transit loads and capture POD on delivery."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="mr-1 h-4 w-4" />Export PDF</Button>
            <Button size="sm" onClick={() => setFilter(filter === "pipeline" ? "all" : "pipeline")}>
              <Truck className="mr-1 h-4 w-4" />{filter === "pipeline" ? "Show all" : "Pipeline only"}
            </Button>
          </>
        } />
      <div className="p-6">
        <ListShell toolbar={
          <>
            <p className="text-sm font-medium">{filter === "pipeline" ? "Active dispatch" : "All orders"}</p>
            <p className="text-xs text-muted-foreground">{list.length} records</p>
          </>
        }>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Challan</TableHead><TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead><TableHead>Customer</TableHead>
                <TableHead>Product</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">DC-{o.no.slice(-3)}</TableCell>
                  <TableCell className="font-mono text-xs">{o.vehicle}</TableCell>
                  <TableCell>{o.driver}</TableCell>
                  <TableCell className="font-medium">{o.customer}</TableCell>
                  <TableCell>{o.product}</TableCell>
                  <TableCell><Badge variant="outline" className={statusTone[o.status]}>{o.status}</Badge></TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => downloadChallan(o)}><FileDown className="mr-1 h-3.5 w-3.5" />PDF</Button>
                    <Button variant="ghost" size="sm" onClick={() => markPod(o)} disabled={o.status === "Delivered"}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />POD</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ListShell>
      </div>
    </div>
  );
}
