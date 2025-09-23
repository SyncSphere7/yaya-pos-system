-- Add pin_enabled column to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pin_enabled BOOLEAN DEFAULT false;