-- Database Structure Check Script
-- This script checks the current database structure

-- Check if tables exist
SELECT 'Checking table existence...' as info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('proposals', 'customers', 'properties', 'service_categories', 'jobs')
ORDER BY table_name;

-- Check foreign key relationships
SELECT 'Checking foreign key relationships...' as info;
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('proposals', 'jobs')
ORDER BY tc.table_name, kcu.column_name;

-- Check if we have any data
SELECT 'Checking existing data...' as info;
SELECT 'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'properties' as table_name, COUNT(*) as count FROM properties
UNION ALL
SELECT 'service_categories' as table_name, COUNT(*) as count FROM service_categories
UNION ALL
SELECT 'proposals' as table_name, COUNT(*) as count FROM proposals
UNION ALL
SELECT 'jobs' as table_name, COUNT(*) as count FROM jobs;
