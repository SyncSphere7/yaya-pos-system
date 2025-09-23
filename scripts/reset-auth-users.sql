-- =====================================================
-- SUPABASE AUTH RESET - RUN THIS IN SUPABASE DASHBOARD
-- Go to: Supabase Dashboard > Authentication > Users
-- Delete all users manually, OR run this in SQL Editor
-- =====================================================

-- WARNING: This deletes ALL authentication users
-- Only run this if you want to completely reset the system

-- Delete all auth users (requires service role key)
DELETE FROM auth.users;

-- Reset auth sequences
ALTER SEQUENCE auth.users_id_seq RESTART WITH 1;

-- Verify auth reset
SELECT 'Auth Reset Complete' as status;
SELECT COUNT(*) as remaining_users FROM auth.users;