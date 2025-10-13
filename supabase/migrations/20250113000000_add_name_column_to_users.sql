-- Add 'name' column to users table for full name storage
-- This complements the existing first_name and last_name columns

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name varchar(255);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users(name);

-- Add a comment explaining the column
COMMENT ON COLUMN public.users.name IS 'Full name of the user. Optional field that can be used as an alternative to first_name/last_name combination.';
