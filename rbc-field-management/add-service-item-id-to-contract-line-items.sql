-- Add service_item_id to contract_line_items table
-- Run this in Supabase SQL Editor

ALTER TABLE contract_line_items
ADD COLUMN IF NOT EXISTS service_item_id UUID REFERENCES service_items(id);

COMMENT ON COLUMN contract_line_items.service_item_id IS 'Optional link to service catalog item. When set, description, unit_type, and unit_price may be auto-populated but can be overridden.';

