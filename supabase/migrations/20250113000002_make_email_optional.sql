-- Make email optional for staff members
-- Staff members login with PIN only and don't need email
-- Admins still use email for authentication

-- Drop NOT NULL constraint on email column
ALTER TABLE public.users 
ALTER COLUMN email DROP NOT NULL;

-- Drop UNIQUE constraint on email (since NULL values need to be allowed)
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_email_key;

-- Add UNIQUE constraint that ignores NULL values
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique 
ON public.users(email) 
WHERE email IS NOT NULL;

-- Update comment to reflect optional nature
COMMENT ON COLUMN public.users.email IS 'Email address for admin authentication. Optional for staff members who login with PIN only.';
