-- Add 'job_created' status to proposal_status enum
-- This allows us to track which proposals have been converted to jobs

-- First, let's add the new status to the enum
ALTER TYPE proposal_status ADD VALUE 'job_created';

-- Now let's create some test approved proposals for testing
-- Insert test customer if not exists
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

-- Insert test property if not exists
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

-- Insert test service category if not exists
INSERT INTO service_categories (id, name, description, division, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'Office Cleaning',
  'Regular office cleaning services',
  'Office Cleaning',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Insert test approved proposal
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
)
ON CONFLICT (id) DO NOTHING;

-- Insert another test approved proposal
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

-- Check the results
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
