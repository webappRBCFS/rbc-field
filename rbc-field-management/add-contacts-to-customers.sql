-- Add contacts column to customers table

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

