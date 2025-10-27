-- Add manual_schedules column to contracts table
-- This script adds support for dynamic manual schedules

-- Add manual_schedules column as JSONB array
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS manual_schedules JSONB DEFAULT '[]';

-- Add comment to explain the column
COMMENT ON COLUMN contracts.manual_schedules IS 'Dynamic manual schedules array with id, name, description, color, and days';

-- Update existing contracts to have empty array for new column
UPDATE contracts
SET manual_schedules = COALESCE(manual_schedules, '[]')
WHERE manual_schedules IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'contracts'
  AND column_name = 'manual_schedules';
