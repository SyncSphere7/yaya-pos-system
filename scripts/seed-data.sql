-- Comprehensive seed data for YaYa Bar & Restaurant POS System
-- Run this in your Supabase SQL editor to populate test data

-- Insert sample organization
INSERT INTO public.organizations (id, name, settings) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'YaYa Bar & Restaurant', '{"currency": "UGX", "timezone": "Africa/Kampala"}');

-- Insert sample location
INSERT INTO public.locations (id, organization_id, name, address, phone, settings) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Main Branch', 'Kampala, Uganda', '+256700000000', '{"sections": ["Bar", "Restaurant", "Fumes"], "tax_rate": 0}');

-- Insert sample categories for bar, restaurant, and fumes sections
INSERT INTO public.categories (id, location_id, name, description, sort_order) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'Bar - Beers', 'Local and imported beers', 1),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Bar - Spirits', 'Whiskey, vodka, gin, rum', 2),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Bar - Wines', 'Red, white, and sparkling wines', 3),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'Bar - Cocktails', 'Mixed drinks and cocktails', 4),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 'Restaurant - Appetizers', 'Starters and small plates', 5),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'Restaurant - Main Course', 'Full meals and entrees', 6),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440001', 'Restaurant - Desserts', 'Sweet treats and desserts', 7),
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440001', 'Fumes - Hookah', 'Shisha and hookah flavors', 8),
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440001', 'Beverages - Non-Alcoholic', 'Soft drinks, juices, water', 9);

-- Insert sample products
INSERT INTO public.products (id, location_id, category_id, name, description, price, cost, sku, is_active, sort_order) VALUES 
-- Appetizers
('prod-samosas', 'loc-yaya-kampala', 'cat-appetizers', 'Chicken Samosas', 'Crispy pastries filled with spiced chicken', 8000, 3000, 'APP001', true, 1),
('prod-spring-rolls', 'loc-yaya-kampala', 'cat-appetizers', 'Spring Rolls', 'Fresh vegetables wrapped in rice paper', 6000, 2500, 'APP002', true, 2),

-- Main Courses
('prod-pilau', 'loc-yaya-kampala', 'cat-mains', 'Chicken Pilau', 'Aromatic rice with tender chicken pieces', 15000, 7000, 'MAIN001', true, 1),
('prod-fish-curry', 'loc-yaya-kampala', 'cat-mains', 'Fish Curry', 'Fresh tilapia in coconut curry sauce', 18000, 8000, 'MAIN002', true, 2),
('prod-rolex', 'loc-yaya-kampala', 'cat-mains', 'Rolex Special', 'Egg rolled in chapati with vegetables', 5000, 2000, 'MAIN003', true, 3),

-- Beverages
('prod-soda', 'loc-yaya-kampala', 'cat-beverages', 'Soft Drinks', 'Coca-Cola, Pepsi, Fanta', 3000, 1500, 'BEV001', true, 1),
('prod-juice', 'loc-yaya-kampala', 'cat-beverages', 'Fresh Juice', 'Orange, Mango, Passion fruit', 5000, 2000, 'BEV002', true, 2),
('prod-beer', 'loc-yaya-kampala', 'cat-beverages', 'Local Beer', 'Nile Special, Bell Lager', 4000, 2500, 'BEV003', true, 3),

-- Desserts
('prod-ice-cream', 'loc-yaya-kampala', 'cat-desserts', 'Ice Cream', 'Vanilla, Chocolate, Strawberry', 4000, 1500, 'DES001', true, 1),
('prod-fruit-salad', 'loc-yaya-kampala', 'cat-desserts', 'Fruit Salad', 'Fresh seasonal fruits', 6000, 2500, 'DES002', true, 2);

-- Insert sample tables
INSERT INTO public.tables (id, location_id, name, capacity, section, status) VALUES 
('table-01', 'loc-yaya-kampala', 'T1', 4, 'Main Hall', 'available'),
('table-02', 'loc-yaya-kampala', 'T2', 2, 'Main Hall', 'available'),
('table-03', 'loc-yaya-kampala', 'T3', 6, 'Main Hall', 'available'),
('table-04', 'loc-yaya-kampala', 'T4', 4, 'Terrace', 'available'),
('table-05', 'loc-yaya-kampala', 'T5', 8, 'Private Room', 'available');

-- Insert sample modifiers
INSERT INTO public.modifiers (id, location_id, name, type, required, max_selections) VALUES 
('mod-spice', 'loc-yaya-kampala', 'Spice Level', 'single', true, 1),
('mod-extras', 'loc-yaya-kampala', 'Extra Toppings', 'multiple', false, 3);

-- Insert modifier options
INSERT INTO public.modifier_options (id, modifier_id, name, price_adjustment, sort_order) VALUES 
-- Spice levels
('opt-mild', 'mod-spice', 'Mild', 0, 1),
('opt-medium', 'mod-spice', 'Medium', 0, 2),
('opt-hot', 'mod-spice', 'Hot', 0, 3),
('opt-extra-hot', 'mod-spice', 'Extra Hot', 0, 4),

-- Extra toppings
('opt-cheese', 'mod-extras', 'Extra Cheese', 2000, 1),
('opt-avocado', 'mod-extras', 'Avocado', 3000, 2),
('opt-bacon', 'mod-extras', 'Bacon', 4000, 3);

-- Link modifiers to products
INSERT INTO public.product_modifiers (product_id, modifier_id) VALUES 
('prod-pilau', 'mod-spice'),
('prod-fish-curry', 'mod-spice'),
('prod-rolex', 'mod-spice'),
('prod-rolex', 'mod-extras');

-- Insert sample ingredients for inventory tracking
INSERT INTO public.ingredients (id, location_id, name, unit, current_stock, min_stock, cost_per_unit) VALUES 
('ing-rice', 'loc-yaya-kampala', 'Rice', 'kg', 50.0, 10.0, 3500),
('ing-chicken', 'loc-yaya-kampala', 'Chicken', 'kg', 30.0, 5.0, 12000),
('ing-fish', 'loc-yaya-kampala', 'Tilapia Fish', 'kg', 20.0, 3.0, 15000),
('ing-eggs', 'loc-yaya-kampala', 'Eggs', 'pieces', 200, 50, 500),
('ing-flour', 'loc-yaya-kampala', 'Wheat Flour', 'kg', 25.0, 5.0, 4000);

-- Link ingredients to products (recipes)
INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity_required) VALUES 
('prod-pilau', 'ing-rice', 0.3),
('prod-pilau', 'ing-chicken', 0.2),
('prod-fish-curry', 'ing-fish', 0.25),
('prod-rolex', 'ing-eggs', 2),
('prod-rolex', 'ing-flour', 0.1);

-- Success message
SELECT 'Sample data inserted successfully! You can now test the POS system.' as message;
