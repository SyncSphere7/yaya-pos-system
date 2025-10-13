-- Make first_name and last_name optional for staff members
-- Staff only need: name (full name), role, and pin
-- first_name/last_name are legacy fields that can remain NULL for staff

-- Remove NOT NULL constraints
ALTER TABLE public.users 
ALTER COLUMN first_name DROP NOT NULL;

ALTER TABLE public.users 
ALTER COLUMN last_name DROP NOT NULL;

-- Add comments explaining the new structure
COMMENT ON COLUMN public.users.first_name IS 'First name (optional). Use name column for staff members.';
COMMENT ON COLUMN public.users.last_name IS 'Last name (optional). Use name column for staff members.';
COMMENT ON COLUMN public.users.name IS 'Full name of user. Primary name field for staff members.';

-- All staff members now only need:
-- 1. name (full name)
-- 2. role (waiter, kitchen, cashier, manager)
-- 3. pin (4 digits for authentication)
