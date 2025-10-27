-- Simple test to check what columns exist in service_categories table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_categories'
ORDER BY ordinal_position;
