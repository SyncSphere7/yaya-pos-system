-- Remove manager role completely
-- Clean slate: Delete all existing managers
-- Going forward only: admin, waiter, cashier, kitchen

-- Delete all users with manager role
DELETE FROM public.users WHERE role = 'manager';

-- Update role constraint to remove manager option
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'waiter', 'kitchen', 'cashier'));

-- Add comment
COMMENT ON COLUMN public.users.role IS 'User role: admin (manages everything), waiter (takes orders + handles payments), kitchen (prepares food), cashier (dedicated payment handler)';
