-- Quick fix for proposals table - add missing columns
-- Run this in your Supabase SQL editor

-- Add customer_id and property_id columns to proposals table if they don't exist
DO $$
BEGIN
    -- Add customer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'proposals' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE proposals ADD COLUMN customer_id UUID;
    END IF;

    -- Add property_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'proposals' AND column_name = 'property_id'
    ) THEN
        ALTER TABLE proposals ADD COLUMN property_id UUID;
    END IF;
END $$;

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT,
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table if it doesn't exist
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  property_type TEXT,
  sqft INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit_type TEXT NOT NULL DEFAULT 'flat_rate',
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proposal_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS proposal_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO customers (company_name, contact_first_name, contact_last_name, email, phone) VALUES
('ABC Corporation', 'John', 'Smith', 'john.smith@abccorp.com', '(555) 123-4567'),
('XYZ Industries', 'Sarah', 'Johnson', 'sarah.j@xyzind.com', '(555) 234-5678'),
('Tech Solutions Inc', 'Mike', 'Davis', 'mike.davis@techsol.com', '(555) 345-6789'),
('Global Services', 'Lisa', 'Wilson', 'lisa.wilson@globalserv.com', '(555) 456-7890'),
('Premier Properties', 'David', 'Brown', 'david.brown@premierprop.com', '(555) 567-8901')
ON CONFLICT DO NOTHING;

INSERT INTO properties (customer_id, name, address, city, state, property_type, sqft)
SELECT c.id, 'Main Office', '123 Business St', 'New York', 'NY', 'Office Building', 5000
FROM customers c
WHERE c.company_name = 'ABC Corporation'
ON CONFLICT DO NOTHING;

INSERT INTO service_categories (name, description) VALUES
('Cleaning Services', 'General cleaning and maintenance services'),
('Landscaping', 'Outdoor maintenance and landscaping services'),
('Maintenance', 'General maintenance and repair services'),
('Security', 'Security and monitoring services'),
('Specialized Services', 'Custom and specialized service offerings')
ON CONFLICT DO NOTHING;

INSERT INTO service_items (category_id, name, description, unit_type, base_price)
SELECT sc.id, 'Office Deep Clean', 'Complete office cleaning', 'per_sqft', 0.15
FROM service_categories sc WHERE sc.name = 'Cleaning Services'
ON CONFLICT DO NOTHING;

INSERT INTO proposal_templates (name, description) VALUES
('Standard Cleaning Proposal', 'Basic cleaning service proposal template'),
('Comprehensive Maintenance', 'Full maintenance service proposal template'),
('Landscaping Services', 'Landscaping and outdoor maintenance proposal'),
('Custom Project', 'Custom project proposal template')
ON CONFLICT DO NOTHING;
