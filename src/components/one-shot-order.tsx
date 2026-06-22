// One-Shot Order: a single guided form that creates an Order, Weigh Slip,
// Trip and Sales Invoice (+ optional Purchase Invoice) in one click — all
// auto-numbered, all linked by dealId.

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { useErp, active, loadBackendData } from "@/lib/store";
import { inr } from "@/lib/mock-data";
import {
  createOrder,
  createWeighSlip,
  createTrip,
  createDeliveryChallan,
  createSalesInvoice,
  createPurchaseInvoice,
  createDeal,
  updateDeal,
} from "@/lib/api/clients";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function OneShotOrderDialog({ open, onOpenChange }: Props) {
  const customers = active(useErp((s) => s.customers));
  const suppliers = active(useErp((s) => s.suppliers));
  const products = active(useErp((s) => s.products));
  const vehicles = active(useErp((s) => s.vehicles));
  const drivers = active(useErp((s) => s.drivers));

  const [f, setF] = useState({
    date: new Date().toISOString().slice(0, 10),
    customer: "",
    shipTo: "",
    supplier: "",
    product: "",
    vehicle: "",
    driver: "",
    qty: "",
    rate: "",
    freight: "",
    source: "",
    destination: "",
    paymentTerms: "Net 15 days",
    remark: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setF((s) => ({ ...s, date: new Date().toISOString().slice(0, 10) }));
    }
  }, [open]);

  const product = useMemo(() => products.find((p) => p.name === f.product), [products, f.product]);
  const customer = useMemo(() => customers.find((c) => c.name === f.customer), [customers, f.customer]);

  // auto-fill rate when product picked
  useEffect(() => {
    if (product && f.rate === "") {
      setF((s) => ({ ...s, rate: String(product.rate) }));
    }
  }, [product, f.rate]);

  useEffect(() => {
    if (f.supplier && !f.source) {
      setF((s) => ({ ...s, source: f.supplier }));
    }
  }, [f.supplier, f.source]);

  const qtyNumber = Number(f.qty) || 0;
  const rateNumber = Number(f.rate) || 0;
  const freightNumber = Number(f.freight) || 0;
  const gstPct = product?.gst ?? 5;
  const subtotal = qtyNumber * rateNumber;
  const gstAmt = Math.round(subtotal * (gstPct / 100));
  const grand = subtotal + gstAmt + freightNumber;

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((s) => ({ ...s, [k]: v }));
  }

  async function save() {
    if (!f.customer || !f.product || !f.vehicle || !f.qty || !f.rate) {
      toast.error("Please fill customer, product, vehicle, qty and rate");
      return;
    }

    setSaving(true);
    try {
      const destination = f.destination || f.shipTo || customer?.city || "Customer Site";
      const netKg = Math.round(qtyNumber * 1000);

      const deal = await createDeal({
        dealDate: f.date,
        customer: f.customer,
        supplier: f.supplier || undefined,
        status: "Draft",
      });

      const order = await createOrder({
        date: f.date,
        customer: f.customer,
        supplier: f.supplier || undefined,
        shipTo: f.shipTo || undefined,
        product: f.product,
        qty: qtyNumber,
        rate: rateNumber,
        freight: freightNumber || 0,
        vehicle: f.vehicle,
        driver: f.driver || "—",
        source: f.source || undefined,
        destination,
        paymentTerms: f.paymentTerms,
        remarks: f.remark || undefined,
        status: "Approved",
        dealId: deal.id,
      });

      const slip = await createWeighSlip({
        slipDate: f.date,
        vehicle: f.vehicle,
        product: f.product,
        grossWeight: netKg + 13000,
        tareWeight: 13000,
        netWeight: netKg,
        customerWeight: undefined,
        lossWeight: undefined,
        dealId: deal.id,
      });

      const trip = await createTrip({
        date: f.date,
        vehicle: f.vehicle,
        driver: f.driver || "—",
        source: f.source || "Yard",
        destination,
        weight: qtyNumber,
        revenue: subtotal + freightNumber,
        tripExpenses: freightNumber,
        dealId: deal.id,
      });

      const challan = await createDeliveryChallan({
        challanDate: f.date,
        orderId: order.id,
        dealId: deal.id,
        customer: f.customer,
        product: f.product,
        qty: qtyNumber,
        hsnCode: product?.hsn,
        gstRate: gstPct,
        amount: subtotal + freightNumber,
        status: "Pending",
      });

      const salesInvoice = await createSalesInvoice({
        invoiceDate: f.date,
        customer: f.customer,
        orderId: order.id,
        subTotal: subtotal,
        cgstAmount: gstAmt / 2,
        sgstAmount: gstAmt / 2,
        igstAmount: 0,
        totalAmount: grand,
        dealId: deal.id,
      });

      let purchaseInvoice;
      if (f.supplier) {
        purchaseInvoice = await createPurchaseInvoice({
          invoiceDate: f.date,
          supplier: f.supplier,
          orderId: order.id,
          subTotal: Math.round(subtotal * 0.7),
          gstAmount: Math.round(subtotal * 0.7 * 0.05),
          totalAmount: Math.round(subtotal * 0.7 * 1.05),
          dealId: deal.id,
        });
      }

      await updateDeal(deal.id, {
        orderId: order.id,
        challanId: challan.id,
        weighSlipId: slip.id,
        tripId: trip.id,
        salesInvoiceId: salesInvoice.id,
        purchaseInvoiceId: purchaseInvoice?.id,
        totalValue: grand,
        status: "In Progress",
      });

      await loadBackendData();
      toast.success("Deal created", {
        description: `Order ${order.no}, Challan ${challan.challanNo}, Weigh ${slip.slipNo}, Trip ${trip.tripNo}, Invoice ${salesInvoice.no}`,
      });
      onOpenChange(false);
      setF({
        date: new Date().toISOString().slice(0, 10),
        customer: "", shipTo: "", supplier: "", product: "",
        vehicle: "", driver: "", qty: "", rate: "", freight: "",
        source: "", destination: "", paymentTerms: "Net 15 days", remark: "",
      });
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  }

  function S({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
    return (
      <div className={`grid gap-1.5 ${full ? "col-span-2" : ""}`}>
        <Label className="text-xs">{label}</Label>
        {children}
      </div>
    );
  }

  function Sel({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
    return (
      <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> One-Shot Order
          </DialogTitle>
          <DialogDescription>
            Fill once — system auto-creates Order, Delivery Challan, Weigh Slip, Trip Sheet and Tax Invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <S label="Date"><Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></S>
          <S label="Payment terms"><Input value={f.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} /></S>

          <S label="Customer *"><Sel value={f.customer} onChange={(v) => set("customer", v)} options={customers.map((c) => c.name)} placeholder="Select customer" /></S>
          <S label="Ship to (optional)"><Input value={f.shipTo} onChange={(e) => set("shipTo", e.target.value)} placeholder={customer?.city || "Site address"} /></S>

          <S label="Supplier / Source (optional)"><Sel value={f.supplier} onChange={(v) => set("supplier", v)} options={suppliers.map((s) => s.name)} placeholder="Select supplier / source" /></S>
          <S label="Product *"><Sel value={f.product} onChange={(v) => set("product", v)} options={products.map((p) => p.name)} placeholder="Select product" /></S>

          <S label="Vehicle *"><Sel value={f.vehicle} onChange={(v) => set("vehicle", v)} options={vehicles.map((v) => v.number)} placeholder="Select vehicle" /></S>
          <S label="Driver"><Sel value={f.driver} onChange={(v) => set("driver", v)} options={drivers.map((d) => d.name)} placeholder="Select driver" /></S>

          <S label="Qty (MT) *"><Input type="number" value={f.qty} onChange={(e) => set("qty", e.target.value)} /></S>
          <S label="Rate / MT *"><Input type="number" value={f.rate} onChange={(e) => set("rate", e.target.value)} /></S>

          <S label="Freight"><Input type="number" value={f.freight} onChange={(e) => set("freight", e.target.value)} /></S>
          <S label="HSN / GST">
            <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-muted/30 px-2 text-xs">
              <Badge variant="outline">{product?.hsn ?? "—"}</Badge>
              <span className="text-muted-foreground">GST {gstPct}%</span>
            </div>
          </S>

          <S label="Source / Yard / Supplier"><Input value={f.source} onChange={(e) => set("source", e.target.value)} placeholder="Supplier / Yard / Source" /></S>
          <S label="Destination"><Input value={f.destination} onChange={(e) => set("destination", e.target.value)} placeholder={customer?.city || "Site"} /></S>

          <S label="Remark" full><Textarea rows={2} value={f.remark} onChange={(e) => set("remark", e.target.value)} placeholder="Any internal note…" /></S>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Sub total</span><span className="font-medium tabular-nums">{inr(subtotal)}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">GST {gstPct}%</span><span className="tabular-nums">{inr(gstAmt)}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Freight</span><span className="tabular-nums">{inr(Number(f.freight || 0))}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="font-semibold">Grand total</span><span className="font-display text-lg font-semibold text-primary">{inr(grand)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Creating…" : <><Sparkles className="mr-1 h-4 w-4" />Create deal</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
