-- Change proposals.notes column from TEXT to JSONB
-- Run this in Supabase SQL Editor

-- Step 1: Create or alter the notes column to JSONB
DO $$
DECLARE
  col_type TEXT;
BEGIN
  -- Check if column exists and get its type
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'proposals'
    AND column_name = 'notes';

  -- If column doesn't exist, create it
  IF col_type IS NULL THEN
    ALTER TABLE proposals
    ADD COLUMN notes JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Created notes column as JSONB';

  -- If column is TEXT, convert to JSONB
  ELSIF col_type = 'text' THEN
    ALTER TABLE proposals
    ALTER COLUMN notes TYPE JSONB
    USING CASE
      WHEN notes IS NULL OR trim(notes::text) = '' OR trim(notes::text) = 'null' THEN '[]'::jsonb
      WHEN notes::text ~ '^\[.*\]$' THEN notes::jsonb
      ELSE '[]'::jsonb
    END;

    ALTER TABLE proposals
    ALTER COLUMN notes SET DEFAULT '[]'::jsonb;

    RAISE NOTICE 'Converted notes column from TEXT to JSONB';

  -- If already JSONB, ensure default is set
  ELSIF col_type = 'jsonb' THEN
    ALTER TABLE proposals
    ALTER COLUMN notes SET DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Notes column is already JSONB';
  END IF;
END $$;

-- Step 2: Ensure all NULL notes are empty arrays
UPDATE proposals
SET notes = '[]'::jsonb
WHERE notes IS NULL;

-- Step 3: Verify the change
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'proposals'
  AND column_name = 'notes';

