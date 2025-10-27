-- This will refresh the PostgREST schema cache
-- Run this after adding columns to the leads table

-- Method 1: Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Method 2: If Method 1 doesn't work, restart your Supabase project from the dashboard
-- Go to Settings > General > Restart Project

-- Method 3: Force a schema reload by touching the schema
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;

