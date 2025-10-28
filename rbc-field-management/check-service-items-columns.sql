-- Check what columns exist in the service_items table
-- Run this in Supabase SQL Editor

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_items'
ORDER BY ordinal_position;

