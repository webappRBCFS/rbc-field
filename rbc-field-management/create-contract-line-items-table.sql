-- Create contract_line_items table
-- This table stores line items for contracts, used for invoice generation
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS contract_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,

  -- Item Details
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_type TEXT NOT NULL DEFAULT 'flat_rate', -- 'flat_rate', 'per_sqft', 'per_hour', 'per_visit', 'per_month'
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contract_line_items_contract_id ON contract_line_items(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_line_items_sort_order ON contract_line_items(contract_id, sort_order);

-- Enable RLS
ALTER TABLE contract_line_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your authentication setup)
-- Allow all authenticated users to read and write (adjust as needed)
CREATE POLICY "Users can view contract line items" ON contract_line_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert contract line items" ON contract_line_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update contract line items" ON contract_line_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete contract line items" ON contract_line_items
  FOR DELETE USING (true);

