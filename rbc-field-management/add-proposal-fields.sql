-- Add missing columns to proposals table
-- Run this in Supabase SQL Editor

ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_tax_status TEXT,
ADD COLUMN IF NOT EXISTS total DECIMAL(10,2); -- Some schemas use 'total' instead of 'total_amount'

-- Note: If your schema uses 'total_amount' instead of 'total', you can rename it:
-- ALTER TABLE proposals RENAME COLUMN total_amount TO total;

