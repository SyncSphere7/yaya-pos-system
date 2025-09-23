-- =====================================================
-- YAYA POS SYSTEM - DATABASE RESET SCRIPT
-- This will completely reset the database for fresh setup
-- =====================================================

-- Delete all data in correct order (respecting foreign keys)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM payments;
DELETE FROM product_modifiers;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM tables;
DELETE FROM departments;
DELETE FROM users;
DELETE FROM locations;
DELETE FROM organizations;

-- Reset all sequences to start from 1
ALTER SEQUENCE organizations_id_seq RESTART WITH 1;
ALTER SEQUENCE locations_id_seq RESTART WITH 1;
ALTER SEQUENCE departments_id_seq RESTART WITH 1;
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE tables_id_seq RESTART WITH 1;
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
ALTER SEQUENCE order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE payments_id_seq RESTART WITH 1;
ALTER SEQUENCE product_modifiers_id_seq RESTART WITH 1;

-- Clear Supabase Auth users (this removes all authentication data)
-- Note: This requires SUPABASE_SERVICE_ROLE_KEY to execute
-- You'll need to run this in Supabase SQL Editor as admin

-- Verify reset
SELECT 'Reset Complete - All tables cleared' as status;
SELECT 
  'organizations' as table_name, COUNT(*) as record_count FROM organizations
UNION ALL
SELECT 'locations', COUNT(*) FROM locations
UNION ALL  
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'departments', COUNT(*) FROM departments;