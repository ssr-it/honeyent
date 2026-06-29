import { query } from '../config/database.ts';
import { ApiError } from '../middleware/errorHandler.ts';
import { camelizeRow, camelizeRows } from '../utils/transform.ts';

// Helper function to generate next customer code
async function getNextCustomerCode(): Promise<string> {
    const result = await query(
        `SELECT code FROM customers WHERE code LIKE 'CUST%' ORDER BY id DESC LIMIT 1`
    );
    if (result.rows.length === 0) return 'CUST001';
    const lastCode = result.rows[0].code;
    const num = parseInt(lastCode.replace('CUST', ''), 10) + 1;
    return `CUST${String(num).padStart(3, '0')}`;
}

// Helper function to generate next supplier code
async function getNextSupplierCode(): Promise<string> {
    const result = await query(
        `SELECT code FROM suppliers WHERE code LIKE 'SUP%' ORDER BY id DESC LIMIT 1`
    );
    if (result.rows.length === 0) return 'SUP001';
    const lastCode = result.rows[0].code;
    const num = parseInt(lastCode.replace('SUP', ''), 10) + 1;
    return `SUP${String(num).padStart(3, '0')}`;
}

// Helper function to generate next product code
async function getNextProductCode(): Promise<string> {
    const result = await query(
        `SELECT code FROM products WHERE code LIKE 'PROD%' ORDER BY id DESC LIMIT 1`
    );
    if (result.rows.length === 0) return 'PROD001';
    const lastCode = result.rows[0].code;
    const num = parseInt(lastCode.replace('PROD', ''), 10) + 1;
    return `PROD${String(num).padStart(3, '0')}`;
}

// Helper function to generate next order number
async function getNextOrderNo(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await query(
        `SELECT order_no FROM orders WHERE order_no LIKE $1 ORDER BY id DESC LIMIT 1`,
        [`ORD-${year}-%`]
    );
    if (result.rows.length === 0) return `ORD-${year}-001`;
    const lastNo = result.rows[0].order_no;
    const num = parseInt(lastNo.split('-')[2], 10) + 1;
    return `ORD-${year}-${String(num).padStart(3, '0')}`;
}

// Helper function to generate next trip number
async function getNextTripNo(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await query(
        `SELECT trip_no FROM trips WHERE trip_no LIKE $1 ORDER BY id DESC LIMIT 1`,
        [`TRIP-${year}-%`]
    );
    if (result.rows.length === 0) return `TRIP-${year}-001`;
    const lastNo = result.rows[0].trip_no;
    const num = parseInt(lastNo.split('-')[2], 10) + 1;
    return `TRIP-${year}-${String(num).padStart(3, '0')}`;
}

// Helper function to generate next invoice number
async function getNextInvoiceNo(prefix: 'INV' | 'PUR'): Promise<string> {
    const year = new Date().getFullYear();
    const table = prefix === 'INV' ? 'sales_invoices' : 'purchase_invoices';
    const result = await query(
        `SELECT invoice_no FROM ${table} WHERE invoice_no LIKE $1 ORDER BY id DESC LIMIT 1`,
        [`${prefix}-${year}-%`]
    );
    if (result.rows.length === 0) return `${prefix}-${year}-001`;
    const lastNo = result.rows[0].invoice_no;
    const num = parseInt(lastNo.split('-')[2], 10) + 1;
    return `${prefix}-${year}-${String(num).padStart(3, '0')}`;
}

async function getNextChallanNo(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await query(
        `SELECT challan_no FROM delivery_challans WHERE challan_no LIKE $1 ORDER BY id DESC LIMIT 1`,
        [`DC-${year}-%`]
    );
    if (result.rows.length === 0) return `DC-${year}-001`;
    const lastNo = result.rows[0].challan_no;
    const num = parseInt(lastNo.split('-')[2], 10) + 1;
    return `DC-${year}-${String(num).padStart(3, '0')}`;
}

async function getNextWeighSlipNo(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await query(
        `SELECT slip_no FROM weigh_slips WHERE slip_no LIKE $1 ORDER BY id DESC LIMIT 1`,
        [`WB-${year}-%`]
    );
    if (result.rows.length === 0) return `WB-${year}-001`;
    const lastNo = result.rows[0].slip_no;
    const num = parseInt(lastNo.split('-')[2], 10) + 1;
    return `WB-${year}-${String(num).padStart(3, '0')}`;
}

async function getNextDealNo(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await query(
        `SELECT deal_no FROM deals WHERE deal_no LIKE $1 ORDER BY id DESC LIMIT 1`,
        [`DEAL-${year}-%`]
    );
    if (result.rows.length === 0) return `DEAL-${year}-001`;
    const lastNo = result.rows[0].deal_no;
    const num = parseInt(lastNo.split('-')[2], 10) + 1;
    return `DEAL-${year}-${String(num).padStart(3, '0')}`;
}

