-- Ultra Minimal Database Setup Script
-- This script only creates missing tables and test data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
DO $$ BEGIN
    CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'job_created');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled', 'pending_review');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lead_sources table
CREATE TABLE IF NOT EXISTS lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create operational_divisions table
CREATE TABLE IF NOT EXISTS operational_divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT,
    contact_first_name TEXT,
    contact_last_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    property_type TEXT,
    sqft INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service_categories table
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    operational_division_id UUID REFERENCES operational_divisions(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    property_id UUID REFERENCES properties(id),
    service_category_id UUID REFERENCES service_categories(id),
    proposal_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    status proposal_status DEFAULT 'draft',
    total_amount DECIMAL(10,2),
    valid_until DATE,
    notes TEXT,
    terms_conditions TEXT,
    visit_duration_hours DECIMAL(5,2),
    billing_frequency TEXT,
    service_frequency TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    service_type TEXT,
    scheduled_date DATE,
    scheduled_start_time TIME,
    scheduled_end_time TIME,
    estimated_duration DECIMAL(5,2),
    status job_status DEFAULT 'draft',
    priority job_priority DEFAULT 'medium',
    quoted_amount DECIMAL(10,2),
    customer_id UUID REFERENCES customers(id),
    property_id UUID REFERENCES properties(id),
    proposal_id UUID REFERENCES proposals(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test data using existing service categories
-- First, let's get the first service category ID
WITH first_service AS (
  SELECT id FROM service_categories LIMIT 1
)
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

-- Create test approved proposals using existing service category
WITH first_service AS (
  SELECT id FROM service_categories LIMIT 1
)
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
SELECT
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    id,
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
FROM first_service
ON CONFLICT (id) DO NOTHING;

WITH first_service AS (
  SELECT id FROM service_categories LIMIT 1
)
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
SELECT
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    id,
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
FROM first_service
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
SELECT 'Tables created:' as info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('proposals', 'customers', 'properties', 'service_categories', 'jobs', 'operational_divisions')
ORDER BY table_name;

SELECT 'Approved Proposals:' as info;
SELECT
    p.id,
    p.proposal_number,
    p.title,
    p.status,
    p.total_amount,
    c.company_name,
    pr.name as property_name,
    sc.name as service_category
FROM proposals p
LEFT JOIN customers c ON p.customer_id = c.id
LEFT JOIN properties pr ON p.property_id = pr.id
LEFT JOIN service_categories sc ON p.service_category_id = sc.id
WHERE p.status = 'approved';
