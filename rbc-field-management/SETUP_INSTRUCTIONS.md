# Setup Instructions - Lead to Customer Conversion

## Quick Start

### 1. Run Database Migration

Open your Supabase SQL Editor and execute this SQL:

```sql
-- Add lead tracking to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS converted_from_lead_id UUID REFERENCES leads(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_customers_converted_from_lead
ON customers(converted_from_lead_id);

-- Add customer_id reference to leads for bidirectional tracking
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS converted_to_customer_id UUID REFERENCES customers(id);

-- Add index
CREATE INDEX IF NOT EXISTS idx_leads_converted_to_customer
ON leads(converted_to_customer_id);
```

### 2. Reload Schema Cache

After running the SQL, execute this in the SQL Editor:

```sql
SELECT pg_notify('pgrst', 'reload schema');
```

Or restart your Supabase project from the dashboard (Settings → General → Restart project).

### 3. Test the System

1. Go to the **Leads** page in your app
2. Find any lead (or create a new one)
3. Click the purple **Convert to Customer** button (user icon with checkmark)
4. Confirm the conversion
5. The lead should now show a green "Customer" badge

## Features

### Manual Conversion

- Purple "Convert to Customer" button in the Leads table
- Converts lead → customer with one click
- Creates customer record + properties from lead projects
- Updates lead status to "Won"

### Automatic Conversion

- **On Proposal Approval**: When you change a proposal status to "Approved", if it's linked to a lead, the lead is automatically converted
- **On Contract Creation**: When you create a contract from a proposal that's linked to a lead, the lead is automatically converted

### Visual Indicators

- **Active Leads**: Show action buttons (View, Edit, Create Proposal, Convert)
- **Converted Leads**: Show green "Customer" badge instead of buttons
- Leads marked as "Won" are typically converted

## What Gets Transferred

When a lead is converted to a customer:

**Customer Record:**

- Company name and contact information
- Email and phone from primary contact
- Billing address from company address
- Link back to original lead

**Property Records:**

- Creates a property for each project in the lead
- Transfers address, type, unit count, and notes
- Links all properties to the new customer

**Lead Updates:**

- Stage changes to "Won"
- `converted_to_customer_id` is populated
- Original lead data remains intact for reference

## File Reference

- **SQL Migration**: `add-lead-conversion-tracking.sql`
- **Full Documentation**: `LEAD_TO_CUSTOMER_CONVERSION_GUIDE.md`
- **Conversion Logic**: `src/lib/leadConversion.ts`

## Troubleshooting

### Button doesn't appear

- Clear browser cache and refresh
- Check that you're not already viewing a converted lead (look for green "Customer" badge)

### Conversion fails

- Open browser console (F12) to see error message
- Verify SQL migration was run successfully
- Ensure schema cache was reloaded
- Check that lead has required fields (contact name, etc.)

### Duplicate customers

- System prevents duplicates by checking company name
- If a customer with the same company name exists, the system reuses that customer
- Only updates the lead status in this case

## Support

If you encounter issues:

1. Check browser console for errors (F12 → Console tab)
2. Review Supabase logs (Supabase Dashboard → Logs)
3. Verify database schema has new columns (use query in LEAD_TO_CUSTOMER_CONVERSION_GUIDE.md)
