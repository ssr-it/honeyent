const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        ...init,
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} ${body}`);
    }

    return response.json();
}

export const getCustomers = () => fetchJson<any[]>("/customers");
export const getSuppliers = () => fetchJson<any[]>("/suppliers");
export const getProducts = () => fetchJson<any[]>("/products");
export const getVehicles = () => fetchJson<any[]>("/vehicles");
export const getDrivers = () => fetchJson<any[]>("/drivers");
export const getOrders = () => fetchJson<any[]>("/orders");
export const getTrips = () => fetchJson<any[]>("/trips");
export const getSalesInvoices = () => fetchJson<any[]>("/invoices/sales");
export const getPurchaseInvoices = () => fetchJson<any[]>("/invoices/purchase");
export const getWeighSlips = () => fetchJson<any[]>("/weigh-slips");
export const getDeliveryChallans = () => fetchJson<any[]>("/delivery-challans");

export const createCustomer = (data: Record<string, unknown>) =>
    fetchJson<any>("/customers", { method: "POST", body: JSON.stringify(data) });
export const updateCustomer = (id: string | number, data: Record<string, unknown>) =>
    fetchJson<any>(`/customers/${String(id)}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteCustomer = (id: string | number) =>
    fetchJson<any>(`/customers/${String(id)}`, { method: "DELETE" });

export const createSupplier = (data: Record<string, unknown>) =>
    fetchJson<any>("/suppliers", { method: "POST", body: JSON.stringify(data) });
export const updateSupplier = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteSupplier = (id: string) =>
    fetchJson<any>(`/suppliers/${id}`, { method: "DELETE" });

export const createProduct = (data: Record<string, unknown>) =>
    fetchJson<any>("/products", { method: "POST", body: JSON.stringify(data) });
export const updateProduct = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProduct = (id: string) =>
    fetchJson<any>(`/products/${id}`, { method: "DELETE" });

export const createVehicle = (data: Record<string, unknown>) =>
    fetchJson<any>("/vehicles", { method: "POST", body: JSON.stringify(data) });
export const updateVehicle = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/vehicles/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteVehicle = (id: string) =>
    fetchJson<any>(`/vehicles/${id}`, { method: "DELETE" });

export const createDriver = (data: Record<string, unknown>) =>
    fetchJson<any>("/drivers", { method: "POST", body: JSON.stringify(data) });
export const updateDriver = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/drivers/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteDriver = (id: string) =>
    fetchJson<any>(`/drivers/${id}`, { method: "DELETE" });

export const createOrder = (data: Record<string, unknown>) =>
    fetchJson<any>("/orders", { method: "POST", body: JSON.stringify(data) });
export const updateOrder = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/orders/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteOrder = (id: string) =>
    fetchJson<any>(`/orders/${id}`, { method: "DELETE" });
export const updateOrderStatus = (id: string, status: string) =>
    fetchJson<any>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const createTrip = (data: Record<string, unknown>) =>
    fetchJson<any>("/trips", { method: "POST", body: JSON.stringify(data) });
export const updateTrip = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/trips/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTrip = (id: string) =>
    fetchJson<any>(`/trips/${id}`, { method: "DELETE" });

export const createWeighSlip = (data: Record<string, unknown>) =>
    fetchJson<any>("/weigh-slips", { method: "POST", body: JSON.stringify(data) });
export const createDeliveryChallan = (data: Record<string, unknown>) =>
    fetchJson<any>("/delivery-challans", { method: "POST", body: JSON.stringify(data) });
export const createDeal = (data: Record<string, unknown>) =>
    fetchJson<any>("/deals", { method: "POST", body: JSON.stringify(data) });
export const updateDeal = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/deals/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const createSalesInvoice = (data: Record<string, unknown>) =>
    fetchJson<any>("/invoices/sales", { method: "POST", body: JSON.stringify(data) });
export const updateSalesInvoice = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/invoices/sales/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteSalesInvoice = (id: string) =>
    fetchJson<any>(`/invoices/sales/${id}`, { method: "DELETE" });

export const createPurchaseInvoice = (data: Record<string, unknown>) =>
    fetchJson<any>("/invoices/purchase", { method: "POST", body: JSON.stringify(data) });
export const updatePurchaseInvoice = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/invoices/purchase/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deletePurchaseInvoice = (id: string) =>
    fetchJson<any>(`/invoices/purchase/${id}`, { method: "DELETE" });
