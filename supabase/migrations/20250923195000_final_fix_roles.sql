-- Final fix for user roles and constraints

-- Drop role_permissions table if it exists (it's causing issues)
DROP TABLE IF EXISTS role_permissions CASCADE;

-- Ensure user_role enum exists with all values
DO $$ 
BEGIN
    -- Drop and recreate the enum to ensure all values are present
    DROP TYPE IF EXISTS user_role CASCADE;
    
    CREATE TYPE user_role AS ENUM (
        'super_admin',
        'accounts_manager', 
        'operations_manager',
        'inventory_manager',
        'menu_manager',
        'admin',
        'manager',
        'waiter',
        'kitchen',
        'cashier'
    );
END $$;

-- Ensure users table has role column with correct type
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'waiter';

-- Update existing users to have valid roles
UPDATE users 
SET role = 'admin'::user_role 
WHERE role IS NULL OR role::text NOT IN (
    'super_admin', 'accounts_manager', 'operations_manager', 
    'inventory_manager', 'menu_manager', 'admin', 'manager', 
    'waiter', 'kitchen', 'cashier'
);

-- Recreate role_permissions table with correct structure
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default permissions
INSERT INTO role_permissions (role, permissions) VALUES
('super_admin', '["*"]'::jsonb),
('accounts_manager', '["finance.read", "finance.reports", "payments.manage", "analytics.financial"]'::jsonb),
('operations_manager', '["staff.manage", "operations.read", "scheduling.manage", "tables.manage", "reports.operational"]'::jsonb),
('inventory_manager', '["inventory.read", "inventory.write", "products.manage", "suppliers.manage", "stock.reports"]'::jsonb),
('menu_manager', '["menu.read", "menu.write", "categories.manage", "products.pricing", "modifiers.manage"]'::jsonb),
('admin', '["*"]'::jsonb),
('manager', '["pos.access", "kitchen.access", "reports.basic", "staff.view"]'::jsonb),
('waiter', '["pos.access", "orders.create", "tables.assign"]'::jsonb),
('kitchen', '["kitchen.access", "orders.update"]'::jsonb),
('cashier', '["pos.access", "payments.process", "orders.complete"]'::jsonb)
ON CONFLICT (role) DO UPDATE SET 
    permissions = EXCLUDED.permissions,
    updated_at = NOW();