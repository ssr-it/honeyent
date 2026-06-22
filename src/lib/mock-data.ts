// Utility types and helpers used across the frontend.
// Sample records have been removed so the app only relies on backend data.

export type OrderStatus =
  | "Pending"
  | "Approved"
  | "Loaded"
  | "In Transit"
  | "Delivered"
  | "Billed"
  | "Closed";

export interface Customer {
  id: number;
  code: string;
  name: string;
  gst: string;
  mobile: string;
  email?: string;
  address?: string;
  city: string;
  state?: string;
  creditLimit: number;
  openingBalance?: number;
  outstanding: number;
  status: "Active" | "Inactive";
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  gst: string;
  mobile: string;
  email?: string;
  address?: string;
  city: string;
  state?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  openingBalance?: number;
  outstanding: number;
  status: "Active" | "Inactive";
}

export interface Product {
  id: number;
  code: string;
  name: string;
  hsn?: string;
  unit?: string;
  gst?: number;
  rate?: number;
  category?: string;
}

export interface Vehicle {
  id: number;
  number: string;
  vehicleType?: string;
  ownership: "Own" | "Hired";
  capacity: number;
  rcExpiry?: string;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  permitExpiry?: string;
  pucExpiry?: string;
  status?: "Active" | "Inactive";
}

export interface Driver {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  license?: string;
  licenseExpiry?: string;
  joiningDate?: string;
  status?: "Active" | "Off Duty";
}

export interface Order {
  id: number;
  no: string;
  date: string;
  customer: string;
  supplier?: string;
  shipTo?: string;
  product: string;
  qty: number;
  rate: number;
  freight?: number;
  vehicle: string;
  driver: string;
  source?: string;
  destination?: string;
  paymentTerms?: string;
  remarks?: string;
  dispatchNo?: string;
  dealId?: string | number;
  status: OrderStatus;
}

export interface WeighSlip {
  id: number;
  slipNo: string;
  date: string;
  vehicle: string;
  product: string;
  gross: number;
  tare: number;
  net: number;
  customerWeight?: number;
  loss?: number;
  dealId?: string | number;
}

export interface Trip {
  id: number;
  tripNo: string;
  date: string;
  vehicle: string;
  driver: string;
  source: string;
  destination: string;
  weight: number;
  revenue: number;
  expense: number;
  dealId?: string | number;
  status?: OrderStatus;
}

export interface Invoice {
  id: number;
  no: string;
  date: string;
  party: string;
  amount: number;
  gst: number;
  status: "Paid" | "Unpaid" | "Partial";
  dealId?: string | number;
}

export interface DeliveryChallan {
  id: number;
  challanNo: string;
  date: string;
  customer: string;
  product: string;
  qty: number;
  amount?: number;
  status?: string;
  cancelled?: boolean;
  cancelRemark?: string;
  cancelledAt?: string;
  dealId?: string | number;
}

export const statusTone: Record<OrderStatus, string> = {
  Pending: "bg-muted text-muted-foreground",
  Approved: "bg-info/15 text-info",
  Loaded: "bg-warning/15 text-warning",
  "In Transit": "bg-primary/15 text-primary",
  Delivered: "bg-success/15 text-success",
  Billed: "bg-accent/15 text-accent-foreground",
  Closed: "bg-muted text-muted-foreground",
};

export function inr(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

// For PDF generation - returns number without currency symbol to avoid encoding issues
export function pdfNumber(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

export function daysUntil(dateStr: string): number {
  const d = new Date(dateStr).getTime();
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}
