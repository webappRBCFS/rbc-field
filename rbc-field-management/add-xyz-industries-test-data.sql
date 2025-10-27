-- Add XYZ Industries customer and Brooklyn properties for DSNY testing
-- This script adds a test customer with 4 Brooklyn addresses for testing DSNY integration

-- First, ensure we have the necessary data
INSERT INTO customers (id, company_name, contact_first_name, contact_last_name, email, phone, address, city, state, zip_code)
VALUES (
  '550e8400-e29b-41d4-a716-446655440100',
  'XYZ Industries',
  'John',
  'Smith',
  'john.smith@xyzindustries.com',
  '(555) 123-4567',
  '123 Main Street',
  'Brooklyn',
  'NY',
  '11201'
) ON CONFLICT (id) DO NOTHING;

-- Add the 4 Brooklyn properties for XYZ Industries
INSERT INTO properties (
  id,
  customer_id,
  name,
  address,
  city,
  state,
  zip_code,
  property_type
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440101',
  '550e8400-e29b-41d4-a716-446655440100',
  '149 Skillman Street Building',
  '149 Skillman Street',
  'Brooklyn',
  'NY',
  '11205',
  'Residential Building'
),
(
  '550e8400-e29b-41d4-a716-446655440102',
  '550e8400-e29b-41d4-a716-446655440100',
  '195 Division Avenue Building',
  '195 Division Avenue',
  'Brooklyn',
  'NY',
  '11211',
  'Residential Building'
),
(
  '550e8400-e29b-41d4-a716-446655440103',
  '550e8400-e29b-41d4-a716-446655440100',
  '183 Wallabout Street Building',
  '183 Wallabout Street',
  'Brooklyn',
  'NY',
  '11206',
  'Residential Building'
),
(
  '550e8400-e29b-41d4-a716-446655440104',
  '550e8400-e29b-41d4-a716-446655440100',
  '670 Myrtle Avenue Building',
  '670 Myrtle Avenue',
  'Brooklyn',
  'NY',
  '11205',
  'Residential Building'
) ON CONFLICT (id) DO NOTHING;

-- Verify the data was inserted
SELECT
  c.company_name,
  c.contact_first_name,
  c.contact_last_name,
  p.name as property_name,
  p.address,
  p.city,
  p.state,
  p.zip_code,
  p.property_type
FROM customers c
JOIN properties p ON c.id = p.customer_id
WHERE c.company_name = 'XYZ Industries'
ORDER BY p.address;
