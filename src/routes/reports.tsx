import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users, Factory, Truck, IdCard, Package, FileText, Receipt,
  Route as RouteIcon, Scale, TrendingUp, Eye, Wrench, CalendarDays,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useErp, active } from "@/lib/store";
import { inr, daysUntil } from "@/lib/mock-data";
import { ReportView, type ReportData } from "@/components/report-view";
import { DateRangeFilter, EMPTY_RANGE, inRange, type DateRange } from "@/components/date-range-filter";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Honey Enterprises ERP" }] }),
  component: ReportsPage,
});

type ReportKey =
  | "cust-outstanding" | "cust-sales" | "cust-ledger" | "cust-dispatch"
  | "sup-purchase" | "sup-ledger" | "sup-payables"
  | "veh-pl" | "veh-expiry" | "veh-mileage" | "veh-maint"
  | "drv-trips" | "drv-salary" | "drv-salary-reg"
  | "prod-sales" | "prod-rate" | "hsn-summary"
  | "trip-pl" | "trip-route" | "trip-cust"
  | "wb-loss" | "wb-compare"
  | "fin-pl" | "fin-bs" | "fin-tb"
  | "gst-r1" | "gst-r3b" | "gst-eway"
  | "perf-daily" | "perf-monthly" | "perf-aging" | "top-customers"
  | "ops-daily" | "exp-summary" | "exp-register";

