-- Migration script to add PIN authentication to existing YaYa POS System
-- Run this in your Supabase SQL editor

-- Add PIN authentication columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS pin VARCHAR(4),
ADD COLUMN IF NOT EXISTS pin_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20);

-- Create index for PIN lookups (for performance)
CREATE INDEX IF NOT EXISTS idx_users_pin ON public.users(pin) WHERE pin_enabled = true;
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON public.users(employee_id);

-- Add comment for documentation
COMMENT ON COLUMN public.users.pin IS '4-digit PIN for quick staff login';
COMMENT ON COLUMN public.users.pin_enabled IS 'Enable PIN-based authentication for this user';
COMMENT ON COLUMN public.users.employee_id IS 'Optional employee ID for display purposes';

-- Sample data: Create some staff members with PINs for testing
-- Replace the location_id and organization_id with your actual IDs

-- Example staff members (update IDs as needed)
INSERT INTO public.users (
    id,
    organization_id,
    location_id,
    email,
    first_name,
    last_name,
    role,
    pin,
    pin_enabled,
    employee_id,
    is_active
) VALUES 
(
    gen_random_uuid(),
    'your-organization-id-here', -- Replace with actual organization ID
    'your-location-id-here',     -- Replace with actual location ID
    'waiter1@yaya.com',
    'John',
    'Doe',
    'waiter',
    '1234',
    true,
    'EMP001',
    true
),
(
    gen_random_uuid(),
    'your-organization-id-here', -- Replace with actual organization ID
    'your-location-id-here',     -- Replace with actual location ID
    'kitchen1@yaya.com',
    'Jane',
    'Smith',
    'kitchen',
    '5678',
    true,
    'EMP002',
    true
),
(
    gen_random_uuid(),
    'your-organization-id-here', -- Replace with actual organization ID
    'your-location-id-here',     -- Replace with actual location ID
    'cashier1@yaya.com',
    'Mike',
    'Johnson',
    'cashier',
    '9999',
    true,
    'EMP003',
    true
);

-- Update RLS policies to include PIN authentication
-- This ensures PIN-enabled users can be queried properly

-- Create or replace the existing user select policy
DROP POLICY IF EXISTS "Users can view users in their organization" ON public.users;

CREATE POLICY "Users can view users in their organization" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        ) OR
        pin_enabled = true -- Allow PIN lookups for authentication
    );

-- Ensure PIN queries work for authentication
CREATE POLICY "Allow PIN authentication queries" ON public.users
    FOR SELECT USING (pin_enabled = true AND is_active = true);

-- Grant necessary permissions
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.users TO authenticated;

-- Success message
SELECT 'PIN authentication migration completed successfully!' as status;