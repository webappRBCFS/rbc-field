-- Create invoice_line_items table for future invoice implementation
-- NOTE: This table is created without the foreign key to invoices since the invoices table
-- doesn't exist yet. When invoices table is created, you can add the foreign key constraint later.
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL, -- Foreign key to invoices(id) will be added when invoices table exists
  service_item_id UUID REFERENCES service_items(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_type TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE invoice_line_items IS 'Line items for invoices. Links to service catalog for consistency across invoices, proposals, and contracts.';
COMMENT ON COLUMN invoice_line_items.invoice_id IS 'References invoices table (will add foreign key constraint when invoices table exists)';
COMMENT ON COLUMN invoice_line_items.service_item_id IS 'Optional link to service catalog item. When set, description, unit_type, and unit_price may be auto-populated but can be overridden.';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_service_item_id ON invoice_line_items(service_item_id);

-- When invoices table is created, run this to add the foreign key constraint:
-- ALTER TABLE invoice_line_items
-- ADD CONSTRAINT fk_invoice_line_items_invoice_id
-- FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

