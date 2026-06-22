#!/bin/bash
# Complete PostgreSQL Schema Setup

DB_NAME=${DB_NAME:-honeyent_db}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" << 'EOF'

-- Company Profile
CREATE TABLE company_profile (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  gst VARCHAR(15) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(15),
  email VARCHAR(255),
  logo_text VARCHAR(100),
  owner_name VARCHAR(100),
  owner_phone VARCHAR(15),
  owner_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  gst VARCHAR(15),
  mobile VARCHAR(15),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  credit_limit DECIMAL(15,2) DEFAULT 0,
  opening_balance DECIMAL(15,2) DEFAULT 0,
  outstanding DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, mobile)
);
CREATE INDEX idx_customer_code ON customers(code);
CREATE INDEX idx_customer_gst ON customers(gst);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  gst VARCHAR(15),
  mobile VARCHAR(15),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  bank_name VARCHAR(100),
  bank_account VARCHAR(30),
  bank_ifsc VARCHAR(11),
  outstanding DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, mobile)
);
CREATE INDEX idx_supplier_code ON suppliers(code);
CREATE INDEX idx_supplier_gst ON suppliers(gst);

-- Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(15) UNIQUE,
  email VARCHAR(255),
  address TEXT,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  license_expiry DATE,
  joining_date DATE,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_driver_license ON drivers(license_number);
CREATE INDEX idx_driver_mobile ON drivers(mobile);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE INDEX idx_vehicle_number ON vehicles(number);

-- HSN Catalog
CREATE TABLE hsn_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hsn_code VARCHAR(8) UNIQUE NOT NULL,
  description VARCHAR(255),
  gst_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_hsn_code ON hsn_catalog(hsn_code);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  hsn_id UUID REFERENCES hsn_catalog(id),
  unit VARCHAR(20) DEFAULT 'MT',
  gst_rate DECIMAL(5,2),
  default_rate DECIMAL(15,2),
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_product_code ON products(code);

-- Shipping Addresses
CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  address_name VARCHAR(100),
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(6),
  contact_person VARCHAR(100),
  contact_phone VARCHAR(15),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_address_customer ON shipping_addresses(customer_id);

-- Expense Heads
CREATE TABLE expense_heads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  code VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(50) UNIQUE NOT NULL,
  order_date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  supplier_id UUID REFERENCES suppliers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  qty DECIMAL(10,2),
  rate DECIMAL(15,2),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  ship_to_address_id UUID REFERENCES shipping_addresses(id),
  freight DECIMAL(15,2) DEFAULT 0,
  payment_terms VARCHAR(100),
  expected_delivery DATE,
  remarks TEXT,
  status VARCHAR(30) DEFAULT 'Pending',
  deal_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_order_no ON orders(order_no);
CREATE INDEX idx_order_customer ON orders(customer_id);
CREATE INDEX idx_order_date ON orders(order_date);

-- Delivery Challans
CREATE TABLE delivery_challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_no VARCHAR(50) UNIQUE NOT NULL,
  challan_date DATE NOT NULL,
  order_id UUID REFERENCES orders(id),
  deal_id UUID,
  customer_id UUID REFERENCES customers(id),
  product_id UUID REFERENCES products(id),
  qty DECIMAL(10,2),
  hsn_code VARCHAR(8),
  gst_rate DECIMAL(5,2),
  amount DECIMAL(15,2),
  status VARCHAR(30),
  cancelled BOOLEAN DEFAULT FALSE,
  cancel_remark TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_challan_no ON delivery_challans(challan_no);

-- Weigh Slips
CREATE TABLE weigh_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_no VARCHAR(50) UNIQUE NOT NULL,
  slip_date DATE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  product_id UUID REFERENCES products(id),
  gross_weight DECIMAL(10,2),
  tare_weight DECIMAL(10,2),
  net_weight DECIMAL(10,2),
  customer_weight DECIMAL(10,2),
  loss_weight DECIMAL(10,2),
  deal_id UUID,
  status VARCHAR(30) DEFAULT 'Draft',
  cancelled BOOLEAN DEFAULT FALSE,
  cancel_remark TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_weighslip_no ON weigh_slips(slip_no);

-- Trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_no VARCHAR(50) UNIQUE NOT NULL,
  trip_date DATE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  source VARCHAR(255),
  destination VARCHAR(255),
  weight DECIMAL(10,2),
  revenue DECIMAL(15,2),
  trip_expenses DECIMAL(15,2) DEFAULT 0,
  net_profit DECIMAL(15,2),
  deal_id UUID,
  status VARCHAR(30) DEFAULT 'Pending',
  cancelled BOOLEAN DEFAULT FALSE,
  cancel_remark TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_trip_no ON trips(trip_no);

-- Trip Expenses
CREATE TABLE trip_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  expense_head_id UUID NOT NULL REFERENCES expense_heads(id),
  amount DECIMAL(15,2),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_trip_expenses_trip ON trip_expenses(trip_id);

-- Sales Invoices
CREATE TABLE sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  deal_id UUID,
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
CREATE INDEX idx_invoice_no ON sales_invoices(invoice_no);

-- Purchase Invoices
CREATE TABLE purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  order_id UUID REFERENCES orders(id),
  deal_id UUID,
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
CREATE INDEX idx_purchase_no ON purchase_invoices(invoice_no);

-- Deals
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_no VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  supplier_id UUID REFERENCES suppliers(id),
  order_id UUID REFERENCES orders(id),
  challan_id UUID REFERENCES delivery_challans(id),
  weigh_slip_id UUID REFERENCES weigh_slips(id),
  trip_id UUID REFERENCES trips(id),
  sales_invoice_id UUID REFERENCES sales_invoices(id),
  purchase_invoice_id UUID REFERENCES purchase_invoices(id),
  deal_date DATE,
  total_value DECIMAL(15,2),
  status VARCHAR(30) DEFAULT 'Created',
  cancelled BOOLEAN DEFAULT FALSE,
  cancel_remark TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_deal_no ON deals(deal_no);

EOF

echo "✅ Database schema created successfully!"
