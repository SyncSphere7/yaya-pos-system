-- Add 'pin' column to users table for 4-digit PIN authentication
-- This column stores the PIN code for staff members to login

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS pin varchar(4);

-- Create an index for better query performance when authenticating with PIN
CREATE INDEX IF NOT EXISTS idx_users_pin ON public.users(pin) WHERE pin IS NOT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN public.users.pin IS '4-digit PIN code for staff authentication. Used for quick login without email/password.';
