-- =====================================================
-- YAYA POS SYSTEM - ADMIN SETUP SCRIPT
-- Creates organization, location, admin user, and departments
-- =====================================================

-- Create organization
INSERT INTO organizations (name, created_at, updated_at)
VALUES ('Yaya Xtra Residence', NOW(), NOW())
RETURNING id;

-- Create location (using organization_id = 1 from above)
INSERT INTO locations (organization_id, name, address, phone, created_at, updated_at)
VALUES (1, 'Kisaasi', 'Plot 508, Block 215, Kulambiro Ring Road, Kisaasi, Kampala.', '+256 393-228-427', NOW(), NOW())
RETURNING id;

-- Create admin user (using location_id = 1 from above)
-- Note: We'll create the Supabase Auth user separately
INSERT INTO users (
  id, 
  email, 
  first_name, 
  last_name, 
  role, 
  organization_id, 
  location_id, 
  is_active,
  created_at,
  updated_at
) VALUES (
  'admin-yaya-001',
  'yayaxtra@gmail.com',
  'Stanley',
  'Ndawula',
  'admin',
  1,
  1,
  true,
  NOW(),
  NOW()
);

-- Create departments
INSERT INTO departments (location_id, name, description, color, sort_order, created_at, updated_at)
VALUES 
  (1, 'Restaurant', 'Full meals and dining experience', '#1a1a1a', 1, NOW(), NOW()),
  (1, 'Bar', 'Alcoholic beverages and bar service', '#1a1a1a', 2, NOW(), NOW()),
  (1, 'Fumes', 'Hookah and smoking lounge', '#1a1a1a', 3, NOW(), NOW());

-- Verify setup
SELECT 'Setup Complete!' as status;
SELECT 'Organization:' as type, name as details FROM organizations;
SELECT 'Location:' as type, name as details FROM locations;
SELECT 'Admin User:' as type, CONCAT(first_name, ' ', last_name, ' (', email, ')') as details FROM users;
SELECT 'Departments:' as type, name as details FROM departments ORDER BY sort_order;