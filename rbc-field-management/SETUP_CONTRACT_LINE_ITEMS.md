# Contract Line Items Setup

## Overview

This migration creates the `contract_line_items` table to store billing line items for contracts. These line items are used for invoice generation and billing calculations.

## Database Setup

### Step 1: Run the SQL Migration

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `create-contract-line-items-table.sql`
5. Click **Run** (or press Ctrl+Enter)

Alternatively, you can run this SQL directly:

```sql
-- Create contract_line_items table
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_contract_line_items_contract_id ON contract_line_items(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_line_items_sort_order ON contract_line_items(contract_id, sort_order);

-- Enable RLS
ALTER TABLE contract_line_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view contract line items" ON contract_line_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert contract line items" ON contract_line_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update contract line items" ON contract_line_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete contract line items" ON contract_line_items
  FOR DELETE USING (true);
```

### Step 2: Reload Schema Cache

After running the SQL, reload the PostgREST schema cache:

```sql
SELECT pg_notify('pgrst', 'reload schema');
```

Or restart your Supabase project from the dashboard (Settings → General → Restart project).

## Features

Once the table is created, you'll be able to:

- ✅ Add line items to contracts in the **Billing & Financials** tab
- ✅ Edit line items with description, quantity, unit type, and pricing
- ✅ Auto-calculate total amount from line items
- ✅ Save line items with contracts (create and edit)
- ✅ View line items when editing contracts

## Unit Types

Line items support the following unit types:

- **Flat Rate** - Fixed price per item
- **Per Sq Ft** - Price per square foot
- **Per Hour** - Price per hour
- **Per Visit** - Price per service visit
- **Per Month** - Monthly recurring charge

## Testing

1. Navigate to **Contracts** → **Create Contract**
2. Fill in the contract details
3. Go to the **Billing & Financials** tab
4. Click **Add Line Item**
5. Fill in the line item details:
   - Description (required)
   - Quantity
   - Unit Type
   - Unit Price
6. Verify the **Total** is auto-calculated
7. Verify the **Line Items Total** updates
8. Save the contract
9. Edit the contract and verify line items are loaded correctly

## Troubleshooting

If you see errors like "Could not find the table 'public.contract_line_items'":

1. Verify the SQL migration ran successfully
2. Check that the table exists: `SELECT * FROM contract_line_items LIMIT 1;`
3. Reload the schema cache (see Step 2 above)
4. Refresh your browser
