-- Remove the problematic role check constraint

-- Drop the check constraint that's blocking super_admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Ensure the role column can accept all our enum values
-- No additional constraint needed since the column type itself enforces valid enum values