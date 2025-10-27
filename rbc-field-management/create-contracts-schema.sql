-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Relationships
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,

  -- Contract Details
  contract_type VARCHAR(50) NOT NULL DEFAULT 'one_time', -- 'one_time', 'recurring'
  service_type VARCHAR(100),

  -- Pricing
  total_amount DECIMAL(10,2),
  billing_frequency VARCHAR(50), -- 'one_time', 'weekly', 'bi_weekly', 'monthly', 'quarterly', 'annually'

  -- Schedule (for recurring contracts)
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_type VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'custom'
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_days INTEGER[], -- Array of day numbers (0=Sunday, 1=Monday, etc.)
  recurrence_end_date DATE,
  recurrence_end_count INTEGER,

  -- DSNY Integration (for maintenance contracts)
  dsny_integration BOOLEAN DEFAULT FALSE,
  dsny_pickup_days VARCHAR(50)[],
  dsny_collection_types VARCHAR(50)[],
  interior_cleaning_schedule VARCHAR(50)[],

  -- Status and Dates
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed', 'cancelled'
  start_date DATE,
  end_date DATE,
  signed_date DATE,

  -- Terms
  payment_terms VARCHAR(100),
  late_fee_percentage DECIMAL(5,2) DEFAULT 0,
  cancellation_terms TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create contract status enum
DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM (
    'draft',
    'pending_signature',
    'active',
    'paused',
    'completed',
    'cancelled',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update contracts table to use enum
ALTER TABLE contracts
ALTER COLUMN status TYPE contract_status USING status::contract_status;

-- Create contract types enum
DO $$ BEGIN
  CREATE TYPE contract_type AS ENUM (
    'one_time',
    'recurring'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update contracts table to use enum
ALTER TABLE contracts
ALTER COLUMN contract_type TYPE contract_type USING contract_type::contract_type;

-- Create billing frequency enum
DO $$ BEGIN
  CREATE TYPE billing_frequency AS ENUM (
    'one_time',
    'weekly',
    'bi_weekly',
    'monthly',
    'quarterly',
    'annually',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update contracts table to use enum
ALTER TABLE contracts
ALTER COLUMN billing_frequency TYPE billing_frequency USING billing_frequency::billing_frequency;

-- Create recurrence type enum
DO $$ BEGIN
  CREATE TYPE recurrence_type AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update contracts table to use enum
ALTER TABLE contracts
ALTER COLUMN recurrence_type TYPE recurrence_type USING recurrence_type::recurrence_type;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_property_id ON contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_proposal_id ON contracts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);

-- Add RLS policies
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read contracts
CREATE POLICY "Users can view contracts" ON contracts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert contracts
CREATE POLICY "Users can insert contracts" ON contracts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update contracts
CREATE POLICY "Users can update contracts" ON contracts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete contracts
CREATE POLICY "Users can delete contracts" ON contracts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();

-- Add contract number generation function
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

-- Add default contract number trigger
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

-- Update jobs table to reference contracts
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- Add index for contract_id in jobs
CREATE INDEX IF NOT EXISTS idx_jobs_contract_id ON jobs(contract_id);

-- Add contract generation function
CREATE OR REPLACE FUNCTION generate_jobs_from_contract(contract_uuid UUID)
RETURNS TABLE(job_id UUID) AS $$
DECLARE
  contract_record contracts%ROWTYPE;
  job_record jobs%ROWTYPE;
  current_date DATE;
  end_date DATE;
  day_names TEXT[] := ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  day_name TEXT;
  job_count INTEGER := 0;
BEGIN
  -- Get contract details
  SELECT * INTO contract_record FROM contracts WHERE id = contract_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found: %', contract_uuid;
  END IF;

  -- Only generate jobs for recurring contracts
  IF NOT contract_record.is_recurring THEN
    RAISE EXCEPTION 'Contract is not recurring: %', contract_uuid;
  END IF;

  -- Set date range
  current_date := COALESCE(contract_record.start_date, CURRENT_DATE);
  end_date := COALESCE(contract_record.recurrence_end_date, current_date + INTERVAL '1 year');

  -- Generate jobs based on recurrence
  WHILE current_date <= end_date AND (contract_record.recurrence_end_count IS NULL OR job_count < contract_record.recurrence_end_count) LOOP
    -- Check if current date matches recurrence pattern
    IF contract_record.recurrence_type = 'daily' THEN
      -- Daily recurrence
      INSERT INTO jobs (
        job_number,
        title,
        description,
        service_type,
        customer_id,
        property_id,
        contract_id,
        proposal_id,
        scheduled_date,
        quoted_amount,
        status,
        priority,
        notes,
        is_recurring,
        recurrence_type,
        recurrence_days,
        dsny_integration,
        dsny_pickup_days,
        dsny_collection_types,
        interior_cleaning_schedule,
        created_at,
        updated_at
      ) VALUES (
        'JOB-' || LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 'JOB-(\d+)') AS INTEGER)), 0) + 1 FROM jobs WHERE job_number ~ '^JOB-\d+$'), 4, '0'),
        contract_record.title || ' - ' || current_date,
        contract_record.description,
        contract_record.service_type,
        contract_record.customer_id,
        contract_record.property_id,
        contract_record.id,
        contract_record.proposal_id,
        current_date,
        contract_record.total_amount,
        'scheduled',
        'medium',
        contract_record.notes,
        TRUE,
        contract_record.recurrence_type,
        contract_record.recurrence_days,
        contract_record.dsny_integration,
        contract_record.dsny_pickup_days,
        contract_record.dsny_collection_types,
        contract_record.interior_cleaning_schedule,
        NOW(),
        NOW()
      ) RETURNING id INTO job_record.id;

      job_count := job_count + 1;
      current_date := current_date + INTERVAL '1 day';

    ELSIF contract_record.recurrence_type = 'weekly' THEN
      -- Weekly recurrence
      IF EXTRACT(DOW FROM current_date) = ANY(contract_record.recurrence_days) THEN
        INSERT INTO jobs (
          job_number,
          title,
          description,
          service_type,
          customer_id,
          property_id,
          contract_id,
          proposal_id,
          scheduled_date,
          quoted_amount,
          status,
          priority,
          notes,
          is_recurring,
          recurrence_type,
          recurrence_days,
          dsny_integration,
          dsny_pickup_days,
          dsny_collection_types,
          interior_cleaning_schedule,
          created_at,
          updated_at
        ) VALUES (
          'JOB-' || LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 'JOB-(\d+)') AS INTEGER)), 0) + 1 FROM jobs WHERE job_number ~ '^JOB-\d+$'), 4, '0'),
          contract_record.title || ' - ' || current_date,
          contract_record.description,
          contract_record.service_type,
          contract_record.customer_id,
          contract_record.property_id,
          contract_record.id,
          contract_record.proposal_id,
          current_date,
          contract_record.total_amount,
          'scheduled',
          'medium',
          contract_record.notes,
          TRUE,
          contract_record.recurrence_type,
          contract_record.recurrence_days,
          contract_record.dsny_integration,
          contract_record.dsny_pickup_days,
          contract_record.dsny_collection_types,
          contract_record.interior_cleaning_schedule,
          NOW(),
          NOW()
        ) RETURNING id INTO job_record.id;

        job_count := job_count + 1;
      END IF;
      current_date := current_date + INTERVAL '1 day';

    ELSIF contract_record.recurrence_type = 'monthly' THEN
      -- Monthly recurrence (simplified - first day of month)
      IF EXTRACT(DAY FROM current_date) = 1 THEN
        INSERT INTO jobs (
          job_number,
          title,
          description,
          service_type,
          customer_id,
          property_id,
          contract_id,
          proposal_id,
          scheduled_date,
          quoted_amount,
          status,
          priority,
          notes,
          is_recurring,
          recurrence_type,
          recurrence_days,
          dsny_integration,
          dsny_pickup_days,
          dsny_collection_types,
          interior_cleaning_schedule,
          created_at,
          updated_at
        ) VALUES (
          'JOB-' || LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 'JOB-(\d+)') AS INTEGER)), 0) + 1 FROM jobs WHERE job_number ~ '^JOB-\d+$'), 4, '0'),
          contract_record.title || ' - ' || current_date,
          contract_record.description,
          contract_record.service_type,
          contract_record.customer_id,
          contract_record.property_id,
          contract_record.id,
          contract_record.proposal_id,
          current_date,
          contract_record.total_amount,
          'scheduled',
          'medium',
          contract_record.notes,
          TRUE,
          contract_record.recurrence_type,
          contract_record.recurrence_days,
          contract_record.dsny_integration,
          contract_record.dsny_pickup_days,
          contract_record.dsny_collection_types,
          contract_record.interior_cleaning_schedule,
          NOW(),
          NOW()
        ) RETURNING id INTO job_record.id;

        job_count := job_count + 1;
      END IF;
      current_date := current_date + INTERVAL '1 month';

    ELSIF contract_record.recurrence_type = 'custom' THEN
      -- Custom recurrence based on recurrence_days
      IF EXTRACT(DOW FROM current_date) = ANY(contract_record.recurrence_days) THEN
        INSERT INTO jobs (
          job_number,
          title,
          description,
          service_type,
          customer_id,
          property_id,
          contract_id,
          proposal_id,
          scheduled_date,
          quoted_amount,
          status,
          priority,
          notes,
          is_recurring,
          recurrence_type,
          recurrence_days,
          dsny_integration,
          dsny_pickup_days,
          dsny_collection_types,
          interior_cleaning_schedule,
          created_at,
          updated_at
        ) VALUES (
          'JOB-' || LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 'JOB-(\d+)') AS INTEGER)), 0) + 1 FROM jobs WHERE job_number ~ '^JOB-\d+$'), 4, '0'),
          contract_record.title || ' - ' || current_date,
          contract_record.description,
          contract_record.service_type,
          contract_record.customer_id,
          contract_record.property_id,
          contract_record.id,
          contract_record.proposal_id,
          current_date,
          contract_record.total_amount,
          'scheduled',
          'medium',
          contract_record.notes,
          TRUE,
          contract_record.recurrence_type,
          contract_record.recurrence_days,
          contract_record.dsny_integration,
          contract_record.dsny_pickup_days,
          contract_record.dsny_collection_types,
          contract_record.interior_cleaning_schedule,
          NOW(),
          NOW()
        ) RETURNING id INTO job_record.id;

        job_count := job_count + 1;
      END IF;
      current_date := current_date + INTERVAL '1 day';
    END IF;
  END LOOP;

  RETURN QUERY SELECT job_record.id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample contracts
