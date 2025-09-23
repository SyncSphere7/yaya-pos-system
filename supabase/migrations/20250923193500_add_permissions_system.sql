-- Add permissions system to existing schema

-- First, let's check if user_role type exists and add new values
DO $$ 
BEGIN
    -- Add new role values to existing enum
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'accounts_manager';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operations_manager';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'inventory_manager';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'menu_manager';
    ELSE
        -- Create the enum if it doesn't exist
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
    END IF;
END $$;

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS department VARCHAR(50),
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Role Permissions Template Table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default permissions for each role
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

-- User Activity Log
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN (permissions);
CREATE INDEX IF NOT EXISTS idx_users_role_department ON users(role, department);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_log(created_at);

-- Update existing users to have permissions based on their role
UPDATE users SET 
    permissions = CASE 
        WHEN role = 'admin' THEN '["*"]'::jsonb
        WHEN role = 'manager' THEN '["pos.access", "kitchen.access", "reports.basic", "staff.view"]'::jsonb
        WHEN role = 'waiter' THEN '["pos.access", "orders.create", "tables.assign"]'::jsonb
        WHEN role = 'kitchen' THEN '["kitchen.access", "orders.update"]'::jsonb
        WHEN role = 'cashier' THEN '["pos.access", "payments.process", "orders.complete"]'::jsonb
        ELSE '[]'::jsonb
    END,
    full_name = COALESCE(
        CASE 
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
            THEN first_name || ' ' || last_name
            WHEN first_name IS NOT NULL 
            THEN first_name
            WHEN last_name IS NOT NULL 
            THEN last_name
            ELSE email
        END
    )
WHERE permissions IS NULL OR permissions = '[]'::jsonb OR full_name IS NULL;