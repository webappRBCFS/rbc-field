-- Make operational_division_id mandatory for service_categories
-- Run this in your Supabase SQL editor

-- First, update any existing service categories that don't have a division assigned
-- You'll need to assign them to a division manually or they'll be set to the first division
UPDATE service_categories
SET operational_division_id = (SELECT id FROM operational_divisions LIMIT 1)
WHERE operational_division_id IS NULL;

-- Now make the column NOT NULL
ALTER TABLE service_categories
ALTER COLUMN operational_division_id SET NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN service_categories.operational_division_id IS 'Required: Every service category must belong to an operational division';
