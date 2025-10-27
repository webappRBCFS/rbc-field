-- Complete SQL Migration for New Lead Structure
-- Run this ENTIRE script in Supabase SQL Editor
-- This will add all required columns properly

-- ===============================================
-- STEP 1: Add company fields
-- ===============================================
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_address TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_website TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_phone TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_email TEXT;

-- ===============================================
-- STEP 2: Add JSONB array fields (contacts, projects, lead_notes)
-- ===============================================
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_notes JSONB DEFAULT '[]'::jsonb;

-- ===============================================
-- STEP 3: Add next_activity_date field
-- ===============================================
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS next_activity_date DATE;

-- ===============================================
-- STEP 4: Update existing leads to have proper defaults
-- ===============================================
UPDATE leads
SET
  contacts = CASE
    WHEN contacts IS NULL OR contacts::text = 'null' THEN '[]'::jsonb
    ELSE contacts
  END,
  projects = CASE
    WHEN projects IS NULL OR projects::text = 'null' THEN '[]'::jsonb
    ELSE projects
  END,
  lead_notes = CASE
    WHEN lead_notes IS NULL OR lead_notes::text = 'null' THEN '[]'::jsonb
    ELSE lead_notes
  END
WHERE contacts IS NULL
   OR projects IS NULL
   OR lead_notes IS NULL
   OR contacts::text = 'null'
   OR projects::text = 'null'
   OR lead_notes::text = 'null';

-- ===============================================
-- STEP 5: Create indexes for performance
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_leads_next_activity_date
ON leads(next_activity_date);

CREATE INDEX IF NOT EXISTS idx_leads_company_fields
ON leads(company_name, company_phone, company_email);

-- ===============================================
-- STEP 6: Verify all columns were added
-- ===============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN (
    'contacts',
    'projects',
    'lead_notes',
    'next_activity_date',
    'company_address',
    'company_website',
    'company_phone',
    'company_email'
  )
ORDER BY column_name;

-- Expected result: You should see all 8 columns listed above
-- If any are missing, the ALTER TABLE commands didn't execute properly
