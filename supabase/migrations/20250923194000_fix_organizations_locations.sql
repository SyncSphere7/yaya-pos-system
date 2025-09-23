-- Add missing columns to organizations and locations tables if they don't exist

-- Add is_active to organizations if it doesn't exist
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active to locations if it doesn't exist  
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active
UPDATE organizations SET is_active = true WHERE is_active IS NULL;
UPDATE locations SET is_active = true WHERE is_active IS NULL;