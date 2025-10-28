-- Check if service_items table exists and has correct schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_items'
ORDER BY ordinal_position;

