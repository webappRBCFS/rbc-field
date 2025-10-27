-- Setup tables and sample data for proposal system
-- Run this in your Supabase SQL editor

-- Disable RLS for development
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proposal_templates DISABLE ROW LEVEL SECURITY;

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

-- Insert sample customers
INSERT INTO customers (id, company_name, contact_first_name, contact_last_name, email, phone, address, city, state, zip_code) VALUES
('11111111-1111-1111-1111-111111111111', 'ABC Corporation', 'John', 'Smith', 'john.smith@abccorp.com', '(555) 123-4567', '123 Business Ave', 'New York', 'NY', '10001'),
('22222222-2222-2222-2222-222222222222', 'XYZ Industries', 'Sarah', 'Johnson', 'sarah.j@xyzind.com', '(555) 234-5678', '456 Industrial Blvd', 'Los Angeles', 'CA', '90210'),
('33333333-3333-3333-3333-333333333333', 'Tech Solutions Inc', 'Mike', 'Davis', 'mike.davis@techsol.com', '(555) 345-6789', '789 Tech Park', 'Chicago', 'IL', '60601'),
('44444444-4444-4444-4444-444444444444', 'Global Services', 'Lisa', 'Wilson', 'lisa.wilson@globalserv.com', '(555) 456-7890', '321 Service St', 'Houston', 'TX', '77001'),
('55555555-5555-5555-5555-555555555555', 'Premier Properties', 'David', 'Brown', 'david.brown@premierprop.com', '(555) 567-8901', '654 Property Lane', 'Phoenix', 'AZ', '85001')
ON CONFLICT (id) DO NOTHING;

-- Insert sample properties
INSERT INTO properties (id, customer_id, name, address, city, state, zip_code, property_type, sqft) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'ABC Corp Headquarters', '123 Business Ave', 'New York', 'NY', '10001', 'Office Building', 50000),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ABC Corp Warehouse', '124 Business Ave', 'New York', 'NY', '10001', 'Warehouse', 25000),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'XYZ Manufacturing Plant', '456 Industrial Blvd', 'Los Angeles', 'CA', '90210', 'Manufacturing', 75000),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'Tech Solutions Office', '789 Tech Park', 'Chicago', 'IL', '60601', 'Office Building', 30000),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', 'Global Services Center', '321 Service St', 'Houston', 'TX', '77001', 'Office Building', 40000),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '55555555-5555-5555-5555-555555555555', 'Premier Office Complex', '654 Property Lane', 'Phoenix', 'AZ', '85001', 'Office Building', 60000)
ON CONFLICT (id) DO NOTHING;

-- Insert sample service categories
INSERT INTO service_categories (id, name, description) VALUES
('cat11111-1111-1111-1111-111111111111', 'Cleaning Services', 'General cleaning and maintenance services'),
('cat22222-2222-2222-2222-222222222222', 'Landscaping', 'Outdoor maintenance and landscaping services'),
('cat33333-3333-3333-3333-333333333333', 'Maintenance', 'General maintenance and repair services'),
('cat44444-4444-4444-4444-444444444444', 'Security', 'Security and monitoring services'),
('cat55555-5555-5555-5555-555555555555', 'Specialized Services', 'Custom and specialized service offerings')
ON CONFLICT (id) DO NOTHING;

-- Insert sample service items
INSERT INTO service_items (id, category_id, name, description, unit_type, base_price) VALUES
-- Cleaning Services
('item1111-1111-1111-1111-111111111111', 'cat11111-1111-1111-1111-111111111111', 'Office Deep Clean', 'Complete office cleaning including floors, windows, and surfaces', 'per_sqft', 0.15),
('item2222-2222-2222-2222-222222222222', 'cat11111-1111-1111-1111-111111111111', 'Daily Maintenance Clean', 'Regular daily cleaning service', 'per_sqft', 0.08),
('item3333-3333-3333-3333-333333333333', 'cat11111-1111-1111-1111-111111111111', 'Carpet Cleaning', 'Professional carpet cleaning and stain removal', 'per_sqft', 0.25),
('item4444-4444-4444-4444-444444444444', 'cat11111-1111-1111-1111-111111111111', 'Window Cleaning', 'Interior and exterior window cleaning', 'per_window', 15.00),

