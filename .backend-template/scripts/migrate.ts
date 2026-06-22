import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || process.env.DATABASE_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || process.env.DATABASE_NAME || 'honeyent_db',
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Starting database migration...');
    await client.query('BEGIN');

    // Ensure old tables (from previous failed runs) are removed so schema can be recreated cleanly
    await client.query(`
          DROP TABLE IF EXISTS deals CASCADE;
          DROP TABLE IF EXISTS purchase_invoices CASCADE;
          DROP TABLE IF EXISTS sales_invoices CASCADE;
          DROP TABLE IF EXISTS trip_expenses CASCADE;
          DROP TABLE IF EXISTS trips CASCADE;
          DROP TABLE IF EXISTS weigh_slips CASCADE;
          DROP TABLE IF EXISTS delivery_challans CASCADE;
          DROP TABLE IF EXISTS orders CASCADE;
          DROP TABLE IF EXISTS expense_heads CASCADE;
          DROP TABLE IF EXISTS shipping_addresses CASCADE;
          DROP TABLE IF EXISTS products CASCADE;
          DROP TABLE IF EXISTS hsn_catalog CASCADE;
          DROP TABLE IF EXISTS vehicles CASCADE;
          DROP TABLE IF EXISTS drivers CASCADE;
          DROP TABLE IF EXISTS suppliers CASCADE;
          DROP TABLE IF EXISTS customers CASCADE;
          DROP TABLE IF EXISTS company_profile CASCADE;
        `);

    const fs = await import('fs');
    const path = await import('path');
    const sqlPath = path.resolve(process.cwd(), 'scripts', 'schema_bigint.sql');
    const schemaSql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(schemaSql);

    await client.query(`
      TRUNCATE TABLE deals, purchase_invoices, sales_invoices, trip_expenses, trips, weigh_slips, delivery_challans, orders, expense_heads, shipping_addresses, products, hsn_catalog, vehicles, drivers, suppliers, customers, company_profile CASCADE;
    `);

    console.log('Inserting company_profile...');
    await client.query(`
      INSERT INTO company_profile (name, gst, address, city, state, phone, email, logo_text, owner_name, owner_phone, owner_email)
      VALUES (
        'Honey Enterprises',
        '06AAHCV1234L1Z9',
        'Plot 12, Industrial Area, Sohna Road',
        'Gurugram',
        'Haryana',
        '0124-4001234',
        'info@honeyent.com',
        'HoneyEnt',
        'Suresh Khanna',
        '9911122233',
        'suresh@honeyent.com'
      );
    `);

    console.log('Inserting customers...');
    await client.query(`
      INSERT INTO customers (code, name, gst, mobile, email, address, city, state, credit_limit, opening_balance, outstanding, status)
      VALUES
        ('CUST001', 'Honey Enterprises Site A', '06AAHCV1234L1Z9', '9812345670', 'sitea@honeyent.com', 'Sector 12, Gurugram', 'Gurugram', 'Haryana', 1200000, 200000, 200000, 'Active'),
        ('CUST002', 'Dev Infra Contractors', '06AABCDE1234F1Z5', '9812345671', 'accounts@devinfra.com', 'Mehrauli Road, New Delhi', 'New Delhi', 'Delhi', 900000, 150000, 85000, 'Active'),
        ('CUST003', 'NHAI Highway Works', '06BCCDE1234G1Z6', '9812345672', 'procurement@nhai.gov.in', 'Gurugram', 'Gurugram', 'Haryana', 2000000, 570000, 175000, 'Active'),
        ('CUST004', 'Kumar Builders', '06AAACD1234E1Z8', '9812345673', 'kumarbuilders@gmail.com', 'Faridabad Road, Faridabad', 'Faridabad', 'Haryana', 600000, 80000, 36000, 'Active');
    `);

    console.log('Inserting suppliers...');
    await client.query(`
      INSERT INTO suppliers (code, name, gst, mobile, email, address, city, state, bank_name, bank_account, bank_ifsc, outstanding, status)
      VALUES
        ('SUP001', 'Aravalli Stone Crusher', '08AABBCC1234D1Z7', '9876500001', 'billing@aravalli.com', 'Alwar Road, Rajasthan', 'Alwar', 'Rajasthan', 'HDFC Bank', '50100123456789', 'HDFC0001234', 120000, 'Active'),
        ('SUP002', 'Haryana Aggregates', '06AAADD1234F1Z5', '9876500002', 'accounts@haryanaagg.com', 'Sohna Highway', 'Gurugram', 'Haryana', 'State Bank of India', '60900012345678', 'SBIN0007890', 0, 'Active'),
        ('SUP003', 'Yamuna Sand Co.', '09AABCD1234G1Z2', '9876500003', 'info@yamunasand.com', 'Yamuna Nagar', 'Yamuna Nagar', 'Haryana', 'Punjab National Bank', '12345098765432', 'PUNB0123456', 45000, 'Active');
    `);

    console.log('Inserting drivers...');
    await client.query(`
      INSERT INTO drivers (name, mobile, email, address, license_number, license_expiry, joining_date, status)
      VALUES
        ('Ramesh Yadav', '9911100001', 'ramesh.yadav@example.com', 'Sector 22, Gurugram', 'HR0420110012345', '2027-05-12', '2022-07-01', 'Active'),
        ('Suresh Kumar', '9911100002', 'suresh.kumar@example.com', 'Sector 45, Gurgaon', 'HR0420090054321', '2026-03-30', '2021-11-15', 'Active'),
        ('Mohd. Asif', '9911100003', 'asif@example.com', 'Shahbad', 'DL1320150087654', '2028-11-08', '2023-02-10', 'Active'),
        ('Vikram Singh', '9911100004', 'vikram.singh@example.com', 'Alwar Road', 'RJ1420130045678', '2026-09-19', '2020-04-20', 'Active');
    `);

    console.log('Inserting vehicles...');
    await client.query(`
      INSERT INTO vehicles (number, vehicle_type, ownership, capacity_tonnes, rc_expiry, insurance_expiry, fitness_expiry, permit_expiry, puc_expiry, status)
      VALUES
        ('HR55AB1234', 'Tipper', 'Own', 25, '2027-01-15', '2027-01-15', '2027-12-10', '2027-01-30', '2027-02-28', 'Active'),
        ('HR38C5678', 'Trolley', 'Own', 16, '2026-12-01', '2026-10-10', '2026-08-20', '2026-11-15', '2027-01-12', 'Active'),
        ('RJ14GA9012', 'Trailer', 'Hired', 28, '2027-08-20', '2027-05-30', '2027-04-15', '2027-06-20', '2027-03-31', 'Active'),
        ('DL1LT8800', 'Tanker', 'Hired', 18, '2026-11-02', '2026-10-18', '2027-02-28', '2026-09-14', '2026-10-10', 'Active');
    `);

    console.log('Inserting hsn_catalog...');
    await client.query(`
      INSERT INTO hsn_catalog (hsn_code, description, gst_rate)
      VALUES
        ('25171010', 'Stone aggregate', 5),
        ('25051019', 'M-sand / manufactured sand', 5),
        ('25030010', 'Granite and gneiss', 5);
    `);

    console.log('Inserting products...');
    await client.query(`
      INSERT INTO products (code, name, hsn_id, unit, gst_rate, default_rate, category, status)
      VALUES
        ('10MM', '10mm Aggregate', (SELECT id FROM hsn_catalog WHERE hsn_code = '25171010'), 'MT', 5, 580, 'Aggregate', 'Active'),
        ('20MM', '20mm Aggregate', (SELECT id FROM hsn_catalog WHERE hsn_code = '25171010'), 'MT', 5, 560, 'Aggregate', 'Active'),
        ('M-SAND', 'Manufactured Sand', (SELECT id FROM hsn_catalog WHERE hsn_code = '25051019'), 'MT', 5, 640, 'Sand', 'Active'),
        ('DUST', 'Stone Dust', (SELECT id FROM hsn_catalog WHERE hsn_code = '25171010'), 'MT', 5, 420, 'Aggregate', 'Active'),
        ('BOULDER', 'Boulder', (SELECT id FROM hsn_catalog WHERE hsn_code = '25030010'), 'MT', 5, 360, 'Aggregate', 'Active');
    `);

    console.log('Inserting shipping_addresses...');
    await client.query(`
      INSERT INTO shipping_addresses (customer_id, address_name, address, city, state, pincode, contact_person, contact_phone, is_default)
      VALUES
        ((SELECT id FROM customers WHERE code = 'CUST001'), 'Site A', 'Plot 12, Block C, Gurugram', 'Gurugram', 'Haryana', '122001', 'Rohit', '9811122233', TRUE),
        ((SELECT id FROM customers WHERE code = 'CUST002'), 'Main Yard', 'B1, Mehrauli Road, Delhi', 'New Delhi', 'Delhi', '110030', 'Anil', '9811122244', TRUE);
    `);

    console.log('Inserting orders...');
    await client.query(`
      INSERT INTO orders (order_no, order_date, customer_id, supplier_id, product_id, qty, rate, vehicle_id, driver_id, ship_to_address_id, freight, payment_terms, expected_delivery, remarks, status)
      VALUES
        ('ORD-2026-001', '2026-06-01', (SELECT id FROM customers WHERE code = 'CUST001'), (SELECT id FROM suppliers WHERE code = 'SUP001'), (SELECT id FROM products WHERE code = '20MM'), 25, 560, (SELECT id FROM vehicles WHERE number = 'HR55AB1234'), (SELECT id FROM drivers WHERE license_number = 'HR0420110012345'), (SELECT id FROM shipping_addresses WHERE address_name = 'Site A'), 2500, 'Advance 30 days', '2026-06-04', 'Delivery to Site A', 'Approved'),
        ('ORD-2026-002', '2026-06-01', (SELECT id FROM customers WHERE code = 'CUST002'), (SELECT id FROM suppliers WHERE code = 'SUP002'), (SELECT id FROM products WHERE code = 'DUST'), 16, 420, (SELECT id FROM vehicles WHERE number = 'HR38C5678'), (SELECT id FROM drivers WHERE license_number = 'HR0420090054321'), (SELECT id FROM shipping_addresses WHERE address_name = 'Main Yard'), 1800, 'Net 15 days', '2026-06-05', 'Site supply', 'Loaded');
    `);

    console.log('Inserting sales_invoices...');
    await client.query(`
      INSERT INTO sales_invoices (invoice_no, invoice_date, customer_id, order_id, sub_total, cgst_amount, sgst_amount, igst_amount, total_amount, payment_status, status)
      VALUES
        ('INV-2026-001', '2026-06-03', (SELECT id FROM customers WHERE code = 'CUST001'), (SELECT id FROM orders WHERE order_no = 'ORD-2026-001'), 14000, 700, 700, 0, 15400, 'Unpaid', 'Draft'),
        ('INV-2026-002', '2026-06-05', (SELECT id FROM customers WHERE code = 'CUST002'), (SELECT id FROM orders WHERE order_no = 'ORD-2026-002'), 6720, 336, 336, 0, 7392, 'Unpaid', 'Draft');
    `);

    console.log('Inserting purchase_invoices...');
    await client.query(`
      INSERT INTO purchase_invoices (invoice_no, invoice_date, supplier_id, order_id, sub_total, gst_amount, total_amount, payment_status, status)
      VALUES
        ('PUR-2026-001', '2026-06-02', (SELECT id FROM suppliers WHERE code = 'SUP001'), (SELECT id FROM orders WHERE order_no = 'ORD-2026-001'), 11000, 550, 11550, 'Unpaid', 'Draft'),
        ('PUR-2026-002', '2026-06-02', (SELECT id FROM suppliers WHERE code = 'SUP002'), (SELECT id FROM orders WHERE order_no = 'ORD-2026-002'), 8000, 400, 8400, 'Unpaid', 'Draft');
    `);

    console.log('Inserting trips...');
    await client.query(`
      INSERT INTO trips (trip_no, trip_date, vehicle_id, driver_id, source, destination, weight, revenue, trip_expenses, net_profit, status)
      VALUES
        ('TRP-2026-001', '2026-06-03', (SELECT id FROM vehicles WHERE number = 'HR55AB1234'), (SELECT id FROM drivers WHERE license_number = 'HR0420110012345'), 'Alwar Quarry', 'Gurugram Site A', 25, 14200, 8200, 6000, 'Pending'),
        ('TRP-2026-002', '2026-06-04', (SELECT id FROM vehicles WHERE number = 'HR38C5678'), (SELECT id FROM drivers WHERE license_number = 'HR0420090054321'), 'Sohna Yard', 'Delhi Main Yard', 16, 9200, 5400, 3800, 'Pending');
    `);

    await client.query('COMMIT');
    console.log('✅ Database schema created and test seed data inserted.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error('Unexpected migration error:', error);
  process.exit(1);
});
