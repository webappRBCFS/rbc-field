-- Add missing columns to customers table

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '[]'::jsonb;

-- Add index for active customers
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- Add index for assigned customers
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

