-- Test Data Creation Script (Operational Divisions Already Exist)
-- This script creates test data assuming operational divisions already exist

-- Check what operational divisions exist
SELECT 'Existing operational divisions:' as info;
SELECT id, name, code FROM operational_divisions ORDER BY name;

-- Create test service categories using existing operational divisions
-- First, let's get the IDs of existing divisions
WITH division_ids AS (
  SELECT
    id as maint_id,
    (SELECT id FROM operational_divisions WHERE code = 'OFFICE' LIMIT 1) as office_id,
    (SELECT id FROM operational_divisions WHERE code = 'POSTCON' LIMIT 1) as postcon_id
  FROM operational_divisions
  WHERE code = 'MAINT'
  LIMIT 1
)
INSERT INTO service_categories (id, name, description, operational_division_id, is_active)
SELECT
  '550e8400-e29b-41d4-a716-446655440003',
  'Office Cleaning',
  'Regular office cleaning services',
  office_id,
  true
FROM division_ids
WHERE office_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

WITH division_ids AS (
  SELECT
    id as maint_id,
    (SELECT id FROM operational_divisions WHERE code = 'OFFICE' LIMIT 1) as office_id,
    (SELECT id FROM operational_divisions WHERE code = 'POSTCON' LIMIT 1) as postcon_id
  FROM operational_divisions
  WHERE code = 'MAINT'
  LIMIT 1
)
INSERT INTO service_categories (id, name, description, operational_division_id, is_active)
SELECT
  '550e8400-e29b-41d4-a716-446655440006',
  'Maintenance',
  'Janitorial maintenance services',
  maint_id,
  true
FROM division_ids
WHERE maint_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

WITH division_ids AS (
  SELECT
    id as maint_id,
    (SELECT id FROM operational_divisions WHERE code = 'OFFICE' LIMIT 1) as office_id,
    (SELECT id FROM operational_divisions WHERE code = 'POSTCON' LIMIT 1) as postcon_id
  FROM operational_divisions
  WHERE code = 'MAINT'
  LIMIT 1
)
INSERT INTO service_categories (id, name, description, operational_division_id, is_active)
SELECT
  '550e8400-e29b-41d4-a716-446655440007',
  'Post-Construction',
  'Post-construction cleanup',
  postcon_id,
  true
FROM division_ids
WHERE postcon_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Create test customer
INSERT INTO customers (id, company_name, contact_first_name, contact_last_name, email, phone, address, city, state, zip_code)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Test Corporation',
  'John',
  'Doe',
  'john@testcorp.com',
  '555-0123',
  '123 Test Street',
  'Test City',
  'TS',
  '12345'
)
ON CONFLICT (id) DO NOTHING;

-- Create test property
INSERT INTO properties (id, customer_id, name, address, city, state, zip_code, property_type, sqft)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  'Test Office Building',
  '123 Test Street',
  'Test City',
  'TS',
  '12345',
  'Office',
  5000
)
ON CONFLICT (id) DO NOTHING;

-- Create test approved proposals
INSERT INTO proposals (
  id,
  customer_id,
  property_id,
  service_category_id,
  proposal_number,
  title,
  status,
  total_amount,
  valid_until,
  notes,
  terms_conditions,
  visit_duration_hours,
  billing_frequency,
  service_frequency
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  'PROP-0001',
  'Monthly Office Cleaning Service',
  'approved',
  2500.00,
  '2024-12-31',
  'Monthly cleaning service for office building',
  'Payment terms: Net 30 days',
  4.0,
  'Monthly',
  'Weekly'
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  'PROP-0002',
  'Deep Clean Service',
  'approved',
  1500.00,
  '2024-12-31',
  'One-time deep cleaning service',
  'Payment terms: Net 30 days',
  8.0,
  'Per Project',
  'One-time'
)
ON CONFLICT (id) DO NOTHING;

-- Create test admin user
INSERT INTO user_profiles (id, email, first_name, last_name, role)
VALUES (
  '550e8400-e29b-41d4-a716-446655440008',
  'admin@rbcfield.com',
  'Admin',
  'User',
  'admin'
)
ON CONFLICT (id) DO NOTHING;

-- Check the results
SELECT 'Setup Complete!' as status;
SELECT 'Approved Proposals:' as info;
SELECT
  p.id,
  p.proposal_number,
  p.title,
  p.status,
  p.total_amount,
  c.company_name,
  pr.name as property_name
FROM proposals p
LEFT JOIN customers c ON p.customer_id = c.id
LEFT JOIN properties pr ON p.property_id = pr.id
WHERE p.status = 'approved';
