-- Step 1: Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  contract_type VARCHAR(50) NOT NULL DEFAULT 'one_time',
  service_type VARCHAR(100),
  total_amount DECIMAL(10,2),
  billing_frequency VARCHAR(50),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_type VARCHAR(50),
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_days INTEGER[],
  recurrence_end_date DATE,
  recurrence_end_count INTEGER,
  dsny_integration BOOLEAN DEFAULT FALSE,
  dsny_pickup_days VARCHAR(50)[],
  dsny_collection_types VARCHAR(50)[],
  interior_cleaning_schedule VARCHAR(50)[],
  status VARCHAR(50) DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  signed_date DATE,
  payment_terms VARCHAR(100),
  late_fee_percentage DECIMAL(5,2) DEFAULT 0,
  cancellation_terms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add contract_id to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- Step 3: Add indexes
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_property_id ON contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_proposal_id ON contracts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_jobs_contract_id ON jobs(contract_id);

-- Step 4: Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "Users can view contracts" ON contracts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert contracts" ON contracts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update contracts" ON contracts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete contracts" ON contracts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Step 6: Add contract number generation
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 'CONTRACT-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM contracts
  WHERE contract_number ~ '^CONTRACT-\d+$';

  RETURN 'CONTRACT-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add trigger for auto-generating contract numbers
CREATE OR REPLACE FUNCTION set_default_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number = generate_contract_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_default_contract_number
  BEFORE INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION set_default_contract_number();
