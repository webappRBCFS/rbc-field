-- Quick fix: Add missing columns to leads table
-- Run this in Supabase SQL Editor

-- Add company fields
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_address TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_website TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_phone TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_email TEXT;

-- Add contacts as JSONB array
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]';

-- Add projects as JSONB array
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]';

-- Add lead notes as JSONB array with timestamps
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_notes JSONB DEFAULT '[]';

-- Add next activity date
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS next_activity_date DATE;

-- Update existing leads to have empty arrays
UPDATE leads
SET contacts = COALESCE(contacts, '[]'),
    projects = COALESCE(projects, '[]'),
    lead_notes = COALESCE(lead_notes, '[]')
WHERE contacts IS NULL OR projects IS NULL OR lead_notes IS NULL;

-- Create index on next_activity_date for efficient sorting
CREATE INDEX IF NOT EXISTS idx_leads_next_activity_date ON leads(next_activity_date);

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('company_address', 'company_website', 'company_phone', 'company_email', 'contacts', 'projects', 'lead_notes', 'next_activity_date')
ORDER BY column_name;
