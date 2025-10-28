-- Fix service_items table to use service_category_id instead of category_id
-- Run this in Supabase SQL Editor

-- First check if category_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_items' AND column_name = 'category_id'
  ) THEN
    -- Rename category_id to service_category_id
    ALTER TABLE service_items RENAME COLUMN category_id TO service_category_id;
    RAISE NOTICE 'Renamed category_id to service_category_id';
  ELSE
    RAISE NOTICE 'Column category_id does not exist, service_category_id should be used';
  END IF;
END $$;

-- Verify the schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'service_items'
ORDER BY ordinal_position;

