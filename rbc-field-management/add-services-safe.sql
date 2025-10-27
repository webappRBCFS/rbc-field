-- Simple script to add new service categories and items
-- Run this in your Supabase SQL editor

-- First, create service_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category_id UUID REFERENCES service_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  unit_type TEXT NOT NULL,
  base_price DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the actual service categories (only if they don't exist)
INSERT INTO service_categories (name, description, is_active)
SELECT 'Maintenance (Janitorial)', 'Weekly janitorial upkeep for residential multi-family buildings (1-3 family up to 100+ units)', true
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Maintenance (Janitorial)');

INSERT INTO service_categories (name, description, is_active)
SELECT 'Office Cleaning', 'Cleaning services for offices of all sizes (2-3 desk offices to large corporate HQs)', true
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Office Cleaning');

INSERT INTO service_categories (name, description, is_active)
SELECT 'Apartment Turnover', 'Cleaning services for management companies and property owners between tenants', true
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Apartment Turnover');

INSERT INTO service_categories (name, description, is_active)
SELECT 'Residential Post-Construction', 'Full post-construction cleaning for end users (apartments/houses)', true
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Residential Post-Construction');

INSERT INTO service_categories (name, description, is_active)
SELECT 'Commercial Post-Construction', 'Post-construction cleaning for multi-family and commercial buildings', true
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Commercial Post-Construction');

-- Insert service items for each category (only if they don't exist)
-- Maintenance Services
INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Maintenance (Janitorial)'),
  'Custom Schedule Maintenance',
  'Maintenance with customizable visit frequency (e.g., 2x/week, 3x/week, etc.)',
  'monthly',
  0.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Custom Schedule Maintenance');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Maintenance (Janitorial)'),
  'Daily Maintenance',
  'Daily janitorial service',
  'monthly',
  1200.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Daily Maintenance');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Maintenance (Janitorial)'),
  'Common Areas Only',
  'Maintenance of common areas only',
  'monthly',
  200.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Common Areas Only');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Maintenance (Janitorial)'),
  'Exterior/Garbage Only',
  'Exterior cleaning and garbage collection service',
  'monthly',
  150.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Exterior/Garbage Only');

-- Office Cleaning Services
INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Office Cleaning'),
  'Small Office (2-3 desks)',
  'Cleaning for small office spaces',
  'per_cleaning',
  75.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Small Office (2-3 desks)');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Office Cleaning'),
  'Medium Office (4-10 desks)',
  'Cleaning for medium office spaces',
  'per_cleaning',
  150.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Medium Office (4-10 desks)');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Office Cleaning'),
  'Large Office (10+ desks)',
  'Cleaning for large office spaces',
  'per_cleaning',
  300.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Large Office (10+ desks)');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Office Cleaning'),
  'Executive Offices',
  'Premium cleaning for executive offices',
  'per_cleaning',
  200.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Executive Offices');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Office Cleaning'),
  'Conference Rooms',
  'Conference room cleaning',
  'per_cleaning',
  50.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Conference Rooms');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Office Cleaning'),
  'Bathroom Cleaning',
  'Office bathroom maintenance',
  'per_cleaning',
  25.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Bathroom Cleaning');

-- Apartment Turnover Services
INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Apartment Turnover'),
  'Studio Apartment Turnover',
  'Complete turnover cleaning for studio apartments',
  'per_unit',
  150.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Studio Apartment Turnover');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Apartment Turnover'),
  '1 Bedroom Turnover',
  'Complete turnover cleaning for 1 bedroom apartments',
  'per_unit',
  200.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = '1 Bedroom Turnover');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Apartment Turnover'),
  '2 Bedroom Turnover',
  'Complete turnover cleaning for 2 bedroom apartments',
  'per_unit',
  275.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = '2 Bedroom Turnover');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Apartment Turnover'),
  '3 Bedroom Turnover',
  'Complete turnover cleaning for 3 bedroom apartments',
  'per_unit',
  350.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = '3 Bedroom Turnover');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Apartment Turnover'),
  'Hourly Turnover Service',
  'Turnover cleaning billed by the hour',
  'hourly',
  45.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Hourly Turnover Service');

-- Residential Post-Construction Services
INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Residential Post-Construction'),
  'Small Space Post-Construction',
  'Post-construction cleaning for small residential spaces',
  'per_project',
  300.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Small Space Post-Construction');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Residential Post-Construction'),
  'Medium Space Post-Construction',
  'Post-construction cleaning for medium residential spaces',
  'per_project',
  500.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Medium Space Post-Construction');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Residential Post-Construction'),
  'Large Space Post-Construction',
  'Post-construction cleaning for large residential spaces',
  'per_project',
  800.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Large Space Post-Construction');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Residential Post-Construction'),
  'Hourly Post-Construction',
  'Post-construction cleaning billed by the hour',
  'hourly',
  50.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Hourly Post-Construction');

-- Commercial Post-Construction Services
INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Commercial Post-Construction'),
  'Small Commercial Post-Construction',
  'Post-construction cleaning for small commercial spaces',
  'per_project',
  1000.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Small Commercial Post-Construction');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Commercial Post-Construction'),
  'Medium Commercial Post-Construction',
  'Post-construction cleaning for medium commercial spaces',
  'per_project',
  2500.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Medium Commercial Post-Construction');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Commercial Post-Construction'),
  'Large Commercial Post-Construction',
  'Post-construction cleaning for large commercial spaces',
  'per_project',
  5000.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Large Commercial Post-Construction');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Commercial Post-Construction'),
  'Multi-Family Post-Construction',
  'Post-construction cleaning for multi-family buildings',
  'per_project',
  3000.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Multi-Family Post-Construction');

INSERT INTO service_items (service_category_id, name, description, unit_type, base_price, is_active)
SELECT
  (SELECT id FROM service_categories WHERE name = 'Commercial Post-Construction'),
  'Hourly Commercial Post-Construction',
  'Commercial post-construction cleaning billed by the hour',
  'hourly',
  60.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE name = 'Hourly Commercial Post-Construction');

-- Add new fields to existing tables
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_type_detail TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type_detail TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS unit_count INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS square_footage INTEGER;

-- Add fields to proposals table
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS service_category_id UUID REFERENCES service_categories(id);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS billing_frequency TEXT DEFAULT 'one_time';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS service_frequency TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS contract_duration_months INTEGER;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS visits_per_week INTEGER;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS visits_per_month INTEGER;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS custom_schedule_notes TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS visit_duration_hours DECIMAL(4,2);

-- Update existing proposals to have a default service category
UPDATE proposals SET service_category_id = (SELECT id FROM service_categories WHERE name = 'Maintenance (Janitorial)' LIMIT 1) WHERE service_category_id IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposals_service_category ON proposals(service_category_id);
CREATE INDEX IF NOT EXISTS idx_properties_unit_count ON properties(unit_count);
CREATE INDEX IF NOT EXISTS idx_properties_square_footage ON properties(square_footage);
