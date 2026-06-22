import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Factory, Truck, IdCard, Package, Receipt, Eye, FileDown, CalendarDays } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useErp, active } from "@/lib/store";
import { inr } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangeFilter, EMPTY_RANGE, inRange, type DateRange } from "@/components/date-range-filter";
import { generatePdf } from "@/lib/pdf";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Honey Enterprises ERP" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const customers = active(useErp((s) => s.customers));
  const suppliers = active(useErp((s) => s.suppliers));
  const drivers = active(useErp((s) => s.drivers));
  const vehicles = active(useErp((s) => s.vehicles));
  const allOrders = useErp((s) => s.orders);
  const allTrips = useErp((s) => s.trips);
  const allSales = useErp((s) => s.salesInvoices);
  const allPurchases = useErp((s) => s.purchaseInvoices);
  const allExpenses = useErp((s) => s.expenses);

  const [range, setRange] = useState<DateRange>(EMPTY_RANGE);
  const [reportType, setReportType] = useState<"customer" | "supplier" | "driver" | "vehicle" | "expense">("customer");
  const [selectedEntity, setSelectedEntity] = useState<string>("");

  const orders = useMemo(() => allOrders.filter((o) => inRange(o.date, range)), [allOrders, range]);
  const trips = useMemo(() => allTrips.filter((t) => inRange(t.date, range)), [allTrips, range]);
  const sales = useMemo(() => allSales.filter((i) => inRange(i.date, range)), [allSales, range]);
  const purchases = useMemo(() => allPurchases.filter((i) => inRange(i.date, range)), [allPurchases, range]);
  const expenses = useMemo(() => allExpenses.filter((e) => inRange(e.date, range)), [allExpenses, range]);

  let tableData: { head: string[]; body: (string | number)[][]; title: string; subtitle: string } = {
    head: [],
    body: [],
    title: "",
    subtitle: "",
  };

  if (reportType === "customer" && selectedEntity) {
    const customer = customers.find((c) => c.name === selectedEntity);
    if (customer) {
      const custOrders = active(orders).filter((o) => o.customer === selectedEntity);
      const custSales = active(sales).filter((i) => i.party === selectedEntity);
      tableData = {
        title: `Customer Register: ${selectedEntity}`,
        subtitle: `${customer.code} • ${customer.city || "—"} • GST: ${customer.gst}`,
        head: ["Doc No", "Date", "Type", "Qty", "Amount", "Status"],
        body: [
          ...custOrders.map((o) => [o.no, o.date, "Order", `${o.qty} MT`, inr(o.qty * o.rate), o.status]),
          ...custSales.map((i) => [i.no, i.date, "Invoice", "—", inr(i.amount), i.status]),
        ],
      };
    }
  } else if (reportType === "supplier" && selectedEntity) {
    const supplier = suppliers.find((s) => s.name === selectedEntity);
    if (supplier) {
      const supPurchases = active(purchases).filter((i) => i.party === selectedEntity);
      tableData = {
        title: `Supplier Register: ${selectedEntity}`,
        subtitle: `${supplier.code} • ${supplier.city || "—"} • GST: ${supplier.gst}`,
        head: ["Bill No", "Date", "Amount", "Status"],
        body: supPurchases.map((i) => [i.no, i.date, inr(i.amount), i.status]),
      };
    }
  } else if (reportType === "driver" && selectedEntity) {
    const driver = drivers.find((d) => d.name === selectedEntity);
    if (driver) {
      const driverTrips = active(trips).filter((t) => t.driver === selectedEntity);
      tableData = {
        title: `Driver Register: ${selectedEntity}`,
        subtitle: `Mobile: ${driver.mobile} • License: ${driver.license}`,
        head: ["Trip No", "Date", "Route", "MT", "Vehicle", "Revenue", "Status"],
        body: driverTrips.map((t) => [t.tripNo, t.date, `${t.source} → ${t.destination}`, t.weight, t.vehicle, inr(t.revenue), t.status ?? "Done"]),
      };
    }
  } else if (reportType === "vehicle" && selectedEntity) {
    const vehicle = vehicles.find((v) => v.number === selectedEntity);
    if (vehicle) {
      const vehicleTrips = active(trips).filter((t) => t.vehicle === selectedEntity);
      tableData = {
        title: `Vehicle Register: ${selectedEntity}`,
        subtitle: `Capacity: ${vehicle.capacity} MT • Ownership: ${vehicle.ownership}`,
        head: ["Trip No", "Date", "Route", "MT", "Driver", "Revenue", "Profit"],
        body: vehicleTrips.map((t) => [t.tripNo, t.date, `${t.source} → ${t.destination}`, t.weight, t.driver, inr(t.revenue), inr(t.revenue - t.expense)]),
      };
    }
  } else if (reportType === "expense" && selectedEntity) {
    const catExpenses = active(expenses).filter((e) => e.category === selectedEntity);
    tableData = {
      title: `Expense Register: ${selectedEntity}`,
      subtitle: `All expenses for category`,
      head: ["Voucher", "Date", "Paid To", "Mode", "Amount"],
      body: catExpenses.map((e) => [e.no, e.date, e.paidTo, e.mode, inr(e.amount)]),
    };
  }

  function exportReport() {
    if (!selectedEntity || !tableData.head.length) return;
    generatePdf({
      title: tableData.title,
      subtitle: tableData.subtitle,
      filename: `report-${reportType}-${Date.now()}.pdf`,
      head: tableData.head,
      body: tableData.body,
      totals: tableData.body.length > 0 ? [{ label: "Records", value: String(tableData.body.length) }] : [],
    });
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Direct registers: select date range and entity to view history."
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium">Report Type</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["customer", "supplier", "driver", "vehicle", "expense"] as const).map((type) => (
                  <Button
                    key={type}
                    variant={reportType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setReportType(type); setSelectedEntity(""); }}
                    className="capitalize"
                  >
                    {type === "customer" && <Users className="mr-1 h-3.5 w-3.5" />}
                    {type === "supplier" && <Factory className="mr-1 h-3.5 w-3.5" />}
                    {type === "driver" && <IdCard className="mr-1 h-3.5 w-3.5" />}
                    {type === "vehicle" && <Truck className="mr-1 h-3.5 w-3.5" />}
                    {type === "expense" && <Receipt className="mr-1 h-3.5 w-3.5" />}
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <label className="text-xs font-medium">Select {reportType === "expense" ? "Category" : reportType}</label>
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">-- Select --</option>
                {reportType === "customer" && customers.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                {reportType === "supplier" && suppliers.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
                {reportType === "driver" && drivers.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
                {reportType === "vehicle" && vehicles.map((v) => (
                  <option key={v.id} value={v.number}>{v.number}</option>
                ))}
                {reportType === "expense" && Array.from(new Set(expenses.map((e) => e.category))).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <DateRangeFilter value={range} onChange={setRange} />
          </div>
        </div>

        {selectedEntity && tableData.head.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <h2 className="font-display text-lg font-semibold">{tableData.title}</h2>
                <p className="text-xs text-muted-foreground">{tableData.subtitle}</p>
              </div>
              <Button onClick={exportReport} size="sm">
                <FileDown className="mr-1 h-3.5 w-3.5" />Export PDF
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableData.head.map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.body.map((row, idx) => (
                    <TableRow key={idx}>
                      {row.map((cell, cidx) => (
                        <TableCell key={cidx} className={cidx === tableData.head.length - 1 ? "font-medium" : ""}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : selectedEntity ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No records found for the selected {reportType} in this date range.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <Eye className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">Select a {reportType} above to view their register.</p>
          </div>
        )}
      </div>
    </div>
  );
}


