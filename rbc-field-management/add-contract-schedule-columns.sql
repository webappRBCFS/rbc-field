-- Add missing schedule columns to contracts table
-- This script adds the comprehensive schedule system columns

-- Add master weekly schedule (days we visit)
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS master_weekly_schedule INTEGER[] DEFAULT '{}';

-- Add individual collection schedules
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS garbage_schedule INTEGER[] DEFAULT '{}';

ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS recycling_schedule INTEGER[] DEFAULT '{}';

ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS organics_schedule INTEGER[] DEFAULT '{}';

ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS bulk_schedule INTEGER[] DEFAULT '{}';

-- Add interior cleaning schedule (manual)
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS interior_cleaning_schedule INTEGER[] DEFAULT '{}';

-- Add comments to explain the columns
COMMENT ON COLUMN contracts.master_weekly_schedule IS 'Days of week we visit (0-6, Sunday=0)';
COMMENT ON COLUMN contracts.garbage_schedule IS 'Days for garbage prep (day before pickup)';
COMMENT ON COLUMN contracts.recycling_schedule IS 'Days for recycling prep (day before pickup)';
COMMENT ON COLUMN contracts.organics_schedule IS 'Days for organics prep (day before pickup)';
COMMENT ON COLUMN contracts.bulk_schedule IS 'Days for bulk prep (day before pickup)';
COMMENT ON COLUMN contracts.interior_cleaning_schedule IS 'Days for interior cleaning (manual schedule)';

-- Update existing contracts to have empty arrays for new columns
UPDATE contracts
SET
  master_weekly_schedule = COALESCE(master_weekly_schedule, '{}'),
  garbage_schedule = COALESCE(garbage_schedule, '{}'),
  recycling_schedule = COALESCE(recycling_schedule, '{}'),
  organics_schedule = COALESCE(organics_schedule, '{}'),
  bulk_schedule = COALESCE(bulk_schedule, '{}'),
  interior_cleaning_schedule = COALESCE(interior_cleaning_schedule, '{}')
WHERE
  master_weekly_schedule IS NULL
  OR garbage_schedule IS NULL
  OR recycling_schedule IS NULL
  OR organics_schedule IS NULL
  OR bulk_schedule IS NULL
  OR interior_cleaning_schedule IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'contracts'
  AND column_name IN (
    'master_weekly_schedule',
    'garbage_schedule',
    'recycling_schedule',
    'organics_schedule',
    'bulk_schedule',
    'interior_cleaning_schedule'
  )
ORDER BY column_name;
