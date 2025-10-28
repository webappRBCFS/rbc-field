-- Delete all service categories and related data
-- Delete in proper order to respect foreign key constraints
-- This will DELETE: proposals, proposal_line_items, service_items, and service_categories

DELETE FROM proposals;
DELETE FROM proposal_line_items;
DELETE FROM service_items;
DELETE FROM service_categories;

-- Verify deletion
SELECT
  (SELECT COUNT(*) FROM service_categories) as remaining_categories,
  (SELECT COUNT(*) FROM service_items) as remaining_items,
  (SELECT COUNT(*) FROM proposal_line_items) as remaining_line_items,
  (SELECT COUNT(*) FROM proposals) as remaining_proposals;

