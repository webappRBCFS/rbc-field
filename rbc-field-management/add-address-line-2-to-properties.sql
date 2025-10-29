-- Add address_line_2 column to properties table
-- Run this in Supabase SQL Editor

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS address_line_2 TEXT;

COMMENT ON COLUMN properties.address_line_2 IS 'Second line of property address for apartment #, suite #, unit, etc.';