export const customerQueries = {
    // Get all customers
    async getAll(limit = 50, offset = 0) {
        const result = await query(
            'SELECT * FROM customers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        return camelizeRows(result.rows);
    },

    // Get customer by ID
    async getById(id: string) {
        const result = await query('SELECT * FROM customers WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            throw new ApiError(404, 'Customer not found');
        }
        return camelizeRow(result.rows[0]);
    },

    // Get by code
    async getByCode(code: string) {
        const result = await query('SELECT * FROM customers WHERE code = $1', [code]);
        return result.rows.length ? camelizeRow(result.rows[0]) : null;
    },

    // Create customer
    async create(data: any) {
        const code = data.code || await getNextCustomerCode();
        const existing = await this.getByCode(code);
        if (existing) {
            throw new ApiError(400, 'Customer code already exists');
        }

        const result = await query(
            `INSERT INTO customers (
        code, name, gst, mobile, email, address, city, state,
        credit_limit, opening_balance, outstanding, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
            [
                code,
                data.name,
                data.gst || null,
                data.mobile,
                data.email || null,
                data.address || null,
                data.city,
                data.state || null,
                data.creditLimit || 0,
                data.openingBalance || 0,
                data.outstanding ?? data.openingBalance ?? 0,
                data.status || 'Active',
            ]
        );
        return camelizeRow(result.rows[0]);
    },

    // Update customer
    async update(id: string, data: any) {
        const customer = await this.getById(id);

        const result = await query(
            `UPDATE customers SET
        name = $1, mobile = $2, email = $3, address = $4,
        city = $5, state = $6, credit_limit = $7, status = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
            [
                data.name || customer.name,
                data.mobile || customer.mobile,
                data.email || customer.email,
                data.address || customer.address,
                data.city || customer.city,
                data.state || customer.state,
                data.creditLimit !== undefined ? data.creditLimit : customer.creditLimit,
                data.status || customer.status,
                id,
            ]
        );
        return camelizeRow(result.rows[0]);
    },

    // Delete customer
    async delete(id: string) {
        await this.getById(id);
        await query('DELETE FROM customers WHERE id = $1', [id]);
        return { success: true };
    },

    // Get count
    async getCount() {
        const result = await query('SELECT COUNT(*) FROM customers');
        return parseInt(result.rows[0].count, 10);
    },
};

export const supplierQueries = {
    async getAll(limit = 50, offset = 0) {
        const result = await query(
            'SELECT * FROM suppliers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        return camelizeRows(result.rows);
    },

    async getById(id: string) {
        const result = await query('SELECT * FROM suppliers WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            throw new ApiError(404, 'Supplier not found');
        }
        return camelizeRow(result.rows[0]);
    },

    async getByCode(code: string) {
        const result = await query('SELECT * FROM suppliers WHERE code = $1', [code]);
        return result.rows.length ? camelizeRow(result.rows[0]) : null;
    },

    async create(data: any) {
        const code = data.code || await getNextSupplierCode();
        const existing = await this.getByCode(code);
        if (existing) {
            throw new ApiError(400, 'Supplier code already exists');
        }

        const result = await query(
            `INSERT INTO suppliers (
        code, name, gst, mobile, email, address, city, state,
        bank_name, bank_account, bank_ifsc, opening_balance, outstanding, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
            [
                code,
                data.name,
                data.gst || null,
                data.mobile,
                data.email || null,
                data.address || null,
                data.city,
                data.state || null,
                data.bankName || null,
                data.bankAccount || null,
                data.bankIfsc || null,
                data.openingBalance || 0,
                data.outstanding || 0,
                data.status || 'Active',
            ]
        );
        return camelizeRow(result.rows[0]);
    },

    async update(id: string, data: any) {
        const supplier = await this.getById(id);

        const result = await query(
            `UPDATE suppliers SET
        name = $1, mobile = $2, email = $3, address = $4,
        city = $5, state = $6, bank_name = $7, bank_account = $8,
        bank_ifsc = $9, outstanding = $10, status = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *`,
            [
                data.name || supplier.name,
                data.mobile || supplier.mobile,
                data.email || supplier.email,
                data.address || supplier.address,
                data.city || supplier.city,
                data.state || supplier.state,
                data.bankName || supplier.bankName,
                data.bankAccount || supplier.bankAccount,
                data.bankIfsc || supplier.bankIfsc,
                data.outstanding !== undefined ? data.outstanding : supplier.outstanding,
                data.status || supplier.status,
                id,
            ]
        );
        return camelizeRow(result.rows[0]);
    },

    async delete(id: string) {
        await this.getById(id);
        await query('DELETE FROM suppliers WHERE id = $1', [id]);
        return { success: true };
    },
};

async function resolveCustomerId(value: string | number | undefined): Promise<number | null> {
    if (!value) return null;
    if (typeof value === 'number') return value;
    const s = String(value).trim();
    if (/^\d+$/.test(s)) return Number(s);
    const result = await query('SELECT id FROM customers WHERE code = $1 OR name = $1 LIMIT 1', [value]);
    return result.rows.length ? result.rows[0].id : null;
}

async function resolveSupplierId(value: string | number | undefined): Promise<number | null> {
    if (!value) return null;
    if (typeof value === 'number') return value;
    const s = String(value).trim();
    if (/^\d+$/.test(s)) return Number(s);
    const result = await query('SELECT id FROM suppliers WHERE code = $1 OR name = $1 LIMIT 1', [value]);
    return result.rows.length ? result.rows[0].id : null;
}

async function resolveProductId(value: string | number | undefined): Promise<number | null> {
    if (!value) return null;
    if (typeof value === 'number') return value;
    const s = String(value).trim();
    if (/^\d+$/.test(s)) return Number(s);
    const result = await query('SELECT id FROM products WHERE code = $1 OR name = $1 LIMIT 1', [value]);
    return result.rows.length ? result.rows[0].id : null;
}

async function resolveHsnId(value: string | number | undefined): Promise<number | null> {
    if (!value) return null;
    if (typeof value === 'number') return value;
    const search = String(value).trim();
    if (!search) return null;

    const result = await query(
        'SELECT id FROM hsn_catalog WHERE hsn_code = $1 OR id::text = $1 LIMIT 1',
        [search],
    );
    return result.rows.length ? result.rows[0].id : null;
}

async function resolveVehicleId(value: string | number | undefined): Promise<number | null> {
    if (!value) return null;
    if (typeof value === 'number') return value;
    const s = String(value).trim();
    if (/^\d+$/.test(s)) return Number(s);
    const result = await query('SELECT id FROM vehicles WHERE number = $1 LIMIT 1', [value]);
    return result.rows.length ? result.rows[0].id : null;
}

async function resolveDriverId(value: string | number | undefined): Promise<number | null> {
    if (!value) return null;
    if (typeof value === 'number') return value;
    const s = String(value).trim();
    if (/^\d+$/.test(s)) return Number(s);
    const result = await query('SELECT id FROM drivers WHERE name = $1 OR license_number = $1 LIMIT 1', [value]);
    return result.rows.length ? result.rows[0].id : null;
}

export const productQueries = {
    async getAll() {
        const result = await query(
            `SELECT p.id,
                    p.code,
                    p.name,
                    p.hsn_id AS hsn_id,
                    COALESCE(h.hsn_code, '') AS hsn,
                    p.unit,
                    p.gst_rate AS gst,
                    p.default_rate AS rate,
                    p.category,
                    p.status,
                    p.created_at,
                    p.updated_at
       FROM products p
       LEFT JOIN hsn_catalog h ON p.hsn_id = h.id
       ORDER BY p.created_at DESC`
        );
        return camelizeRows(result.rows);
    },

    async getById(id: string) {
        const result = await query(
            `SELECT p.id,
                    p.code,
                    p.name,
                    p.hsn_id AS hsn_id,
                    COALESCE(h.hsn_code, '') AS hsn,
                    p.unit,
                    p.gst_rate AS gst,
                    p.default_rate AS rate,
                    p.category,
                    p.status,
                    p.created_at,
                    p.updated_at
       FROM products p
       LEFT JOIN hsn_catalog h ON p.hsn_id = h.id
       WHERE p.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            throw new ApiError(404, 'Product not found');
        }
        return camelizeRow(result.rows[0]);
    },

    async create(data: any) {
        const code = data.code || await getNextProductCode();
        const hsnId = await resolveHsnId(data.hsn || data.hsnId);
        const result = await query(
            `INSERT INTO products (
        code, name, hsn_id, unit, gst_rate, default_rate, category, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
            [
                code,
                data.name,
                hsnId,
                data.unit || 'MT',
                data.gstRate || 5,
                data.defaultRate || 0,
                data.category || null,
                'Active',
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async update(id: string, data: any) {
        const product = await this.getById(id);
        const hsnId = data.hsn !== undefined || data.hsnId !== undefined
            ? await resolveHsnId(data.hsn || data.hsnId)
            : product.hsnId;
        const result = await query(
            `UPDATE products SET
        code = $1,
        name = $2,
        hsn_id = $3,
        unit = $4,
        gst_rate = $5,
        default_rate = $6,
        category = $7,
        status = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
            [
                data.code || product.code,
                data.name || product.name,
                hsnId,
                data.unit || product.unit,
                data.gst !== undefined ? data.gst : product.gst,
                data.rate !== undefined ? data.rate : product.rate,
                data.category ?? product.category,
                data.status || product.status,
                id,
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async delete(id: string) {
        await this.getById(id);
        await query('DELETE FROM products WHERE id = $1', [id]);
        return { success: true };
    },
};

export const vehicleQueries = {
    async getAll() {
        const result = await query('SELECT * FROM vehicles ORDER BY created_at DESC');
        const rows = camelizeRows(result.rows);
        return rows.map((row) => ({
            ...row,
            capacity: row.capacityTonnes,
        }));
    },

    async getById(id: string) {
        const result = await query('SELECT * FROM vehicles WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            throw new ApiError(404, 'Vehicle not found');
        }
        const row = camelizeRow(result.rows[0]);
        return { ...row, capacity: row.capacityTonnes };
    },

    async create(data: any) {
        const result = await query(
            `INSERT INTO vehicles (
        number, vehicle_type, ownership, capacity_tonnes,
        rc_expiry, insurance_expiry, fitness_expiry, permit_expiry, puc_expiry, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
            [
                data.number,
                data.vehicleType || null,
                data.ownership || 'Own',
                data.capacity || data.capacityTonnes,
                data.rcExpiry || null,
                data.insuranceExpiry || null,
                data.fitnessExpiry || null,
                data.permitExpiry || null,
                data.pucExpiry || null,
                'Active',
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async update(id: string, data: any) {
        const vehicle = await this.getById(id);
        const result = await query(
            `UPDATE vehicles SET
        number = $1,
        vehicle_type = $2,
        ownership = $3,
        capacity_tonnes = $4,
        rc_expiry = $5,
        insurance_expiry = $6,
        fitness_expiry = $7,
        permit_expiry = $8,
        puc_expiry = $9,
        status = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
            [
                data.number || vehicle.number,
                data.vehicleType ?? vehicle.vehicleType,
                data.ownership || vehicle.ownership,
                data.capacity !== undefined ? data.capacity : vehicle.capacity,
                data.rcExpiry || vehicle.rcExpiry,
                data.insuranceExpiry || vehicle.insuranceExpiry,
                data.fitnessExpiry || vehicle.fitnessExpiry,
                data.permitExpiry || vehicle.permitExpiry,
                data.pucExpiry || vehicle.pucExpiry,
                data.status || vehicle.status,
                id,
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async delete(id: string) {
        await this.getById(id);
        await query('DELETE FROM vehicles WHERE id = $1', [id]);
        return { success: true };
    },
};

export const driverQueries = {
    async getAll() {
        const result = await query('SELECT * FROM drivers ORDER BY created_at DESC');
        return camelizeRows(result.rows);
    },

    async getById(id: string) {
        const result = await query('SELECT * FROM drivers WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            throw new ApiError(404, 'Driver not found');
        }
        return camelizeRow(result.rows[0]);
    },

    async create(data: any) {
        const result = await query(
            `INSERT INTO drivers (
        name, mobile, email, address,
        license_number, license_expiry, joining_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
            [
                data.name,
                data.mobile,
                data.email || null,
                data.address || null,
                data.licenseNumber || null,
                data.licenseExpiry || null,
                data.joiningDate || new Date().toISOString().split('T')[0],
                'Active',
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async update(id: string, data: any) {
        const driver = await this.getById(id);
        const result = await query(
            `UPDATE drivers SET
        name = $1,
        mobile = $2,
        email = $3,
        address = $4,
        license_number = $5,
        license_expiry = $6,
        joining_date = $7,
        status = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
            [
                data.name || driver.name,
                data.mobile || driver.mobile,
                data.email || driver.email,
                data.address || driver.address,
                data.licenseNumber || driver.licenseNumber,
                data.licenseExpiry || driver.licenseExpiry,
                data.joiningDate || driver.joiningDate,
                data.status || driver.status,
                id,
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async delete(id: string) {
        await this.getById(id);
        await query('DELETE FROM drivers WHERE id = $1', [id]);
        return { success: true };
    },
};

export const orderQueries = {
    async getAll(customerId?: string) {
        const params: any[] = [];
        let sql = `SELECT
        o.id,
        o.order_no AS no,
        o.order_date AS date,
        o.qty,
        o.rate,
        o.freight,
        o.payment_terms AS payment_terms,
        o.expected_delivery AS expected_delivery,
        o.remarks,
        o.status,
        o.dispatch_no AS dispatch_no,
        o.deal_id AS deal_id,
        o.customer_id AS customer_id,
        o.product_id AS product_id,
        o.vehicle_id AS vehicle_id,
        o.driver_id AS driver_id,
        c.name AS customer,
        p.name AS product,
        v.number AS vehicle,
        d.name AS driver
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN vehicles v ON o.vehicle_id = v.id
      LEFT JOIN drivers d ON o.driver_id = d.id`;

        if (customerId) {
            sql += ' WHERE o.customer_id = $1';
            params.push(customerId);
        }

        sql += ' ORDER BY o.order_date DESC';
        const result = await query(sql, params);
        return camelizeRows(result.rows);
    },

    async getById(id: string) {
        const result = await query(
            `SELECT
        o.id,
        o.order_no AS no,
        o.order_date AS date,
        o.qty,
        o.rate,
        o.freight,
        o.payment_terms AS payment_terms,
        o.expected_delivery AS expected_delivery,
        o.remarks,
        o.status,
        o.dispatch_no AS dispatch_no,
        o.deal_id AS deal_id,
        o.customer_id AS customer_id,
        o.product_id AS product_id,
        o.vehicle_id AS vehicle_id,
        o.driver_id AS driver_id,
        c.name AS customer,
        p.name AS product,
        v.number AS vehicle,
        d.name AS driver
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN vehicles v ON o.vehicle_id = v.id
      LEFT JOIN drivers d ON o.driver_id = d.id
      WHERE o.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            throw new ApiError(404, 'Order not found');
        }
        return camelizeRow(result.rows[0]);
    },

    async create(data: any) {
        const orderNo = await getNextOrderNo();
        const customerId = await resolveCustomerId(data.customer || data.customerId);
        const supplierId = await resolveSupplierId(data.supplier || data.supplierId);
        const productId = await resolveProductId(data.product || data.productId);
        const vehicleId = await resolveVehicleId(data.vehicle || data.vehicleId);
        const driverId = await resolveDriverId(data.driver || data.driverId);

        if (!customerId) {
            throw new ApiError(400, `Customer not found: ${data.customer || data.customerId}`);
        }
        if (!productId) {
            throw new ApiError(400, `Product not found: ${data.product || data.productId}`);
        }

        const result = await query(
            `INSERT INTO orders (
        order_no, order_date, customer_id, supplier_id,
        product_id, qty, rate, vehicle_id, driver_id,
        ship_to_address_id, freight, payment_terms, expected_delivery,
        remarks, status, dispatch_no, deal_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
            [
                orderNo,
                data.orderDate || data.date || null,
                customerId,
                supplierId,
                productId,
                data.qty,
                data.rate,
                vehicleId,
                driverId,
                data.shipToAddressId || null,
                data.freight || 0,
                data.paymentTerms || null,
                data.expectedDelivery || null,
                data.remarks || null,
                data.status || 'Pending',
                data.dispatchNo || null,
                data.dealId || null,
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async update(id: string, data: any) {
        const order = await this.getById(id);
        const customerId = await resolveCustomerId(data.customer || data.customerId || order.customer);
        const productId = await resolveProductId(data.product || data.productId || order.product);
        const vehicleId = await resolveVehicleId(data.vehicle || data.vehicleId || order.vehicle);
        const driverId = await resolveDriverId(data.driver || data.driverId || order.driver);

        const result = await query(
            `UPDATE orders SET
        order_no = $1,
        order_date = $2,
        customer_id = $3,
        supplier_id = $4,
        product_id = $5,
        qty = $6,
        rate = $7,
        vehicle_id = $8,
        driver_id = $9,
        ship_to_address_id = $10,
        freight = $11,
        payment_terms = $12,
        expected_delivery = $13,
        remarks = $14,
        status = $15,
        dispatch_no = $16,
        deal_id = $17,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
      RETURNING *`,
            [
                data.no || order.no,
                data.date || order.date,
                customerId,
                data.supplierId || order.supplierId || null,
                productId,
                data.qty !== undefined ? data.qty : order.qty,
                data.rate !== undefined ? data.rate : order.rate,
                vehicleId,
                driverId,
                data.shipToAddressId || order.shipToAddressId || null,
                data.freight !== undefined ? data.freight : order.freight,
                data.paymentTerms || order.paymentTerms || null,
                data.expectedDelivery || order.expectedDelivery || null,
                data.remarks || order.remarks || null,
                data.status || order.status,
                data.dispatchNo || order.dispatchNo || null,
                data.dealId || order.dealId || null,
                id,
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async updateStatus(id: string, status: string) {
        const result = await query(
            'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );
        return this.getById(result.rows[0].id);
    },

    async delete(id: string) {
        await this.getById(id);
        await query('DELETE FROM orders WHERE id = $1', [id]);
        return { success: true };
    },
};

export const invoiceQueries = {
    async getSalesInvoices() {
        const result = await query(
            `SELECT i.id,
                    i.invoice_no AS no,
                    i.invoice_date AS date,
                    COALESCE(i.sub_total, 0) AS sub_total,
                    COALESCE(i.cgst_amount, 0) AS cgst_amount,
                    COALESCE(i.sgst_amount, 0) AS sgst_amount,
                    COALESCE(i.igst_amount, 0) AS igst_amount,
                    i.total_amount AS amount,
                    i.payment_status AS payment_status,
                    i.status,
                    i.deal_id AS deal_id,
                    c.name AS party
       FROM sales_invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       ORDER BY i.invoice_date DESC`
        );
        return camelizeRows(result.rows).map((row) => ({
            ...row,
            gst: Number(row.cgstAmount || 0) + Number(row.sgstAmount || 0) + Number(row.igstAmount || 0),
        }));
    },

    async getPurchaseInvoices() {
        const result = await query(
            `SELECT i.id,
                    i.invoice_no AS no,
                    i.invoice_date AS date,
                    COALESCE(i.sub_total, 0) AS sub_total,
                    COALESCE(i.gst_amount, 0) AS gst_amount,
                    i.total_amount AS amount,
                    i.payment_status AS payment_status,
                    i.status,
                    i.deal_id AS deal_id,
                    s.name AS party
       FROM purchase_invoices i
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       ORDER BY i.invoice_date DESC`
        );
        return camelizeRows(result.rows).map((row) => ({
            ...row,
            gst: Number(row.gstAmount || 0),
        }));
    },

    async createSalesInvoice(data: any) {
        const invoiceNo = data.invoiceNo || await getNextInvoiceNo('INV');
        const customerId = await resolveCustomerId(data.customer || data.customerId || data.party);

        const result = await query(
            `INSERT INTO sales_invoices (
        invoice_no, invoice_date, customer_id, order_id,
        deal_id, sub_total, cgst_amount, sgst_amount, igst_amount, total_amount,
        payment_status, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
            [
                invoiceNo,
                data.invoiceDate,
                customerId,
                data.orderId || null,
                data.dealId || null,
                data.subTotal,
                data.cgstAmount || 0,
                data.sgstAmount || 0,
                data.igstAmount || 0,
                data.totalAmount,
                'Unpaid',
                'Draft',
            ]
        );
        return this.getSalesInvoices().then((items) => items.find((inv) => inv.id === result.rows[0].id));
    },

    async createPurchaseInvoice(data: any) {
        const invoiceNo = data.invoiceNo || await getNextInvoiceNo('PUR');
        const supplierId = await resolveSupplierId(data.supplier || data.supplierId || data.party);

        const result = await query(
            `INSERT INTO purchase_invoices (
        invoice_no, invoice_date, supplier_id, order_id,
        deal_id, sub_total, gst_amount, total_amount, payment_status, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
            [
                invoiceNo,
                data.invoiceDate,
                supplierId,
                data.orderId || null,
                data.dealId || null,
                data.subTotal,
                data.gstAmount || 0,
                data.totalAmount,
                'Unpaid',
                'Draft',
            ]
        );
        return this.getPurchaseInvoices().then((items) => items.find((inv) => inv.id === result.rows[0].id));
    },

    async updateSalesInvoice(id: string, data: any) {
        const invoices = await this.getSalesInvoices();
        const invoice = invoices.find((item) => item.id === id);
        if (!invoice) throw new ApiError(404, 'Sales invoice not found');
        const customerId = await resolveCustomerId(data.customer || data.customerId || data.party || invoice.party);
        const result = await query(
            `UPDATE sales_invoices SET
        invoice_no = $1,
        invoice_date = $2,
        customer_id = $3,
        order_id = $4,
        deal_id = $5,
        sub_total = $6,
        cgst_amount = $7,
        sgst_amount = $8,
        igst_amount = $9,
        total_amount = $10,
        payment_status = $11,
        status = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *`,
            [
                data.invoiceNo || invoice.no,
                data.invoiceDate || invoice.date,
                customerId,
                data.orderId || invoice.orderId || null,
                data.dealId || invoice.dealId || null,
                data.subTotal !== undefined ? data.subTotal : invoice.subTotal,
                data.cgstAmount !== undefined ? data.cgstAmount : invoice.cgstAmount,
                data.sgstAmount !== undefined ? data.sgstAmount : invoice.sgstAmount,
                data.igstAmount !== undefined ? data.igstAmount : invoice.igstAmount,
                data.totalAmount !== undefined ? data.totalAmount : invoice.amount,
                data.paymentStatus || invoice.paymentStatus,
                data.status || invoice.status,
                id,
            ]
        );
        return this.getSalesInvoices().then((items) => items.find((inv) => inv.id === id));
    },

    async updatePurchaseInvoice(id: string, data: any) {
        const invoices = await this.getPurchaseInvoices();
        const invoice = invoices.find((item) => item.id === id);
        if (!invoice) throw new ApiError(404, 'Purchase invoice not found');
        const supplierId = await resolveSupplierId(data.supplier || data.supplierId || data.party || invoice.party);
        const result = await query(
            `UPDATE purchase_invoices SET
        invoice_no = $1,
        invoice_date = $2,
        supplier_id = $3,
        order_id = $4,
        deal_id = $5,
        sub_total = $6,
        gst_amount = $7,
        total_amount = $8,
        payment_status = $9,
        status = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
            [
                data.invoiceNo || invoice.no,
                data.invoiceDate || invoice.date,
                supplierId,
                data.orderId || invoice.orderId || null,
                data.dealId || invoice.dealId || null,
                data.subTotal !== undefined ? data.subTotal : invoice.subTotal,
                data.gstAmount !== undefined ? data.gstAmount : invoice.gst,
                data.totalAmount !== undefined ? data.totalAmount : invoice.amount,
                data.paymentStatus || invoice.paymentStatus,
                data.status || invoice.status,
                id,
            ]
        );
        return this.getPurchaseInvoices().then((items) => items.find((inv) => inv.id === id));
    },

    async deleteSalesInvoice(id: string) {
        const invoices = await this.getSalesInvoices();
        const invoice = invoices.find((item) => item.id === id);
        if (!invoice) throw new ApiError(404, 'Sales invoice not found');
        await query('DELETE FROM sales_invoices WHERE id = $1', [id]);
        return { success: true };
    },

    async deletePurchaseInvoice(id: string) {
        const invoices = await this.getPurchaseInvoices();
        const invoice = invoices.find((item) => item.id === id);
        if (!invoice) throw new ApiError(404, 'Purchase invoice not found');
        await query('DELETE FROM purchase_invoices WHERE id = $1', [id]);
        return { success: true };
    },
};

export const dealQueries = {
    async getAll() {
        const result = await query(
            `SELECT d.*, c.name AS customer, s.name AS supplier
       FROM deals d
       LEFT JOIN customers c ON d.customer_id = c.id
       LEFT JOIN suppliers s ON d.supplier_id = s.id
       ORDER BY d.deal_date DESC`
        );
        return camelizeRows(result.rows);
    },

    async getById(id: string) {
        const result = await query(
            `SELECT d.*, c.name AS customer, s.name AS supplier
       FROM deals d
       LEFT JOIN customers c ON d.customer_id = c.id
       LEFT JOIN suppliers s ON d.supplier_id = s.id
       WHERE d.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            throw new ApiError(404, 'Deal not found');
        }
        return camelizeRow(result.rows[0]);
    },

    async create(data: any) {
        const dealNo = data.dealNo || await getNextDealNo();
        const customerId = await resolveCustomerId(data.customer || data.customerId);
        const supplierId = await resolveSupplierId(data.supplier || data.supplierId);

        const result = await query(
            `INSERT INTO deals (
        deal_no, deal_date, customer_id, supplier_id,
        order_id, challan_id, weigh_slip_id, trip_id,
        sales_invoice_id, purchase_invoice_id,
        total_value, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
            [
                dealNo,
                data.dealDate || null,
                customerId,
                supplierId,
                data.orderId || null,
                data.challanId || null,
                data.weighSlipId || null,
                data.tripId || null,
                data.salesInvoiceId || null,
                data.purchaseInvoiceId || null,
                data.totalValue || null,
                data.status || 'Created',
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async update(id: string, data: any) {
        const deal = await this.getById(id);
        const customerId = await resolveCustomerId(data.customer || data.customerId || deal.customer);
        const supplierId = await resolveSupplierId(data.supplier || data.supplierId || deal.supplier);

        const result = await query(
            `UPDATE deals SET
        deal_no = $1,
        deal_date = $2,
        customer_id = $3,
        supplier_id = $4,
        order_id = $5,
        challan_id = $6,
        weigh_slip_id = $7,
        trip_id = $8,
        sales_invoice_id = $9,
        purchase_invoice_id = $10,
        total_value = $11,
        status = $12,
        cancelled = $13,
        cancel_remark = $14,
        cancelled_at = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *`,
            [
                data.dealNo || deal.dealNo,
                data.dealDate || deal.dealDate,
                customerId,
                supplierId,
                data.orderId || deal.orderId || null,
                data.challanId || deal.challanId || null,
                data.weighSlipId || deal.weighSlipId || null,
                data.tripId || deal.tripId || null,
                data.salesInvoiceId || deal.salesInvoiceId || null,
                data.purchaseInvoiceId || deal.purchaseInvoiceId || null,
                data.totalValue !== undefined ? data.totalValue : deal.totalValue,
                data.status || deal.status,
                data.cancelled !== undefined ? data.cancelled : deal.cancelled,
                data.cancelRemark || deal.cancelRemark || null,
                data.cancelledAt || deal.cancelledAt || null,
                id,
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async delete(id: string) {
        await this.getById(id);
        await query('DELETE FROM deals WHERE id = $1', [id]);
        return { success: true };
    },
};

export const weighSlipQueries = {
    async getAll() {
        const result = await query(
            `SELECT w.id,
                    w.slip_no AS slip_no,
                    w.slip_date AS slip_date,
                    w.vehicle_id AS vehicle_id,
                    w.product_id AS product_id,
                    w.gross_weight AS gross_weight,
                    w.tare_weight AS tare_weight,
                    w.net_weight AS net_weight,
                    w.customer_weight AS customer_weight,
                    w.loss_weight AS loss_weight,
                    w.deal_id AS deal_id,
                    w.status,
                    w.cancelled,
                    w.cancel_remark AS cancel_remark,
                    w.cancelled_at AS cancelled_at,
                    v.number AS vehicle,
                    p.name AS product
       FROM weigh_slips w
       LEFT JOIN vehicles v ON w.vehicle_id = v.id
       LEFT JOIN products p ON w.product_id = p.id
       ORDER BY w.slip_date DESC`
        );
        return camelizeRows(result.rows);
    },

    async getById(id: string) {
        const result = await query(
            `SELECT w.id,
                    w.slip_no AS slip_no,
                    w.slip_date AS slip_date,
                    w.vehicle_id AS vehicle_id,
                    w.product_id AS product_id,
                    w.gross_weight AS gross_weight,
                    w.tare_weight AS tare_weight,
                    w.net_weight AS net_weight,
                    w.customer_weight AS customer_weight,
                    w.loss_weight AS loss_weight,
                    w.deal_id AS deal_id,
                    w.status,
                    w.cancelled,
                    w.cancel_remark AS cancel_remark,
                    w.cancelled_at AS cancelled_at,
                    v.number AS vehicle,
                    p.name AS product
       FROM weigh_slips w
       LEFT JOIN vehicles v ON w.vehicle_id = v.id
       LEFT JOIN products p ON w.product_id = p.id
       WHERE w.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            throw new ApiError(404, 'Weigh slip not found');
        }
        return camelizeRow(result.rows[0]);
    },

    async create(data: any) {
        const slipNo = data.slipNo || await getNextWeighSlipNo();
        const vehicleId = await resolveVehicleId(data.vehicle || data.vehicleId);
        const productId = await resolveProductId(data.product || data.productId);

        const result = await query(
            `INSERT INTO weigh_slips (
        slip_no, slip_date, vehicle_id, product_id,
        gross_weight, tare_weight, net_weight,
        customer_weight, loss_weight, deal_id,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
            [
                slipNo,
                data.slipDate,
                vehicleId,
                productId,
                data.grossWeight,
                data.tareWeight,
                data.netWeight,
                data.customerWeight || null,
                data.lossWeight || null,
                data.dealId || null,
                data.status || 'Draft',
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async update(id: string, data: any) {
        const slip = await this.getById(id);
        const vehicleId = await resolveVehicleId(data.vehicle || data.vehicleId || slip.vehicle);
        const productId = await resolveProductId(data.product || data.productId || slip.product);

        const result = await query(
            `UPDATE weigh_slips SET
        slip_no = $1,
        slip_date = $2,
        vehicle_id = $3,
        product_id = $4,
        gross_weight = $5,
        tare_weight = $6,
        net_weight = $7,
        customer_weight = $8,
        loss_weight = $9,
        deal_id = $10,
        status = $11,
        cancelled = $12,
        cancel_remark = $13,
        cancelled_at = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *`,
            [
                data.slipNo || slip.slipNo,
                data.slipDate || slip.slipDate,
                vehicleId,
                productId,
                data.grossWeight !== undefined ? data.grossWeight : slip.grossWeight,
                data.tareWeight !== undefined ? data.tareWeight : slip.tareWeight,
                data.netWeight !== undefined ? data.netWeight : slip.netWeight,
                data.customerWeight !== undefined ? data.customerWeight : slip.customerWeight,
                data.lossWeight !== undefined ? data.lossWeight : slip.lossWeight,
                data.dealId || slip.dealId || null,
                data.status || slip.status,
                data.cancelled !== undefined ? data.cancelled : slip.cancelled,
                data.cancelRemark || slip.cancelRemark || null,
                data.cancelledAt || slip.cancelledAt || null,
                id,
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async delete(id: string) {
        await this.getById(id);
        await query('DELETE FROM weigh_slips WHERE id = $1', [id]);
        return { success: true };
    },
};

export const deliveryChallanQueries = {
    async getAll() {
        const result = await query(
            `SELECT d.id,
                    d.challan_no AS challan_no,
                    d.challan_date AS challan_date,
                    d.order_id AS order_id,
                    d.deal_id AS deal_id,
                    d.customer_id AS customer_id,
                    d.product_id AS product_id,
                    d.qty,
                    d.hsn_code AS hsn_code,
                    d.gst_rate AS gst_rate,
                    d.amount,
                    d.status,
                    d.cancelled,
                    d.cancel_remark AS cancel_remark,
                    d.cancelled_at AS cancelled_at,
                    c.name AS customer,
                    p.name AS product
       FROM delivery_challans d
       LEFT JOIN customers c ON d.customer_id = c.id
       LEFT JOIN products p ON d.product_id = p.id
       ORDER BY d.challan_date DESC`
        );
        return camelizeRows(result.rows);
    },

    async getById(id: string) {
        const result = await query(
            `SELECT d.id,
                    d.challan_no AS challan_no,
                    d.challan_date AS challan_date,
                    d.order_id AS order_id,
                    d.deal_id AS deal_id,
                    d.customer_id AS customer_id,
                    d.product_id AS product_id,
                    d.qty,
                    d.hsn_code AS hsn_code,
                    d.gst_rate AS gst_rate,
                    d.amount,
                    d.status,
                    d.cancelled,
                    d.cancel_remark AS cancel_remark,
                    d.cancelled_at AS cancelled_at,
                    c.name AS customer,
                    p.name AS product
       FROM delivery_challans d
       LEFT JOIN customers c ON d.customer_id = c.id
       LEFT JOIN products p ON d.product_id = p.id
       WHERE d.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            throw new ApiError(404, 'Delivery challan not found');
        }
        return camelizeRow(result.rows[0]);
    },

    async create(data: any) {
        const challanNo = data.challanNo || await getNextChallanNo();
        const customerId = await resolveCustomerId(data.customer || data.customerId);
        const productId = await resolveProductId(data.product || data.productId);

        const result = await query(
            `INSERT INTO delivery_challans (
        challan_no, challan_date, order_id, deal_id,
        customer_id, product_id, qty, hsn_code,
        gst_rate, amount, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
            [
                challanNo,
                data.challanDate,
                data.orderId || null,
                data.dealId || null,
                customerId,
                productId,
                data.qty,
                data.hsnCode || null,
                data.gstRate || null,
                data.amount || null,
                data.status || 'Draft',
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async update(id: string, data: any) {
        const challan = await this.getById(id);
        const customerId = await resolveCustomerId(data.customer || data.customerId || challan.customer);
        const productId = await resolveProductId(data.product || data.productId || challan.product);

        const result = await query(
            `UPDATE delivery_challans SET
        challan_no = $1,
        challan_date = $2,
        order_id = $3,
        deal_id = $4,
        customer_id = $5,
        product_id = $6,
        qty = $7,
        hsn_code = $8,
        gst_rate = $9,
        amount = $10,
        status = $11,
        cancelled = $12,
        cancel_remark = $13,
        cancelled_at = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *`,
            [
                data.challanNo || challan.challanNo,
                data.challanDate || challan.challanDate,
                data.orderId || challan.orderId || null,
                data.dealId || challan.dealId || null,
                customerId,
                productId,
                data.qty !== undefined ? data.qty : challan.qty,
                data.hsnCode || challan.hsnCode || null,
                data.gstRate !== undefined ? data.gstRate : challan.gstRate,
                data.amount !== undefined ? data.amount : challan.amount,
                data.status || challan.status,
                data.cancelled !== undefined ? data.cancelled : challan.cancelled,
                data.cancelRemark || challan.cancelRemark || null,
                data.cancelledAt || challan.cancelledAt || null,
                id,
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async delete(id: string) {
        await this.getById(id);
        await query('DELETE FROM delivery_challans WHERE id = $1', [id]);
        return { success: true };
    },
};

export const tripQueries = {
    async getAll() {
        const result = await query(
            `SELECT t.id,
                    t.trip_no AS trip_no,
                    t.trip_date AS trip_date,
                    t.source,
                    t.destination,
                    t.weight,
                    t.revenue,
                    t.trip_expenses AS trip_expenses,
                    t.net_profit AS net_profit,
                    t.status,
                    t.vehicle_id AS vehicle_id,
                    t.driver_id AS driver_id,
                    t.deal_id AS deal_id,
                    v.number AS vehicle,
                    d.name AS driver
       FROM trips t
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       ORDER BY t.trip_date DESC`
        );
        return camelizeRows(result.rows);
    },

    async getById(id: string) {
        const result = await query(
            `SELECT t.id,
                    t.trip_no AS trip_no,
                    t.trip_date AS trip_date,
                    t.source,
                    t.destination,
                    t.weight,
                    t.revenue,
                    t.trip_expenses AS trip_expenses,
                    t.net_profit AS net_profit,
                    t.status,
                    t.vehicle_id AS vehicle_id,
                    t.driver_id AS driver_id,
                    t.deal_id AS deal_id,
                    v.number AS vehicle,
                    d.name AS driver
       FROM trips t
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       WHERE t.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            throw new ApiError(404, 'Trip not found');
        }
        return camelizeRow(result.rows[0]);
    },

    async create(data: any) {
        const tripNo = data.tripNo || await getNextTripNo();
        const vehicleId = await resolveVehicleId(data.vehicle || data.vehicleId);
        const driverId = await resolveDriverId(data.driver || data.driverId);
        const netProfit = (data.revenue || 0) - (data.tripExpenses || 0);

        const result = await query(
            `INSERT INTO trips (
        trip_no, trip_date, vehicle_id, driver_id,
        source, destination, weight, revenue, trip_expenses,
        net_profit, deal_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
            [
                tripNo,
                data.date || data.tripDate || null,
                vehicleId,
                driverId,
                data.source,
                data.destination,
                data.weight,
                data.revenue,
                data.tripExpenses || 0,
                netProfit,
                data.dealId || null,
                data.status || 'Pending',
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async update(id: string, data: any) {
        const trip = await this.getById(id);
        const vehicleId = await resolveVehicleId(data.vehicle || data.vehicleId || trip.vehicle);
        const driverId = await resolveDriverId(data.driver || data.driverId || trip.driver);
        const netProfit = (data.revenue !== undefined ? data.revenue : trip.revenue) - (data.tripExpenses !== undefined ? data.tripExpenses : trip.tripExpenses || 0);

        const result = await query(
            `UPDATE trips SET
        trip_no = $1,
        trip_date = $2,
        vehicle_id = $3,
        driver_id = $4,
        source = $5,
        destination = $6,
        weight = $7,
        revenue = $8,
        trip_expenses = $9,
        net_profit = $10,
        deal_id = $11,
        status = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *`,
            [
                data.tripNo || trip.tripNo,
                data.date || trip.date,
                vehicleId,
                driverId,
                data.source || trip.source,
                data.destination || trip.destination,
                data.weight !== undefined ? data.weight : trip.weight,
                data.revenue !== undefined ? data.revenue : trip.revenue,
                data.tripExpenses !== undefined ? data.tripExpenses : trip.tripExpenses,
                netProfit,
                data.dealId || trip.dealId || null,
                data.status || trip.status,
                id,
            ]
        );
        return this.getById(result.rows[0].id);
    },

    async delete(id: string) {
        await this.getById(id);
        await query('DELETE FROM trips WHERE id = $1', [id]);
        return { success: true };
    },
};

export const hsnQueries = {
    async getAll() {
        const result = await query('SELECT * FROM hsn_catalog ORDER BY hsn_code ASC');
        return camelizeRows(result.rows);
    },

    async getById(id: string) {
        const result = await query('SELECT * FROM hsn_catalog WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            throw new ApiError(404, 'HSN code not found');
        }
        return camelizeRow(result.rows[0]);
    },

    async create(data: any) {
        const result = await query(
            `INSERT INTO hsn_catalog (hsn_code, description, gst_rate)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [data.code, data.description || null, data.gstRate || 0]
        );
        return camelizeRow(result.rows[0]);
    },

    async update(id: string, data: any) {
        const existing = await this.getById(id);
        const result = await query(
            `UPDATE hsn_catalog SET
                hsn_code = $1,
                description = $2,
                gst_rate = $3
             WHERE id = $4
             RETURNING *`,
            [
                data.code || existing.hsnCode,
                data.description !== undefined ? data.description : existing.description,
                data.gstRate !== undefined ? data.gstRate : existing.gstRate,
                id,
            ]
        );
        return camelizeRow(result.rows[0]);
    },

    async delete(id: string) {
        await this.getById(id);
        await query('DELETE FROM hsn_catalog WHERE id = $1', [id]);
        return { success: true };
    },
};