-- Landscaping
('item5555-5555-5555-5555-555555555555', 'cat22222-2222-2222-2222-222222222222', 'Lawn Maintenance', 'Regular lawn mowing and trimming', 'per_sqft', 0.05),
('item6666-6666-6666-6666-666666666666', 'cat22222-2222-2222-2222-222222222222', 'Tree Trimming', 'Professional tree trimming and pruning', 'per_tree', 75.00),
('item7777-7777-7777-7777-777777777777', 'cat22222-2222-2222-2222-222222222222', 'Garden Maintenance', 'Seasonal garden care and plant maintenance', 'per_sqft', 0.12),

-- Maintenance
('item8888-8888-8888-8888-888888888888', 'cat33333-3333-3333-3333-333333333333', 'HVAC Maintenance', 'Heating and cooling system maintenance', 'per_unit', 150.00),
('item9999-9999-9999-9999-999999999999', 'cat33333-3333-3333-3333-333333333333', 'Electrical Inspection', 'Electrical system inspection and minor repairs', 'per_hour', 85.00),
('itemaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cat33333-3333-3333-3333-333333333333', 'Plumbing Service', 'Plumbing maintenance and repair services', 'per_hour', 95.00),

-- Security
('itembbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cat44444-4444-4444-4444-444444444444', 'Security Patrol', 'Regular security patrol and monitoring', 'per_hour', 45.00),
('itemcccc-cccc-cccc-cccc-cccccccccccc', 'cat44444-4444-4444-4444-444444444444', 'Access Control', 'Access control system maintenance', 'per_month', 200.00),

-- Specialized Services
('itemdddd-dddd-dddd-dddd-dddddddddddd', 'cat55555-5555-5555-5555-555555555555', 'Event Setup', 'Special event setup and breakdown', 'per_event', 500.00),
('itemeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cat55555-5555-5555-5555-555555555555', 'Custom Project', 'Custom project pricing', 'flat_rate', 0.00)
ON CONFLICT (id) DO NOTHING;

-- Insert sample proposal templates
INSERT INTO proposal_templates (id, name, description, template_data) VALUES
('templ1111-1111-1111-1111-111111111111', 'Standard Cleaning Proposal', 'Basic cleaning service proposal template', '{"sections": ["Overview", "Services", "Pricing", "Terms"], "default_terms": "Payment terms: Net 30 days\nService frequency: As specified\nContract term: 12 months"}'),
('templ2222-2222-2222-2222-222222222222', 'Comprehensive Maintenance', 'Full maintenance service proposal template', '{"sections": ["Overview", "Services", "Schedule", "Pricing", "Terms"], "default_terms": "Payment terms: Net 30 days\nService frequency: Monthly\nContract term: 24 months"}'),
('templ3333-3333-3333-3333-333333333333', 'Landscaping Services', 'Landscaping and outdoor maintenance proposal', '{"sections": ["Overview", "Services", "Seasonal Schedule", "Pricing", "Terms"], "default_terms": "Payment terms: Net 30 days\nService frequency: Weekly\nContract term: 12 months"}'),
('templ4444-4444-4444-4444-444444444444', 'Custom Project', 'Custom project proposal template', '{"sections": ["Project Overview", "Scope of Work", "Timeline", "Pricing", "Terms"], "default_terms": "Payment terms: 50% upfront, 50% on completion\nProject timeline: As specified\nWarranty: 90 days"}')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_customer_id ON properties(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_items_category_id ON service_items(category_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_customers_contact_name ON customers(contact_first_name, contact_last_name);

-- Update proposals table to include customer_id and property_id if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proposals' AND column_name = 'customer_id') THEN
        ALTER TABLE proposals ADD COLUMN customer_id UUID REFERENCES customers(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proposals' AND column_name = 'property_id') THEN
        ALTER TABLE proposals ADD COLUMN property_id UUID REFERENCES properties(id);
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON customers TO authenticated;
GRANT ALL ON properties TO authenticated;
GRANT ALL ON service_categories TO authenticated;
GRANT ALL ON service_items TO authenticated;
GRANT ALL ON proposal_templates TO authenticated;

-- Enable RLS (optional - comment out if you want to disable for development)
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
