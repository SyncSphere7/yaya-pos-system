-- Production setup script for YaYa Bar & Restaurant departments
-- Run this after the main schema to set up the 3 departments structure
-- Replace 'your-location-id' with your actual location ID from Supabase

-- Insert the 3 main departments
INSERT INTO public.departments (location_id, name, description, color, sort_order) VALUES 
('your-location-id', 'Restaurant', 'Full meals and dining experience', '#2563eb', 1),
('your-location-id', 'Bar', 'Alcoholic beverages and bar service', '#dc2626', 2),
('your-location-id', 'Fumes', 'Hookah and smoking lounge', '#7c3aed', 3);

-- Success message
SELECT 'YaYa Bar & Restaurant departments structure ready for production! 🍽️🍺💨' as message;