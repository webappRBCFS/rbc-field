-- Complete fix for leads table - check and add all columns
-- Run this in Supabase SQL Editor

-- First, let's see what columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY column_name;

-- Now add ALL missing columns one by one

-- Company fields
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_address TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_website TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_phone TEXT;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_email TEXT;

-- JSONB array fields
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_notes JSONB DEFAULT '[]'::jsonb;

-- Date field
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS next_activity_date DATE;

-- Update existing leads to have proper JSON arrays (not null)
UPDATE leads
SET
  contacts = CASE WHEN contacts IS NULL THEN '[]'::jsonb ELSE contacts END,
  projects = CASE WHEN projects IS NULL THEN '[]'::jsonb ELSE projects END,
  lead_notes = CASE WHEN lead_notes IS NULL THEN '[]'::jsonb ELSE lead_notes END
WHERE contacts IS NULL OR projects IS NULL OR lead_notes IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_leads_next_activity_date ON leads(next_activity_date);

-- Final verification - all columns should now exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('company_address', 'company_website', 'company_phone', 'company_email', 'contacts', 'projects', 'lead_notes', 'next_activity_date')
ORDER BY column_name;
