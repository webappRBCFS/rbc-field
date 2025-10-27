-- Debug query to check contracts data
SELECT
  id,
  title,
  contract_number,
  is_recurring,
  recurrence_type,
  recurrence_days,
  dsny_integration,
  dsny_collection_types,
  interior_cleaning_schedule,
  status,
  created_at
FROM contracts
ORDER BY created_at DESC
LIMIT 5;
