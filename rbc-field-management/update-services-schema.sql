-- Update service categories to match RBC Field Management's actual services
-- Run this in your Supabase SQL editor

-- First, let's clear existing service categories and items
DELETE FROM service_items WHERE service_category_id IN (SELECT id FROM service_categories);
DELETE FROM service_categories;

-- Insert the actual service categories
INSERT INTO service_categories (id, name, description, is_active) VALUES
('maintenance', 'Maintenance (Janitorial)', 'Weekly janitorial upkeep for residential multi-family buildings (1-3 family up to 100+ units)', true),
('office-cleaning', 'Office Cleaning', 'Cleaning services for offices of all sizes (2-3 desk offices to large corporate HQs)', true),
('apartment-turnover', 'Apartment Turnover', 'Cleaning services for management companies and property owners between tenants', true),
('residential-post-construction', 'Residential Post-Construction', 'Full post-construction cleaning for end users (apartments/houses)', true),
('commercial-post-construction', 'Commercial Post-Construction', 'Post-construction cleaning for multi-family and commercial buildings', true);

-- Insert service items for each category
-- Maintenance Services
INSERT INTO service_items (id, service_category_id, name, description, unit_type, base_price, is_active) VALUES
('maintenance-custom-schedule', 'maintenance', 'Custom Schedule Maintenance', 'Maintenance with customizable visit frequency (e.g., 2x/week, 3x/week, etc.)', 'monthly', 0.00, true),
('maintenance-daily', 'maintenance', 'Daily Maintenance', 'Daily janitorial service', 'monthly', 1200.00, true),
('maintenance-common-areas', 'maintenance', 'Common Areas Only', 'Maintenance of common areas only', 'monthly', 200.00, true),
('maintenance-exterior-garbage', 'maintenance', 'Exterior/Garbage Only', 'Exterior cleaning and garbage collection service', 'monthly', 150.00, true);

-- Office Cleaning Services
INSERT INTO service_items (id, service_category_id, name, description, unit_type, base_price, is_active) VALUES
('office-small', 'office-cleaning', 'Small Office (2-3 desks)', 'Cleaning for small office spaces', 'per_cleaning', 75.00, true),
('office-medium', 'office-cleaning', 'Medium Office (4-10 desks)', 'Cleaning for medium office spaces', 'per_cleaning', 150.00, true),
('office-large', 'office-cleaning', 'Large Office (10+ desks)', 'Cleaning for large office spaces', 'per_cleaning', 300.00, true),
('office-executive', 'office-cleaning', 'Executive Offices', 'Premium cleaning for executive offices', 'per_cleaning', 200.00, true),
('office-conference', 'office-cleaning', 'Conference Rooms', 'Conference room cleaning', 'per_cleaning', 50.00, true),
('office-bathrooms', 'office-cleaning', 'Bathroom Cleaning', 'Office bathroom maintenance', 'per_cleaning', 25.00, true);

-- Apartment Turnover Services
INSERT INTO service_items (id, service_category_id, name, description, unit_type, base_price, is_active) VALUES
('turnover-studio', 'apartment-turnover', 'Studio Apartment Turnover', 'Complete turnover cleaning for studio apartments', 'per_unit', 150.00, true),
('turnover-1br', 'apartment-turnover', '1 Bedroom Turnover', 'Complete turnover cleaning for 1 bedroom apartments', 'per_unit', 200.00, true),
('turnover-2br', 'apartment-turnover', '2 Bedroom Turnover', 'Complete turnover cleaning for 2 bedroom apartments', 'per_unit', 275.00, true),
('turnover-3br', 'apartment-turnover', '3 Bedroom Turnover', 'Complete turnover cleaning for 3 bedroom apartments', 'per_unit', 350.00, true),
('turnover-hourly', 'apartment-turnover', 'Hourly Turnover Service', 'Turnover cleaning billed by the hour', 'hourly', 45.00, true);

-- Residential Post-Construction Services
INSERT INTO service_items (id, service_category_id, name, description, unit_type, base_price, is_active) VALUES
('res-post-small', 'residential-post-construction', 'Small Space Post-Construction', 'Post-construction cleaning for small residential spaces', 'per_project', 300.00, true),
('res-post-medium', 'residential-post-construction', 'Medium Space Post-Construction', 'Post-construction cleaning for medium residential spaces', 'per_project', 500.00, true),
('res-post-large', 'residential-post-construction', 'Large Space Post-Construction', 'Post-construction cleaning for large residential spaces', 'per_project', 800.00, true),
('res-post-hourly', 'residential-post-construction', 'Hourly Post-Construction', 'Post-construction cleaning billed by the hour', 'hourly', 50.00, true);

-- Commercial Post-Construction Services
INSERT INTO service_items (id, service_category_id, name, description, unit_type, base_price, is_active) VALUES
('com-post-small', 'commercial-post-construction', 'Small Commercial Post-Construction', 'Post-construction cleaning for small commercial spaces', 'per_project', 1000.00, true),
('com-post-medium', 'commercial-post-construction', 'Medium Commercial Post-Construction', 'Post-construction cleaning for medium commercial spaces', 'per_project', 2500.00, true),
('com-post-large', 'commercial-post-construction', 'Large Commercial Post-Construction', 'Post-construction cleaning for large commercial spaces', 'per_project', 5000.00, true),
('com-post-multifamily', 'commercial-post-construction', 'Multi-Family Post-Construction', 'Post-construction cleaning for multi-family buildings', 'per_project', 3000.00, true),
('com-post-hourly', 'commercial-post-construction', 'Hourly Commercial Post-Construction', 'Commercial post-construction cleaning billed by the hour', 'hourly', 60.00, true);

-- Update property types to match your business
-- First, let's add property type options to leads and properties
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_type_detail TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type_detail TEXT;

-- Add billing frequency options
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS billing_frequency TEXT DEFAULT 'one_time';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS service_frequency TEXT; -- weekly, biweekly, monthly, etc.

-- Add property size fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS unit_count INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS square_footage INTEGER;

-- Add service-specific fields to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS service_category_id TEXT REFERENCES service_categories(id);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS contract_duration_months INTEGER;

-- Add customizable scheduling fields
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS visits_per_week INTEGER;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS visits_per_month INTEGER;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS custom_schedule_notes TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS visit_duration_hours DECIMAL(4,2);

-- Update existing proposals to have a default service category
UPDATE proposals SET service_category_id = 'maintenance' WHERE service_category_id IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposals_service_category ON proposals(service_category_id);
CREATE INDEX IF NOT EXISTS idx_properties_unit_count ON properties(unit_count);
CREATE INDEX IF NOT EXISTS idx_properties_square_footage ON properties(square_footage);
