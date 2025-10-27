-- Check if the converted_to_customer_id column exists in leads table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name = 'converted_to_customer_id';

-- Also check current leads and their conversion status
SELECT
  id,
  company_name,
  contact_first_name,
  contact_last_name,
  stage,
  converted_to_customer_id,
  created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;