function ReportsPage() {
  const customers = useErp((s) => s.customers);
  const suppliers = useErp((s) => s.suppliers);
  const vehicles = useErp((s) => s.vehicles);
  const drivers = useErp((s) => s.drivers);
  const products = useErp((s) => s.products);
  const allOrders = useErp((s) => s.orders);
  const allTrips = useErp((s) => s.trips);
  const allSlips = useErp((s) => s.weighSlips);
  const allSales = useErp((s) => s.salesInvoices);
  const allPurchases = useErp((s) => s.purchaseInvoices);
  const allExpenses = useErp((s) => s.expenses);

  const [view, setView] = useState<ReportData | null>(null);
  const [range, setRange] = useState<DateRange>(EMPTY_RANGE);

  // Apply date filter to all date-bearing entities
  const orders = useMemo(() => allOrders.filter((o) => inRange(o.date, range)), [allOrders, range]);
  const trips = useMemo(() => allTrips.filter((t) => inRange(t.date, range)), [allTrips, range]);
  const slips = useMemo(() => allSlips.filter((w) => inRange(w.date, range)), [allSlips, range]);
  const sales = useMemo(() => allSales.filter((i) => inRange(i.date, range)), [allSales, range]);
  const purchases = useMemo(() => allPurchases.filter((i) => inRange(i.date, range)), [allPurchases, range]);
  const expenses = useMemo(() => allExpenses.filter((e) => inRange(e.date, range)), [allExpenses, range]);

  function build(key: ReportKey, title: string): ReportData {
    let head: string[] = [];
    let body: (string | number)[][] = [];
    let totals: { label: string; value: string }[] | undefined;
    const rangeNote = range.from || range.to ? ` • ${range.from || "…"} → ${range.to || "…"}` : " • All dates";
    const subtitle = `Generated ${new Date().toLocaleDateString("en-IN")}${rangeNote} • Cancelled records excluded`;

    switch (key) {
      case "cust-outstanding":
        head = ["Code", "Customer", "City", "Credit Limit", "Outstanding"];
        body = active(customers).filter((c) => c.outstanding > 0).map((c) => [c.code, c.name, c.city, inr(c.creditLimit), inr(c.outstanding)]);
        totals = [{ label: "Total receivable", value: inr(active(customers).reduce((a, c) => a + c.outstanding, 0)) }];
        break;
      case "cust-sales":
        head = ["Invoice", "Date", "Customer", "Amount", "Status"];
        body = active(sales).map((i) => [i.no, i.date, i.party, inr(i.amount), i.status]);
        totals = [{ label: "Total sales", value: inr(active(sales).reduce((a, i) => a + i.amount, 0)) }];
        break;
      case "cust-ledger":
        head = ["Customer", "Mobile", "Credit Limit", "Outstanding"];
        body = active(customers).map((c) => [c.name, c.mobile, inr(c.creditLimit), inr(c.outstanding)]);
        break;
      case "cust-dispatch":
        head = ["Customer", "Orders", "Total MT", "Total Value"];
        body = Array.from(new Set(active(orders).map((o) => o.customer))).map((cn) => {
          const list = active(orders).filter((o) => o.customer === cn);
          return [cn, list.length, list.reduce((a, o) => a + o.qty, 0), inr(list.reduce((a, o) => a + o.qty * o.rate, 0))];
        });
        break;
      case "sup-purchase":
        head = ["Bill", "Date", "Supplier", "Amount", "Status"];
        body = active(purchases).map((i) => [i.no, i.date, i.party, inr(i.amount), i.status]);
        totals = [{ label: "Total purchases", value: inr(active(purchases).reduce((a, i) => a + i.amount, 0)) }];
        break;
      case "sup-ledger":
      case "sup-payables":
        head = ["Code", "Supplier", "Mobile", "Payable"];
        body = active(suppliers).map((s) => [s.code, s.name, s.mobile, inr(s.outstanding)]);
        totals = [{ label: "Total payable", value: inr(active(suppliers).reduce((a, s) => a + s.outstanding, 0)) }];
        break;
      case "veh-pl":
        head = ["Vehicle", "Trips", "Revenue", "Expense", "Profit"];
        body = Array.from(new Set(active(trips).map((t) => t.vehicle))).map((vn) => {
          const list = active(trips).filter((t) => t.vehicle === vn);
          const rev = list.reduce((a, t) => a + t.revenue, 0);
          const exp = list.reduce((a, t) => a + t.expense, 0);
          return [vn, list.length, inr(rev), inr(exp), inr(rev - exp)];
        });
        break;
      case "veh-expiry":
        head = ["Vehicle", "Insurance", "Days", "Fitness", "Days", "Permit", "Days"];
        body = active(vehicles).map((v) => [v.number,
          v.insuranceExpiry, daysUntil(v.insuranceExpiry),
          v.fitnessExpiry, daysUntil(v.fitnessExpiry),
          v.permitExpiry, daysUntil(v.permitExpiry)]);
        break;
      case "veh-mileage":
        head = ["Vehicle", "Capacity", "Ownership"];
        body = active(vehicles).map((v) => [v.number, `${v.capacity} MT`, v.ownership]);
        break;
      case "drv-trips":
        head = ["Driver", "Trips", "Revenue", "Profit"];
        body = Array.from(new Set(active(trips).map((t) => t.driver))).map((dn) => {
          const list = active(trips).filter((t) => t.driver === dn);
          const rev = list.reduce((a, t) => a + t.revenue, 0);
          const prof = rev - list.reduce((a, t) => a + t.expense, 0);
          return [dn, list.length, inr(rev), inr(prof)];
        });
        break;
      case "drv-salary":
        head = ["Driver", "Mobile", "License", "Status"];
        body = active(drivers).map((d) => [d.name, d.mobile, d.license, d.status]);
        break;
      case "prod-sales":
        head = ["Product", "Total MT", "Total Value"];
        body = active(products).map((p) => {
          const list = active(orders).filter((o) => o.product === p.name);
          return [p.name, list.reduce((a, o) => a + o.qty, 0), inr(list.reduce((a, o) => a + o.qty * o.rate, 0))];
        });
        break;
      case "prod-rate":
        head = ["Code", "Product", "HSN", "Unit", "GST %", "Rate"];
        body = active(products).map((p) => [p.code, p.name, p.hsn, p.unit, `${p.gst}%`, inr(p.rate)]);
        break;
      case "hsn-summary":
        head = ["HSN", "Products", "GST %", "Total Value"];
        body = Array.from(new Set(active(products).map((p) => p.hsn))).map((h) => {
          const list = active(products).filter((p) => p.hsn === h);
          const orderList = active(orders).filter((o) => list.some((p) => p.name === o.product));
          return [h, list.length, `${list[0]?.gst ?? 5}%`, inr(orderList.reduce((a, o) => a + o.qty * o.rate, 0))];
        });
        break;
      case "trip-pl":
        head = ["Trip", "Date", "Route", "MT", "Revenue", "Expense", "Profit"];
        body = active(trips).map((t) => [t.tripNo, t.date, `${t.source} → ${t.destination}`, t.weight, inr(t.revenue), inr(t.expense), inr(t.revenue - t.expense)]);
        totals = [{ label: "Net profit", value: inr(active(trips).reduce((a, t) => a + (t.revenue - t.expense), 0)) }];
        break;
      case "trip-route":
        head = ["Route", "Trips", "Revenue", "Profit"];
        body = Array.from(new Set(active(trips).map((t) => `${t.source} → ${t.destination}`))).map((r) => {
          const list = active(trips).filter((t) => `${t.source} → ${t.destination}` === r);
          return [r, list.length, inr(list.reduce((a, t) => a + t.revenue, 0)), inr(list.reduce((a, t) => a + (t.revenue - t.expense), 0))];
        });
        break;
      case "trip-cust":
        head = ["Customer", "Orders", "Total Value"];
        body = Array.from(new Set(active(orders).map((o) => o.customer))).map((c) => {
          const list = active(orders).filter((o) => o.customer === c);
          return [c, list.length, inr(list.reduce((a, o) => a + o.qty * o.rate, 0))];
        });
        break;
      case "wb-loss":
        head = ["Slip", "Date", "Vehicle", "Net", "Cust Wt", "Loss"];
        body = active(slips).filter((w) => (w.loss ?? 0) > 0).map((w) => [w.slipNo, w.date, w.vehicle, w.net, w.customerWeight ?? "—", w.loss ?? 0]);
        totals = [{ label: "Total loss (kg)", value: active(slips).reduce((a, w) => a + (w.loss ?? 0), 0).toLocaleString("en-IN") }];
        break;
      case "wb-compare":
        head = ["Slip", "Vehicle", "Net (Crusher)", "Cust Wt", "Diff"];
        body = active(slips).map((w) => [w.slipNo, w.vehicle, w.net, w.customerWeight ?? "—", w.customerWeight ? w.net - w.customerWeight : "—"]);
        break;
      case "fin-pl": {
        const rev = active(sales).reduce((a, i) => a + i.amount, 0);
        const cost = active(purchases).reduce((a, i) => a + i.amount, 0);
        const tripExp = active(trips).reduce((a, t) => a + t.expense, 0);
        head = ["Particulars", "Amount"];
        body = [["Sales", inr(rev)], ["Material purchases", `(${inr(cost)})`], ["Trip expenses", `(${inr(tripExp)})`], ["Gross profit", inr(rev - cost - tripExp)]];
        break;
      }
      case "fin-bs":
        head = ["Account", "Balance"];
        body = [
          ["Receivables (customers)", inr(active(customers).reduce((a, c) => a + c.outstanding, 0))],
          ["Payables (suppliers)", inr(active(suppliers).reduce((a, s) => a + s.outstanding, 0))],
          ["Unbilled sales", inr(active(sales).filter((i) => i.status !== "Paid").reduce((a, i) => a + i.amount, 0))],
        ];
        break;
      case "fin-tb":
        head = ["Account", "Debit", "Credit"];
        body = [
          ["Sales", "", inr(active(sales).reduce((a, i) => a + i.amount, 0))],
          ["Purchases", inr(active(purchases).reduce((a, i) => a + i.amount, 0)), ""],
          ["Trip Expenses", inr(active(trips).reduce((a, t) => a + t.expense, 0)), ""],
        ];
        break;
      case "gst-r1":
        head = ["Invoice", "Date", "Customer", "Taxable", "GST", "Total"];
        body = active(sales).map((i) => [i.no, i.date, i.party, inr(i.amount - i.gst), inr(i.gst), inr(i.amount)]);
        totals = [{ label: "Total output GST", value: inr(active(sales).reduce((a, i) => a + i.gst, 0)) }];
        break;
      case "gst-r3b": {
        const outGst = active(sales).reduce((a, i) => a + i.gst, 0);
        const inGst = active(purchases).reduce((a, i) => a + i.gst, 0);
        head = ["Particulars", "Amount"];
        body = [["Output GST", inr(outGst)], ["Input GST", inr(inGst)], ["Net payable", inr(Math.max(outGst - inGst, 0))]];
        break;
      }
      case "gst-eway":
        head = ["Challan", "Date", "Customer", "Vehicle", "Value"];
        body = active(orders).map((o) => [`DC-${o.no.slice(-3)}`, o.date, o.customer, o.vehicle, inr(o.qty * o.rate)]);
        break;
      case "perf-daily":
        head = ["Metric", "Value"];
        body = [
          ["Active orders", active(orders).length],
          ["Active trips", active(trips).length],
          ["Trip revenue", inr(active(trips).reduce((a, t) => a + t.revenue, 0))],
          ["Trip profit", inr(active(trips).reduce((a, t) => a + (t.revenue - t.expense), 0))],
        ];
        break;
      case "perf-monthly":
        head = ["Period", "Sales", "Purchases", "Profit"];
        body = [["Current", inr(active(sales).reduce((a, i) => a + i.amount, 0)),
          inr(active(purchases).reduce((a, i) => a + i.amount, 0)),
          inr(active(trips).reduce((a, t) => a + (t.revenue - t.expense), 0))]];
        break;
      case "perf-aging":
        head = ["Customer", "Outstanding", "Status"];
        body = active(customers).filter((c) => c.outstanding > 0).map((c) => [c.name, inr(c.outstanding), c.outstanding > c.creditLimit ? "Over limit" : "Within limit"]);
        break;
      case "top-customers": {
        const rows = active(customers).map((c) => {
          const list = active(orders).filter((o) => o.customer === c.name);
          return { n: c.name, mt: list.reduce((a, o) => a + o.qty, 0), v: list.reduce((a, o) => a + o.qty * o.rate, 0) };
        }).sort((a, b) => b.v - a.v);
        head = ["Rank", "Customer", "Orders MT", "Total Value"];
        body = rows.map((r, i) => [i + 1, r.n, r.mt, inr(r.v)]);
        break;
      }
      case "ops-daily": {
        const byDay = new Map<string, { orders: number; mt: number; value: number; trips: number; rev: number; exp: number }>();
        active(orders).forEach((o) => {
          const r = byDay.get(o.date) ?? { orders: 0, mt: 0, value: 0, trips: 0, rev: 0, exp: 0 };
          r.orders += 1; r.mt += o.qty; r.value += o.qty * o.rate;
          byDay.set(o.date, r);
        });
        active(trips).forEach((t) => {
          const r = byDay.get(t.date) ?? { orders: 0, mt: 0, value: 0, trips: 0, rev: 0, exp: 0 };
          r.trips += 1; r.rev += t.revenue; r.exp += t.expense;
          byDay.set(t.date, r);
        });
        const rows = Array.from(byDay.entries()).sort((a, b) => b[0].localeCompare(a[0]));
        head = ["Date", "Orders", "Total MT", "Order Value", "Trips", "Freight Rev", "Trip Exp", "Net"];
        body = rows.map(([d, r]) => [d, r.orders, r.mt, inr(r.value), r.trips, inr(r.rev), inr(r.exp), inr(r.rev - r.exp)]);
        totals = [
          { label: "Days", value: String(rows.length) },
          { label: "Total order value", value: inr(rows.reduce((a, [, r]) => a + r.value, 0)) },
          { label: "Net freight P&L", value: inr(rows.reduce((a, [, r]) => a + (r.rev - r.exp), 0)) },
        ];
        break;
      }
      case "exp-summary": {
        const byCat = new Map<string, { count: number; amount: number }>();
        active(expenses).forEach((e) => {
          const r = byCat.get(e.category) ?? { count: 0, amount: 0 };
          r.count += 1; r.amount += e.amount;
          byCat.set(e.category, r);
        });
        const rows = Array.from(byCat.entries()).sort((a, b) => b[1].amount - a[1].amount);
        head = ["Category", "Vouchers", "Amount"];
        body = rows.map(([c, r]) => [c, r.count, inr(r.amount)]);
        totals = [{ label: "Total expenses", value: inr(rows.reduce((a, [, r]) => a + r.amount, 0)) }];
        break;
      }
      case "exp-register":
        head = ["Voucher", "Date", "Category", "Paid To", "Vehicle/Driver", "Mode", "Amount"];
        body = active(expenses).map((e) => [e.no, e.date, e.category, e.paidTo, e.vehicle || e.driver || "—", e.mode, inr(e.amount)]);
        totals = [{ label: "Total", value: inr(active(expenses).reduce((a, e) => a + e.amount, 0)) }];
        break;
      case "drv-salary-reg": {
        const list = active(expenses).filter((e) => e.category === "Driver Salary");
        head = ["Voucher", "Date", "Driver", "Mode", "Amount", "Remark"];
        body = list.map((e) => [e.no, e.date, e.driver || e.paidTo, e.mode, inr(e.amount), e.remark || ""]);
        totals = [{ label: "Total salary paid", value: inr(list.reduce((a, e) => a + e.amount, 0)) }];
        break;
      }
      case "veh-maint": {
        const list = active(expenses).filter((e) => e.category === "Truck Repair" || e.category === "Truck Maintenance" || e.category === "Tyre");
        head = ["Voucher", "Date", "Vehicle", "Category", "Vendor", "Amount", "Remark"];
        body = list.map((e) => [e.no, e.date, e.vehicle || "—", e.category, e.paidTo, inr(e.amount), e.remark || ""]);
        totals = [{ label: "Total maintenance", value: inr(list.reduce((a, e) => a + e.amount, 0)) }];
        break;
      }
    }
    return { title, subtitle, head, body, totals };
  }

  const groups: { group: string; icon: typeof Users; items: { label: string; key: ReportKey }[] }[] = [
    { group: "Customers", icon: Users, items: [
      { label: "Outstanding", key: "cust-outstanding" },
      { label: "Sales Summary", key: "cust-sales" },
      { label: "Customer Ledger", key: "cust-ledger" },
      { label: "Dispatch Summary", key: "cust-dispatch" },
      { label: "Top Customers", key: "top-customers" },
    ]},
    { group: "Suppliers", icon: Factory, items: [
      { label: "Purchase Summary", key: "sup-purchase" },
      { label: "Supplier Ledger", key: "sup-ledger" },
      { label: "Payables Aging", key: "sup-payables" },
    ]},
    { group: "Vehicles", icon: Truck, items: [
      { label: "Truck Profitability", key: "veh-pl" },
      { label: "Document Expiry", key: "veh-expiry" },
      { label: "Fleet Master", key: "veh-mileage" },
      { label: "Vehicle Maintenance", key: "veh-maint" },
    ]},
    { group: "Drivers", icon: IdCard, items: [
      { label: "Trips per Driver", key: "drv-trips" },
      { label: "Driver Master", key: "drv-salary" },
      { label: "Driver Salary Register", key: "drv-salary-reg" },
    ]},
    { group: "Products", icon: Package, items: [
      { label: "Product-wise Sales", key: "prod-sales" },
      { label: "Rate / HSN List", key: "prod-rate" },
      { label: "HSN Summary", key: "hsn-summary" },
    ]},
    { group: "Trips", icon: RouteIcon, items: [
      { label: "Trip P&L", key: "trip-pl" },
      { label: "Route Profitability", key: "trip-route" },
      { label: "Customer-wise Freight", key: "trip-cust" },
    ]},
    { group: "Weighbridge", icon: Scale, items: [
      { label: "Loss Analysis", key: "wb-loss" },
      { label: "Customer vs Crusher Weight", key: "wb-compare" },
    ]},
    { group: "Finance", icon: FileText, items: [
      { label: "P&L", key: "fin-pl" },
      { label: "Balance Sheet", key: "fin-bs" },
      { label: "Trial Balance", key: "fin-tb" },
    ]},
    { group: "GST", icon: Receipt, items: [
      { label: "GSTR-1 Workbook", key: "gst-r1" },
      { label: "GSTR-3B Workbook", key: "gst-r3b" },
      { label: "E-Way Bill Register", key: "gst-eway" },
    ]},
    { group: "Performance", icon: TrendingUp, items: [
      { label: "Daily Snapshot", key: "perf-daily" },
      { label: "Daily Operations", key: "ops-daily" },
      { label: "Monthly P&L", key: "perf-monthly" },
      { label: "Outstanding Aging", key: "perf-aging" },
    ]},
    { group: "Expenses", icon: Wrench, items: [
      { label: "Expense Register", key: "exp-register" },
      { label: "Category Summary", key: "exp-summary" },
      { label: "Driver Salary Register", key: "drv-salary-reg" },
      { label: "Vehicle Maintenance", key: "veh-maint" },
    ]},
  ];

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Pick a date range, click any report to view, then download PDF or share via WhatsApp / Email."
      />
      <div className="flex flex-wrap items-center gap-3 px-6 pt-6">
        <DateRangeFilter value={range} onChange={setRange} />
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          {range.from || range.to ? `${range.from || "…"} → ${range.to || "…"}` : "All dates"} — applies to every report
        </span>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((r) => (
          <div key={r.group} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <r.icon className="h-4 w-4" />
              </div>
              <h2 className="font-display text-base font-semibold">{r.group}</h2>
            </div>
            <ul className="mt-4 space-y-2">
              {r.items.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-foreground">{item.label}</span>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setView(build(item.key, item.label))}>
                    <Eye className="mr-1 h-3.5 w-3.5" />View
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <ReportView open={!!view} onOpenChange={(v) => !v && setView(null)} report={view} />
    </div>
  );
}