INSERT INTO contracts (
  id,
  contract_number,
  title,
  description,
  proposal_id,
  customer_id,
  property_id,
  contract_type,
  service_type,
  total_amount,
  billing_frequency,
  is_recurring,
  recurrence_type,
  recurrence_days,
  status,
  start_date,
  end_date,
  payment_terms,
  notes
) VALUES
(
  gen_random_uuid(),
  'CONTRACT-0001',
  'Monthly Office Cleaning - ABC Corp',
  'Regular monthly office cleaning services',
  (SELECT id FROM proposals WHERE status = 'approved' LIMIT 1),
  (SELECT id FROM customers LIMIT 1),
  (SELECT id FROM properties LIMIT 1),
  'recurring',
  'Office Cleaning',
  2500.00,
  'monthly',
  TRUE,
  'custom',
  ARRAY[1, 3, 5], -- Monday, Wednesday, Friday
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  'Net 30',
  'Monthly office cleaning contract'
),
(
  gen_random_uuid(),
  'CONTRACT-0002',
  'Weekly Maintenance - XYZ Industries',
  'Weekly maintenance services with DSNY integration',
  (SELECT id FROM proposals WHERE status = 'approved' LIMIT 1),
  (SELECT id FROM customers WHERE company_name = 'XYZ Industries' LIMIT 1),
  (SELECT id FROM properties WHERE customer_id = (SELECT id FROM customers WHERE company_name = 'XYZ Industries' LIMIT 1) LIMIT 1),
  'recurring',
  'Maintenance',
  1800.00,
  'weekly',
  TRUE,
  'custom',
  ARRAY[1, 2, 3, 4, 5], -- Monday through Friday
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '6 months',
  'Net 15',
  'Weekly maintenance with DSNY pickup schedule integration'
)
ON CONFLICT (contract_number) DO NOTHING;
