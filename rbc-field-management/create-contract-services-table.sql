-- Create contract_services table to store services linked to contracts
CREATE TABLE IF NOT EXISTS contract_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  service_type_id UUID REFERENCES service_categories(id),
  service_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  recurrence_type TEXT,
  recurrence_days INTEGER[],
  dsny_integration BOOLEAN DEFAULT FALSE,
  garbage_schedule INTEGER[],
  recycling_schedule INTEGER[],
  organics_schedule INTEGER[],
  bulk_schedule INTEGER[],
  interior_cleaning_schedule INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contract_services_contract_id ON contract_services(contract_id);

