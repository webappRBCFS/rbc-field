-- Delete all service categories and items
-- Run this in your Supabase SQL editor

-- First, delete all service items (to handle foreign key constraint)
DELETE FROM service_items;

-- Then delete all service categories
DELETE FROM service_categories;

-- Verify deletion
SELECT COUNT(*) as remaining_categories FROM service_categories;
SELECT COUNT(*) as remaining_items FROM service_items;
