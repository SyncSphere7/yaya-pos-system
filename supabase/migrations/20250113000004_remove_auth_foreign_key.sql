-- Remove foreign key constraint linking users.id to auth.users.id
-- Staff members don't need Supabase Auth accounts (they use PIN authentication)
-- Admins can still use auth.users if needed, but it's not enforced at DB level

-- Drop the foreign key constraint
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey;

-- The id column remains as UUID primary key, but no longer requires auth.users entry
-- This allows:
-- 1. Staff members: PIN-only authentication (no auth.users entry needed)
-- 2. Admins: Can still use email/password with auth.users (optional)

COMMENT ON TABLE public.users IS 'User accounts. Staff members use PIN authentication and do not require auth.users entries. Admins may optionally link to auth.users for email/password login.';
