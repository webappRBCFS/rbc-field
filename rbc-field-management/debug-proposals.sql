-- Check if proposals exist and their structure
-- Run this in your Supabase SQL editor to debug

-- Check if proposals table exists and has data
SELECT
  COUNT(*) as total_proposals,
  COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as with_customer,
  COUNT(CASE WHEN property_id IS NOT NULL THEN 1 END) as with_property,
  COUNT(CASE WHEN lead_id IS NOT NULL THEN 1 END) as with_lead
FROM proposals;

-- Show all proposals with basic info
SELECT
  id,
  proposal_number,
  title,
  status,
  total_amount,
  customer_id,
  property_id,
  lead_id,
  created_at
FROM proposals
ORDER BY created_at DESC
LIMIT 10;

-- Check if the proposals table has the right columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'proposals'
ORDER BY ordinal_position;
