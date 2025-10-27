-- Proposal System Database Schema
-- Run this in your Supabase SQL Editor

-- Service categories
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default service categories
INSERT INTO service_categories (name, description) VALUES
  ('Deep Cleaning', 'Comprehensive cleaning services for offices, warehouses, and facilities'),
  ('Maintenance', 'Regular ongoing cleaning and maintenance services'),
  ('Post-Construction', 'Specialized cleaning after construction or renovation'),
  ('Landscaping', 'Outdoor maintenance and landscaping services'),
  ('Specialty Services', 'Custom cleaning and maintenance solutions')
ON CONFLICT (name) DO NOTHING;

-- Service items (line items for proposals)
CREATE TABLE IF NOT EXISTS service_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES service_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  unit_type TEXT NOT NULL, -- 'per_sqft', 'per_hour', 'per_visit', 'per_month', 'flat_rate'
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default service items
INSERT INTO service_items (category_id, name, description, unit_type, base_price) VALUES
  ((SELECT id FROM service_categories WHERE name = 'Deep Cleaning'), 'Office Deep Clean', 'Complete office cleaning including floors, windows, restrooms', 'per_sqft', 0.15),
  ((SELECT id FROM service_categories WHERE name = 'Maintenance'), 'Daily Office Cleaning', 'Regular daily cleaning service', 'per_month', 500.00),
  ((SELECT id FROM service_categories WHERE name = 'Maintenance'), 'Weekly Warehouse Cleaning', 'Weekly cleaning of warehouse facilities', 'per_visit', 200.00),
  ((SELECT id FROM service_categories WHERE name = 'Post-Construction'), 'Post-Construction Cleanup', 'Specialized cleaning after construction', 'per_sqft', 0.25),
  ((SELECT id FROM service_categories WHERE name = 'Landscaping'), 'Monthly Landscaping', 'Regular landscaping maintenance', 'per_month', 300.00)
ON CONFLICT DO NOTHING;

-- Proposal templates
CREATE TABLE IF NOT EXISTS proposal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default proposal template
INSERT INTO proposal_templates (name, description, template_data) VALUES
  ('Standard Cleaning Proposal', 'Default template for cleaning services',
   '{"sections": [{"title": "Service Overview", "content": "We are pleased to provide you with a comprehensive cleaning proposal for your facility."}, {"title": "Scope of Work", "content": "Our services include:"}, {"title": "Pricing", "content": "Based on your requirements, we propose the following pricing:"}, {"title": "Terms & Conditions", "content": "Payment terms: Net 30 days\nService frequency: As specified\nContract term: 12 months"}]}'::jsonb);

-- Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  customer_id UUID, -- Will reference customers table when created
  template_id UUID REFERENCES proposal_templates(id),
  proposal_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'viewed', 'approved', 'rejected', 'expired'
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  terms_conditions TEXT,
  created_by UUID REFERENCES user_profiles(id),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal line items
CREATE TABLE IF NOT EXISTS proposal_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  service_item_id UUID REFERENCES service_items(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_type TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal activities (tracking)
CREATE TABLE IF NOT EXISTS proposal_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  activity_type TEXT NOT NULL, -- 'created', 'sent', 'viewed', 'approved', 'rejected', 'modified'
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for now (can be enabled later with proper policies)
ALTER TABLE service_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_line_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_activities DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_proposal_line_items_proposal_id ON proposal_line_items(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_activities_proposal_id ON proposal_activities(proposal_id);

-- Function to generate proposal numbers
CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  proposal_number TEXT;
BEGIN
  -- Get the next number
  SELECT COALESCE(MAX(CAST(SUBSTRING(proposal_number FROM 'PROP-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM proposals
  WHERE proposal_number ~ '^PROP-\d+$';

  -- Format as PROP-000001
  proposal_number := 'PROP-' || LPAD(next_number::TEXT, 6, '0');

  RETURN proposal_number;
END;
$$ LANGUAGE plpgsql;

-- Verify tables were created
SELECT 'Proposal system tables created successfully!' as status;
SELECT COUNT(*) as service_categories_count FROM service_categories;
SELECT COUNT(*) as service_items_count FROM service_items;
SELECT COUNT(*) as proposal_templates_count FROM proposal_templates;
