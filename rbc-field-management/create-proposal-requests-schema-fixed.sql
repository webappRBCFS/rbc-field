-- Create proposal_requests table for customer/lead proposal submissions
-- This allows customers and leads to submit proposal requests with project details

CREATE TABLE IF NOT EXISTS proposal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_type VARCHAR(100), -- e.g., 'deep_clean', 'maintenance', 'post_construction', 'landscaping'
  property_address TEXT NOT NULL,
  property_city VARCHAR(100),
  property_state VARCHAR(50),
  property_zip VARCHAR(20),
  property_type VARCHAR(50), -- e.g., 'residential', 'commercial', 'multi_unit'
  square_footage INTEGER,
  estimated_budget DECIMAL(10,2),
  preferred_start_date DATE,
  preferred_completion_date DATE,
  urgency_level VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  special_requirements TEXT,
  accessibility_needs TEXT,
  existing_contractor BOOLEAN DEFAULT FALSE,
  contractor_details TEXT,

  -- Contact Information
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  company_name VARCHAR(255),

  -- Lead/Customer Association
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

  -- Status and Processing
  status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'reviewing', 'quoted', 'converted', 'declined'
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  internal_notes TEXT,

  -- File Attachments (stored as JSONB array)
  attachments JSONB DEFAULT '[]', -- Array of {name, url, type, size, uploaded_at}

  -- Blueprint Links
  blueprint_links JSONB DEFAULT '[]', -- Array of {title, url, description}

  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  quoted_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposal_requests_status ON proposal_requests(status);
CREATE INDEX IF NOT EXISTS idx_proposal_requests_submitted_at ON proposal_requests(submitted_at);
CREATE INDEX IF NOT EXISTS idx_proposal_requests_lead_id ON proposal_requests(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposal_requests_customer_id ON proposal_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_proposal_requests_assigned_to ON proposal_requests(assigned_to);

-- Create RLS policies
ALTER TABLE proposal_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all proposal requests
CREATE POLICY "Users can view all proposal requests" ON proposal_requests
  FOR SELECT USING (true);

-- Policy: Users can insert proposal requests
CREATE POLICY "Users can insert proposal requests" ON proposal_requests
  FOR INSERT WITH CHECK (true);

-- Policy: Users can update proposal requests
CREATE POLICY "Users can update proposal requests" ON proposal_requests
  FOR UPDATE USING (true);

-- Policy: Users can delete proposal requests
CREATE POLICY "Users can delete proposal requests" ON proposal_requests
  FOR DELETE USING (true);

-- Function to auto-generate request numbers
CREATE OR REPLACE FUNCTION generate_proposal_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    NEW.request_number := 'PR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::INTEGER % 100000, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate request numbers
CREATE TRIGGER trigger_generate_proposal_request_number
  BEFORE INSERT ON proposal_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_proposal_request_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_proposal_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE TRIGGER trigger_update_proposal_requests_updated_at
  BEFORE UPDATE ON proposal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_requests_updated_at();

-- Add comments for documentation
COMMENT ON TABLE proposal_requests IS 'Customer and lead proposal requests with project details and attachments';
COMMENT ON COLUMN proposal_requests.request_number IS 'Auto-generated unique request number';
COMMENT ON COLUMN proposal_requests.project_type IS 'Type of project requested';
COMMENT ON COLUMN proposal_requests.urgency_level IS 'Priority level of the request';
COMMENT ON COLUMN proposal_requests.attachments IS 'JSONB array of file attachments';
COMMENT ON COLUMN proposal_requests.blueprint_links IS 'JSONB array of blueprint/document links';
COMMENT ON COLUMN proposal_requests.status IS 'Current status of the proposal request';
