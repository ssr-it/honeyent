import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles, Eye, FileDown, Ban, Layers } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CancelDialog } from "@/components/entity-dialog";
import { OneShotOrderDialog } from "@/components/one-shot-order";
import { useErp, active, type COrder, type CTrip, type CWeighSlip, type CInvoice } from "@/lib/store";
import { updateOrderStatus } from "@/lib/api/clients";
import { generateDocPdf, generatePdf } from "@/lib/pdf";
import { inr } from "@/lib/mock-data";

export const Route = createFileRoute("/operations")({
    head: () => ({ meta: [{ title: "Operations — Honey Enterprises ERP" }] }),
    component: OperationsPage,
});

interface OperationRow {
    order: COrder;
    slip?: CWeighSlip;
    trip?: CTrip;
    invoice?: CInvoice;
    dispatchStatus: string;
    weightStatus: string;
    tripStatus: string;
    invoiceStatus: string;
    dealStatus: string;
}

function OperationsPage() {
    const orders = useErp((s) => s.orders);
    const weighSlips = useErp((s) => s.weighSlips);
    const trips = useErp((s) => s.trips);
    const salesInvoices = useErp((s) => s.salesInvoices);
    const cancel = useErp((s) => s.cancel);

    const [query, setQuery] = useState("");
    const [viewing, setViewing] = useState<OperationRow | null>(null);
    const [cancelTarget, setCancelTarget] = useState<COrder | null>(null);
    const [oneShot, setOneShot] = useState(false);

    const rows = useMemo(() => {
        return active(orders).map((order) => {
            const trip = active(trips).find((t) => t.dealId && order.dealId ? t.dealId === order.dealId : t.date === order.date && t.vehicle === order.vehicle);
            const slip = active(weighSlips).find((w) => w.dealId && order.dealId ? w.dealId === order.dealId : w.date === order.date && w.vehicle === order.vehicle && w.product === order.product);
            const invoice = active(salesInvoices).find((i) => i.dealId && order.dealId ? i.dealId === order.dealId : i.party === order.customer && i.date === order.date);

            const dispatchStatus = order.status;
            const weightStatus = slip ? "Captured" : "Pending";
            const tripStatus = trip ? (trip.status ?? "Done") : "Pending";
            const invoiceStatus = invoice?.status ?? "Draft";
            const dealStatus = invoice
                ? invoice.status === "Paid" && order.status === "Delivered"
                    ? "Complete"
                    : "In Progress"
                : "Draft";

            return {
                order,
                slip,
                trip,
                invoice,
                dispatchStatus,
                weightStatus,
                tripStatus,
                invoiceStatus,
                dealStatus,
            };
        });
    }, [orders, trips, weighSlips, salesInvoices]);

    const visible = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter((row) =>
            row.order.no.toLowerCase().includes(term)
            || row.order.customer.toLowerCase().includes(term)
            || row.order.product.toLowerCase().includes(term)
            || row.order.vehicle.toLowerCase().includes(term)
            || (row.order.supplier ?? "").toLowerCase().includes(term)
        );
    }, [query, rows]);

    function orderStatusLabel(status: string) {
        return status === "Pending" ? "Pending" : "Completed";
    }

    function exportRegister() {
        generatePdf({
            title: "Operations Register",
            subtitle: `${visible.length} active operations`,
            filename: `operations-${Date.now()}.pdf`,
            head: ["Order", "Date", "Customer", "Product", "Qty", "Vehicle", "Status"],
            body: visible.map((row) => [
                row.order.no,
                row.order.date,
                row.order.customer,
                row.order.product,
                `${row.order.qty} MT`,
                row.order.vehicle,
                orderStatusLabel(row.order.status),
            ]),
            totals: [
                { label: "Total qty", value: `${visible.reduce((acc, row) => acc + row.order.qty, 0)} MT` },
            ],
        });
    }

    async function changeOrderStatus(order: COrder, nextStatus: "Pending" | "Completed") {
        // Final statuses that make an order a fixed document
        const FINAL = ["Delivered", "Billed", "Closed"];
        // Prevent reverting a final/completed document — must be cancelled instead
        if (nextStatus === "Pending" && FINAL.includes(order.status)) {
            toast.error(`${order.no} is a finalized document. Cancel with a remark to reverse.`);
            return;
        }

        const apiStatus = nextStatus === "Pending" ? "Pending" : "Delivered";
        try {
            await updateOrderStatus(String(order.id), apiStatus);
            useErp.getState().update("orders", String(order.id), { status: apiStatus });
            toast.success(`${order.no} marked ${nextStatus}`);
        } catch (err) {
            toast.error(`Unable to update status: ${String(err)}`);
        }
    }

    function printOperation(row: OperationRow) {
        const amount = row.order.qty * row.order.rate;
        generatePdf({
            title: `Order ${row.order.no}`,
            subtitle: `${row.order.customer} • ${orderStatusLabel(row.order.status)}`,
            filename: `operations-${row.order.no}.pdf`,
            head: ["Label", "Value"],
            body: [
                ["Order status", orderStatusLabel(row.order.status)],
                ["Product", row.order.product],
                ["Qty", `${row.order.qty} MT`],
                ["Vehicle", row.order.vehicle],
                ["Rate", inr(row.order.rate)],
                ["Total", inr(amount)],
            ],
            totals: [
                { label: "Total amount", value: inr(amount) },
            ],
        });
    }

    function loseOrder(order: COrder) {
        setCancelTarget(order);
    }

    return (
        <div>
            <PageHeader
                title="Operations Register"
                description="One central register for every transaction: orders, dispatch, weighbridge, trips and invoices."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={exportRegister}><FileDown className="mr-1 h-4 w-4" />Export</Button>
                        <Button size="sm" onClick={() => setOneShot(true)}><Sparkles className="mr-1 h-4 w-4" />One-Shot Order</Button>
                    </>
                }
            />

            <div className="space-y-4 p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Operations overview</p>
                        <p className="text-xs text-muted-foreground">Search by order, customer, product, supplier or vehicle.</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search operations…"
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <Badge variant="outline">{visible.length} records</Badge>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((row) => (
                                <TableRow key={row.order.id}>
                                    <TableCell className="font-mono text-xs">{row.order.no}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{row.order.date}</TableCell>
                                    <TableCell>{row.order.customer}</TableCell>
                                    <TableCell>{row.order.product}</TableCell>
                                    <TableCell className="text-right tabular-nums">{row.order.qty} MT</TableCell>
                                    <TableCell className="font-mono text-xs">{row.order.vehicle}</TableCell>
                                    <TableCell><Badge variant="outline" className={row.order.status === "Pending" ? "bg-muted text-muted-foreground" : "bg-success/15 text-success"}>{orderStatusLabel(row.order.status)}</Badge></TableCell>
                                    <TableCell className="text-right whitespace-nowrap">
                                        <Button variant="ghost" size="sm" onClick={() => setViewing(row)}><Eye className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="sm" onClick={() => changeOrderStatus(row.order, row.order.status === "Pending" ? "Completed" : "Pending")}>{row.order.status === "Pending" ? "Complete" : "Pending"}</Button>
                                        <Button variant="ghost" size="sm" onClick={() => loseOrder(row.order)}><Ban className="h-3.5 w-3.5 text-destructive" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
                {viewing ? (
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <DialogTitle>Order #{viewing?.order.no}</DialogTitle>
                                    <DialogDescription className="mt-2">
                                        <div className="flex flex-wrap gap-4 text-xs">
                                            {viewing?.slip && <span>✓ Weigh Slip: {viewing.slip.slipNo}</span>}
                                            {viewing?.trip && <span>✓ Trip: {viewing.trip.tripNo}</span>}
                                            {viewing?.invoice && <span>✓ Invoice: {viewing.invoice.no}</span>}
                                        </div>
                                        <p className="mt-2">Complete transaction view: dispatch, weighbridge, logistics & billing.</p>
                                    </DialogDescription>
                                </div>
                                <div className="text-right">
                                    <Badge variant={viewing?.dealStatus === "Complete" ? "default" : "secondary"}>
                                        {viewing?.dealStatus}
                                    </Badge>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="grid gap-4 py-2">
                            <DetailSection title="Order summary">
                                <DetailRow label="Order #" value={viewing.order.no} />
                                <DetailRow label="Date" value={viewing.order.date} />
                                <DetailRow label="Customer" value={viewing.order.customer} />
                                <DetailRow label="Product" value={viewing.order.product} />
                                <DetailRow label="Quantity" value={`${viewing.order.qty} MT`} />
                                <DetailRow label="Rate" value={inr(viewing.order.rate)} />
                                <DetailRow label="Total value" value={inr(viewing.order.qty * viewing.order.rate)} />
                                <DetailRow label="Vehicle" value={viewing.order.vehicle} />
                                <DetailRow label="Status" value={orderStatusLabel(viewing.order.status)} />
                                <DetailRow label="Payment terms" value={viewing.order.paymentTerms ?? "—"} />
                                <DetailRow label="Remarks" value={viewing.order.remarks ?? "—"} />
                            </DetailSection>
                        </div>

                        <DialogFooter className="flex-col gap-3 sm:flex-row">
                            <div className="flex flex-wrap gap-2">
                                {viewing?.slip && (
                                    <Button variant="secondary" size="sm" onClick={() => viewing && printOperation(viewing)}>
                                        <FileDown className="mr-1 h-3 w-3" />Weigh Slip
                                    </Button>
                                )}
                                {viewing?.trip && (
                                    <Button variant="secondary" size="sm" onClick={() => viewing && printOperation(viewing)}>
                                        <FileDown className="mr-1 h-3 w-3" />Trip Details
                                    </Button>
                                )}
                                {viewing?.invoice && (
                                    <Button variant="secondary" size="sm" onClick={() => viewing && printOperation(viewing)}>
                                        <FileDown className="mr-1 h-3 w-3" />Invoice PDF
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
                                <Button onClick={() => viewing && printOperation(viewing)}><FileDown className="mr-1 h-4 w-4" />Full Report</Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                ) : null}
            </Dialog>

            <CancelDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)} title={cancelTarget ? `Cancel ${cancelTarget.no}` : "Cancel"} onConfirm={(remark) => {
                if (cancelTarget) {
                    cancel("orders", String(cancelTarget.id), remark);
                    toast.warning(`${cancelTarget.no} cancelled`, { description: remark });
                    setCancelTarget(null);
                }
            }} />

            <OneShotOrderDialog open={oneShot} onOpenChange={setOneShot} />
        </div>
    );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
            <div className="mt-3 grid gap-2">{children}</div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right tabular-nums">{value}</span>
        </div>
    );
}
