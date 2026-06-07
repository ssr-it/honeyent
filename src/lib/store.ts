import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  customers as seedCustomers,
  suppliers as seedSuppliers,
  products as seedProducts,
  vehicles as seedVehicles,
  drivers as seedDrivers,
  orders as seedOrders,
  weighSlips as seedSlips,
  trips as seedTrips,
  salesInvoices as seedSales,
  purchaseInvoices as seedPurchases,
  type Customer,
  type Supplier,
  type Product,
  type Vehicle,
  type Driver,
  type Order,
  type WeighSlip,
  type Trip,
  type Invoice,
} from "./mock-data";

export type DocStatus = "Active" | "Cancelled";

export interface Cancelable {
  cancelled?: boolean;
  cancelRemark?: string;
  cancelledAt?: string;
}

export type CCustomer = Customer & Cancelable;
export type CSupplier = Supplier & Cancelable;
export type CProduct = Product & Cancelable;
export type CVehicle = Vehicle & Cancelable;
export type CDriver = Driver & Cancelable;
export type COrder = Order & Cancelable;
export type CWeighSlip = WeighSlip & Cancelable;
export type CTrip = Trip & Cancelable;
export type CInvoice = Invoice & Cancelable;

export type EntityKey =
  | "customers"
  | "suppliers"
  | "products"
  | "vehicles"
  | "drivers"
  | "orders"
  | "weighSlips"
  | "trips"
  | "salesInvoices"
  | "purchaseInvoices"
  | "payments";

export interface Payment extends Cancelable {
  id: string;
  no: string;
  date: string;
  direction: "In" | "Out";
  party: string;
  mode: "Cash" | "Bank" | "UPI" | "Cheque";
  amount: number;
  reference?: string;
  note?: string;
}

interface State {
  customers: CCustomer[];
  suppliers: CSupplier[];
  products: CProduct[];
  vehicles: CVehicle[];
  drivers: CDriver[];
  orders: COrder[];
  weighSlips: CWeighSlip[];
  trips: CTrip[];
  salesInvoices: CInvoice[];
  purchaseInvoices: CInvoice[];
  payments: Payment[];
}

interface Actions {
  add: <K extends EntityKey>(key: K, item: State[K][number]) => void;
  update: <K extends EntityKey>(key: K, id: string, patch: Partial<State[K][number]>) => void;
  cancel: (key: EntityKey, id: string, remark: string) => void;
  remove: (key: EntityKey, id: string) => void;
  resetAll: () => void;
}

const initial: State = {
  customers: seedCustomers,
  suppliers: seedSuppliers,
  products: seedProducts,
  vehicles: seedVehicles,
  drivers: seedDrivers,
  orders: seedOrders,
  weighSlips: seedSlips,
  trips: seedTrips,
  salesInvoices: seedSales,
  purchaseInvoices: seedPurchases,
  payments: [],
};

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useErp = create<State & Actions>()(
  persist(
    (set) => ({
      ...initial,
      add: (key, item) =>
        set((s) => ({ [key]: [item, ...((s as unknown as Record<EntityKey, unknown[]>)[key])] } as unknown as Partial<State>)),
      update: (key, id, patch) =>
        set((s) => ({
          [key]: ((s as unknown as Record<EntityKey, Array<{ id: string }>>)[key]).map((it) =>
            it.id === id ? { ...it, ...patch } : it,
          ),
        } as unknown as Partial<State>)),
      cancel: (key, id, remark) =>
        set((s) => ({
          [key]: ((s as unknown as Record<EntityKey, Array<{ id: string } & Cancelable>>)[key]).map((it) =>
            it.id === id
              ? { ...it, cancelled: true, cancelRemark: remark, cancelledAt: new Date().toISOString() }
              : it,
          ),
        } as unknown as Partial<State>)),
      remove: (key, id) =>
        set((s) => ({
          [key]: ((s as unknown as Record<EntityKey, Array<{ id: string }>>)[key]).filter((it) => it.id !== id),
        } as unknown as Partial<State>)),
      resetAll: () => set(initial),
    }),
    {
      name: "honey-erp-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : (noopStorage as unknown as Storage),
      ),
      version: 1,
    },
  ),
);

export function newId(prefix = "x"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Active (non-cancelled) records — used by every report. */
export function active<T extends Cancelable>(items: T[]): T[] {
  return items.filter((i) => !i.cancelled);
}
