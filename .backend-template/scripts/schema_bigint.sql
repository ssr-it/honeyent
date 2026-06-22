-- Bigint-converted schema for Honey Enterprises

CREATE TABLE IF NOT EXISTS company_profile (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  gst VARCHAR(50) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  logo_text VARCHAR(100),
  owner_name VARCHAR(100),
  owner_phone VARCHAR(50),
  owner_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  gst VARCHAR(50),
  mobile VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  credit_limit DECIMAL(15,2) DEFAULT 0,
  opening_balance DECIMAL(15,2) DEFAULT 0,
  outstanding DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customer_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_customer_gst ON customers(gst);

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  gst VARCHAR(50),
  mobile VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  bank_name VARCHAR(100),
  bank_account VARCHAR(30),
  bank_ifsc VARCHAR(11),
  opening_balance DECIMAL(15,2) DEFAULT 0,
  outstanding DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_supplier_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_supplier_gst ON suppliers(gst);

CREATE TABLE IF NOT EXISTS drivers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  address TEXT,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  license_expiry DATE,
  joining_date DATE,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_driver_license ON drivers(license_number);
CREATE INDEX IF NOT EXISTS idx_driver_mobile ON drivers(mobile);

CREATE TABLE IF NOT EXISTS vehicles (
  id BIGSERIAL PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50),
  ownership VARCHAR(20) DEFAULT 'Own',
  capacity_tonnes DECIMAL(10,2),
  rc_expiry DATE,
  insurance_expiry DATE,
  fitness_expiry DATE,
  permit_expiry DATE,
  puc_expiry DATE,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vehicle_number ON vehicles(number);

CREATE TABLE IF NOT EXISTS hsn_catalog (
  id BIGSERIAL PRIMARY KEY,
  hsn_code VARCHAR(8) UNIQUE NOT NULL,
  description VARCHAR(255),
  gst_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hsn_code ON hsn_catalog(hsn_code);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  hsn_id BIGINT REFERENCES hsn_catalog(id),
  unit VARCHAR(20) DEFAULT 'MT',
  gst_rate DECIMAL(5,2),
  default_rate DECIMAL(15,2),
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_code ON products(code);

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  address_name VARCHAR(100),
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(6),
  contact_person VARCHAR(100),
  contact_phone VARCHAR(50),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_address_customer ON shipping_addresses(customer_id);

CREATE TABLE IF NOT EXISTS expense_heads (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  code VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  order_date DATE NOT NULL,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  supplier_id BIGINT REFERENCES suppliers(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  qty DECIMAL(10,2),
  rate DECIMAL(15,2),
  vehicle_id BIGINT REFERENCES vehicles(id),
  driver_id BIGINT REFERENCES drivers(id),
  ship_to_address_id BIGINT REFERENCES shipping_addresses(id),
  freight DECIMAL(15,2) DEFAULT 0,
  payment_terms VARCHAR(100),
  expected_delivery DATE,
  remarks TEXT,
  status VARCHAR(30) DEFAULT 'Pending',
  dispatch_no VARCHAR(50),
  deal_id BIGINT,
  cancelled BOOLEAN DEFAULT FALSE,
  cancel_remark TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_order_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_date ON orders(order_date);

CREATE TABLE IF NOT EXISTS delivery_challans (
  id BIGSERIAL PRIMARY KEY,
  challan_no VARCHAR(50) UNIQUE NOT NULL,
  challan_date DATE NOT NULL,
  order_id BIGINT REFERENCES orders(id),
  deal_id BIGINT,
  customer_id BIGINT REFERENCES customers(id),
  product_id BIGINT REFERENCES products(id),
  qty DECIMAL(10,2),
  hsn_code VARCHAR(8),
  gst_rate DECIMAL(5,2),
  amount DECIMAL(15,2),
  status VARCHAR(30) DEFAULT 'Draft',
  cancelled BOOLEAN DEFAULT FALSE,
  cancel_remark TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_challan_no ON delivery_challans(challan_no);

CREATE TABLE IF NOT EXISTS weigh_slips (
  id BIGSERIAL PRIMARY KEY,
  slip_no VARCHAR(50) UNIQUE NOT NULL,
  slip_date DATE NOT NULL,
  vehicle_id BIGINT REFERENCES vehicles(id),
  product_id BIGINT REFERENCES products(id),
  gross_weight DECIMAL(10,2),
  tare_weight DECIMAL(10,2),
  net_weight DECIMAL(10,2),
  customer_weight DECIMAL(10,2),
  loss_weight DECIMAL(10,2),
  deal_id BIGINT,
  status VARCHAR(30) DEFAULT 'Draft',
  cancelled BOOLEAN DEFAULT FALSE,
  cancel_remark TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_weighslip_no ON weigh_slips(slip_no);

CREATE TABLE IF NOT EXISTS trips (
  id BIGSERIAL PRIMARY KEY,
  trip_no VARCHAR(50) UNIQUE NOT NULL,
  trip_date DATE NOT NULL,
  vehicle_id BIGINT REFERENCES vehicles(id),
  driver_id BIGINT REFERENCES drivers(id),
  source VARCHAR(255),
  destination VARCHAR(255),
  weight DECIMAL(10,2),
  revenue DECIMAL(15,2),
  trip_expenses DECIMAL(15,2) DEFAULT 0,
  net_profit DECIMAL(15,2),
  deal_id BIGINT,
  status VARCHAR(30) DEFAULT 'Pending',
  cancelled BOOLEAN DEFAULT FALSE,
  cancel_remark TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trip_no ON trips(trip_no);

CREATE TABLE IF NOT EXISTS trip_expenses (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES trips(id),
  expense_head_id BIGINT NOT NULL REFERENCES expense_heads(id),
  amount DECIMAL(15,2),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip ON trip_expenses(trip_id);

CREATE TABLE IF NOT EXISTS sales_invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  order_id BIGINT REFERENCES orders(id),
  deal_id BIGINT,
  sub_total DECIMAL(15,2),
  cgst_amount DECIMAL(15,2) DEFAULT 0,
  sgst_amount DECIMAL(15,2) DEFAULT 0,
  igst_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2),
  payment_status VARCHAR(20) DEFAULT 'Unpaid',
  status VARCHAR(30) DEFAULT 'Draft',
  cancelled BOOLEAN DEFAULT FALSE,
  cancel_remark TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_invoice_no ON sales_invoices(invoice_no);

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
  order_id BIGINT REFERENCES orders(id),
  deal_id BIGINT,
  sub_total DECIMAL(15,2),
  gst_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  payment_status VARCHAR(20) DEFAULT 'Unpaid',
  status VARCHAR(30) DEFAULT 'Draft',
  cancelled BOOLEAN DEFAULT FALSE,
  cancel_remark TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_purchase_no ON purchase_invoices(invoice_no);

CREATE TABLE IF NOT EXISTS deals (
  id BIGSERIAL PRIMARY KEY,
  deal_no VARCHAR(50) UNIQUE NOT NULL,
  customer_id BIGINT REFERENCES customers(id),
  supplier_id BIGINT REFERENCES suppliers(id),
  order_id BIGINT REFERENCES orders(id),
  challan_id BIGINT REFERENCES delivery_challans(id),
  weigh_slip_id BIGINT REFERENCES weigh_slips(id),
  trip_id BIGINT REFERENCES trips(id),
  sales_invoice_id BIGINT REFERENCES sales_invoices(id),
  purchase_invoice_id BIGINT REFERENCES purchase_invoices(id),
  deal_date DATE,
  total_value DECIMAL(15,2),
  status VARCHAR(30) DEFAULT 'Created',
  cancelled BOOLEAN DEFAULT FALSE,
  cancel_remark TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deal_no ON deals(deal_no);
