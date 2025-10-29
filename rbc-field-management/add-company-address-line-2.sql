-- Add company_address_line_2 column to leads table
-- Run this in Supabase SQL Editor

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_address_line_2 TEXT;

COMMENT ON COLUMN leads.company_address_line_2 IS 'Second line of company address for office #, suite, unit, etc.';

