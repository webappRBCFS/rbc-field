-- First, create the leads table if it doesn't exist
-- Then add the new columns if they don't exist
-- Run this entire script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create lead_sources table if it doesn't exist
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default lead sources if they don't exist
INSERT INTO lead_sources (name)
SELECT * FROM (VALUES
  ('Website'),
  ('Referral'),
  ('Cold Call'),
  ('Email Campaign'),
  ('Social Media'),
  ('Trade Show'),
  ('Other')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Create lead_stage enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE lead_stage AS ENUM ('new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact Information
  company_name TEXT,
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Property Details
  property_type TEXT,
  property_sqft INTEGER,

  -- Service Needs
  service_needs TEXT,
  estimated_budget DECIMAL(10,2),

  -- Lead Tracking
  lead_source_id UUID REFERENCES lead_sources(id),
  lead_source_other TEXT,
  stage lead_stage DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id),

  -- Dates
  expected_close_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}'::jsonb
);

-- Now add the new columns for the new lead structure
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
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

-- Add comments to explain the columns
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
  AND column_name IN ('contacts', 'projects', 'lead_notes', 'next_activity_date', 'company_address', 'company_website', 'company_phone', 'company_email')
ORDER BY column_name;
