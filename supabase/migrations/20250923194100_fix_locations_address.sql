-- Fix locations table address constraint

-- Make address column nullable or add default value
ALTER TABLE locations 
ALTER COLUMN address DROP NOT NULL;