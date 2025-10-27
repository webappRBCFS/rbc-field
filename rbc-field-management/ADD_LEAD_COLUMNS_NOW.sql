-- ADD THESE COLUMNS TO LEADS TABLE
-- Run this in Supabase SQL Editor

-- Add company fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_website TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_email TEXT;

-- Add JSONB array fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_notes JSONB DEFAULT '[]'::jsonb;

-- Add next activity date field
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_activity_date DATE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_leads_next_activity_date ON leads(next_activity_date);

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('company_address', 'company_website', 'company_phone', 'company_email', 'contacts', 'projects', 'lead_notes', 'next_activity_date')
ORDER BY column_name;

