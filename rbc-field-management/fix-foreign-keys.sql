-- Fix Foreign Key Relationships Script
-- This script creates missing foreign key relationships

-- First, let's check what columns exist in each table
SELECT 'proposals table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'proposals'
ORDER BY ordinal_position;

SELECT 'customers table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

SELECT 'properties table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;

SELECT 'service_categories table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_categories'
ORDER BY ordinal_position;

-- Try to create foreign key relationships (ignore errors if they already exist)
DO $$
BEGIN
    -- Add foreign key from proposals to customers
    BEGIN
        ALTER TABLE proposals ADD CONSTRAINT fk_proposals_customer_id
        FOREIGN KEY (customer_id) REFERENCES customers(id);
        RAISE NOTICE 'Added foreign key: proposals.customer_id -> customers.id';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Foreign key already exists: proposals.customer_id -> customers.id';
    END;

    -- Add foreign key from proposals to properties
    BEGIN
        ALTER TABLE proposals ADD CONSTRAINT fk_proposals_property_id
        FOREIGN KEY (property_id) REFERENCES properties(id);
        RAISE NOTICE 'Added foreign key: proposals.property_id -> properties.id';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Foreign key already exists: proposals.property_id -> properties.id';
    END;

    -- Add foreign key from proposals to service_categories
    BEGIN
        ALTER TABLE proposals ADD CONSTRAINT fk_proposals_service_category_id
        FOREIGN KEY (service_category_id) REFERENCES service_categories(id);
        RAISE NOTICE 'Added foreign key: proposals.service_category_id -> service_categories.id';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Foreign key already exists: proposals.service_category_id -> service_categories.id';
    END;

    -- Add foreign key from properties to customers
    BEGIN
        ALTER TABLE properties ADD CONSTRAINT fk_properties_customer_id
        FOREIGN KEY (customer_id) REFERENCES customers(id);
        RAISE NOTICE 'Added foreign key: properties.customer_id -> customers.id';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Foreign key already exists: properties.customer_id -> customers.id';
    END;
END $$;

-- Check the results
SELECT 'Foreign key relationships after fix:' as info;
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
AND tc.table_name IN ('proposals', 'properties')
ORDER BY tc.table_name, kcu.column_name;
