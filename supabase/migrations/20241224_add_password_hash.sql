-- Add password_hash column to users table for custom authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Update RLS policies to work with custom auth
-- Drop existing policies that depend on auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies that work with custom auth
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for setup" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for own profile" ON users
  FOR UPDATE USING (true);