-- First, check if leads table exists
-- Run this in Supabase SQL Editor first

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'leads';
