-- Simple setup without foreign key constraints
-- We'll create the Supabase Auth user manually in the dashboard

-- Create organization
INSERT INTO organizations (name, created_at, updated_at)
VALUES ('Yaya Xtra Residence', NOW(), NOW());

-- Create location
INSERT INTO locations (organization_id, name, address, phone, created_at, updated_at)
SELECT id, 'Kisaasi', 'Plot 508, Block 215, Kulambiro Ring Road, Kisaasi, Kampala.', '+256 393-228-427', NOW(), NOW()
FROM organizations WHERE name = 'Yaya Xtra Residence';

-- Create departments
INSERT INTO departments (location_id, name, description, color, sort_order, created_at, updated_at)
SELECT l.id, 'Restaurant', 'Full meals and dining experience', '#1a1a1a', 1, NOW(), NOW()
FROM locations l 
JOIN organizations o ON l.organization_id = o.id 
WHERE o.name = 'Yaya Xtra Residence'
UNION ALL
SELECT l.id, 'Bar', 'Alcoholic beverages and bar service', '#1a1a1a', 2, NOW(), NOW()
FROM locations l 
JOIN organizations o ON l.organization_id = o.id 
WHERE o.name = 'Yaya Xtra Residence'
UNION ALL
SELECT l.id, 'Fumes', 'Hookah and smoking lounge', '#1a1a1a', 3, NOW(), NOW()
FROM locations l 
JOIN organizations o ON l.organization_id = o.id 
WHERE o.name = 'Yaya Xtra Residence';