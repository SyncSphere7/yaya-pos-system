-- =====================================================
-- COMPLETE ADMIN DASHBOARD SCHEMA
-- All tables needed for enterprise POS system
-- =====================================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  department text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product modifiers table
CREATE TABLE IF NOT EXISTS product_modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) DEFAULT 0,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text UNIQUE,
  quantity numeric(10,2) DEFAULT 0,
  unit text DEFAULT 'pcs',
  reorder_level numeric(10,2) DEFAULT 10,
  cost_price numeric(10,2) DEFAULT 0,
  supplier text,
  last_restocked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  supplier text NOT NULL,
  total_amount numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending',
  order_date timestamptz DEFAULT now(),
  delivery_date timestamptz,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES inventory_items(id),
  quantity numeric(10,2) NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text,
  expense_date timestamptz DEFAULT now(),
  payment_method text,
  receipt_url text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff attendance table
CREATE TABLE IF NOT EXISTS staff_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  clock_in timestamptz NOT NULL,
  clock_out timestamptz,
  break_duration integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  key text NOT NULL UNIQUE,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to existing tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount numeric(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_included boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_location ON categories(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory_items(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_location ON purchase_orders(location_id);
CREATE INDEX IF NOT EXISTS idx_expenses_location ON expenses(location_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON staff_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now, refine later)
CREATE POLICY "Enable all for authenticated users" ON categories FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON product_modifiers FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON inventory_items FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON purchase_orders FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON purchase_order_items FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON expenses FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON staff_attendance FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON system_settings FOR ALL USING (true);
