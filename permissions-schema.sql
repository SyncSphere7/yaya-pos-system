-- Enhanced Users Table with Permissions
ALTER TABLE users 
ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN created_by UUID REFERENCES users(id),
ADD COLUMN is_super_admin BOOLEAN DEFAULT false,
ADD COLUMN department VARCHAR(50);

-- Update existing role enum to include new roles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'accounts_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'inventory_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'menu_manager';

-- Role Permissions Template Table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL,
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
('manager', '["pos.access", "kitchen.access", "reports.basic", "staff.view"]'::jsonb),
('waiter', '["pos.access", "orders.create", "tables.assign"]'::jsonb),
('kitchen', '["kitchen.access", "orders.update"]'::jsonb),
('cashier', '["pos.access", "payments.process", "orders.complete"]'::jsonb);

-- User Activity Log
CREATE TABLE user_activity_log (
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
CREATE INDEX idx_users_permissions ON users USING GIN (permissions);
CREATE INDEX idx_users_role_department ON users(role, department);
CREATE INDEX idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity_log(created_at);