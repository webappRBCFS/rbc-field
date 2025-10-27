-- Force PostgREST schema reload
-- Run this in Supabase SQL Editor

-- Method 1: Notify PostgREST to reload
SELECT pg_notify('pgrst', 'reload schema');

-- Method 2: Create a dummy table to trigger schema refresh
CREATE TABLE IF NOT EXISTS _pgrst_reload_schema (reload BOOLEAN);
DROP TABLE IF EXISTS _pgrst_reload_schema;

-- Method 3: Touch the leads table to trigger cache refresh
DO $$
BEGIN
  PERFORM 1 FROM leads LIMIT 1;
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;

