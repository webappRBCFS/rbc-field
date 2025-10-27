-- Update leads table schema for new structure
-- This adds fields for company, contacts, projects, and lead management

-- Add company fields
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT;

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

-- Add comment to explain the columns
COMMENT ON COLUMN leads.contacts IS 'Array of contact objects with name, phone, cell, email';
COMMENT ON COLUMN leads.projects IS 'Array of project objects with type, address, unit_count, work_type, notes';
COMMENT ON COLUMN leads.lead_notes IS 'Array of time-stamped notes {timestamp, note}';
COMMENT ON COLUMN leads.next_activity_date IS 'Date for next activity - shown in lead list for sorting';

-- Update existing leads to have empty arrays for new columns
UPDATE leads
SET contacts = COALESCE(contacts, '[]'),
    projects = COALESCE(projects, '[]'),
    lead_notes = COALESCE(lead_notes, '[]')
WHERE contacts IS NULL OR projects IS NULL OR lead_notes IS NULL;

-- Create index on next_activity_date for efficient sorting
CREATE INDEX IF NOT EXISTS idx_leads_next_activity_date ON leads(next_activity_date);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('contacts', 'projects', 'lead_notes', 'next_activity_date', 'company_address', 'company_website');
