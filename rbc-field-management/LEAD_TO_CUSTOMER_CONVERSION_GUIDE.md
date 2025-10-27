# Lead to Customer Conversion System

## Overview

The system automatically converts leads to customers when proposals are approved or contracts are created. This ensures a smooth workflow from lead generation to customer onboarding.

## Database Setup

### Step 1: Run the SQL Migration

Open the Supabase SQL Editor and run the `add-lead-conversion-tracking.sql` file to add the necessary columns:

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

### Step 2: Reload the Schema Cache

After running the SQL, reload the PostgREST schema cache:

```sql
SELECT pg_notify('pgrst', 'reload schema');
```

Or restart your Supabase project from the dashboard.

## How It Works

### 1. Manual Conversion from Leads Page

- Navigate to **Leads** page
- Find the lead you want to convert
- Click the purple **Convert to Customer** button (user icon)
- Confirm the conversion
- The system will:
  - Create a customer record with company and contact info
  - Create property records from lead projects
  - Mark the lead as "Won"
  - Link the lead and customer records

### 2. Automatic Conversion on Proposal Approval

When you approve a proposal that's linked to a lead:

- Go to **Proposals** page
- Change proposal status to "Approved"
- The system automatically:
  - Converts the lead to customer
  - Creates property records
  - Updates the lead status to "Won"
  - Links the proposal to the new customer

### 3. Automatic Conversion on Contract Creation

When you create a contract from a proposal linked to a lead:

- Go to **Contracts** → **Create Contract**
- Select a proposal that has a lead_id
- Submit the contract
- The system automatically:
  - Converts the lead to customer
  - Creates property records
  - Updates the lead status to "Won"

## Visual Indicators

### In Leads List

- **Active Leads**: Show action buttons (View, Edit, Create Proposal, Convert to Customer)
- **Converted Leads**: Show green "Customer" badge instead of action buttons

### Lead Status

- When converted, the lead stage changes to "Won"
- The `converted_to_customer_id` field is populated

### Customer Records

- New customers have `converted_from_lead_id` populated
- You can track which leads became customers

## Data Migration

The conversion process transfers the following data:

### From Lead to Customer

- `company_name` → `company_name`
- Primary contact name → `contact_first_name`, `contact_last_name`
- Primary contact email → `email`
- Primary contact phone → `phone`
- `company_address` → `billing_address`
- `city` → `billing_city`
- `state` → `billing_state`
- `zip_code` → `billing_zip_code`

### From Lead Projects to Properties

For each project in the lead's `projects` array:

- `project.type` → `property.name` and `property.property_type`
- `project.address` → `property.address`
- `project.unit_count` → `property.unit_count`
- `project.notes` → `property.notes`

## Error Handling

### Duplicate Prevention

- The system checks if a customer with the same company name already exists
- If found, it updates the lead status but doesn't create a duplicate customer
- Returns the existing customer ID

### Conversion Failures

- If conversion fails during proposal approval or contract creation, the parent operation continues
- Error is logged to console
- User is notified (in manual conversion only)

## Best Practices

1. **Fill Out Lead Projects**: Add all property information in the lead's Projects section for complete data transfer

2. **Use Company Name**: Always fill in the company name to prevent duplicate customers

3. **Verify Before Converting**: Review lead data before converting to ensure all information is accurate

4. **Check Converted Leads**: Leads marked as "Won" may already be customers - check for the green badge

5. **Link Proposals**: Always link proposals to leads when possible for automatic conversion

## Troubleshooting

### Conversion Button Not Working

- Check browser console for errors
- Verify database columns exist
- Ensure PostgREST schema cache is reloaded

### Duplicate Customers Created

- System checks `company_name` for duplicates
- If multiple leads have the same company, only the first creates a customer
- Subsequent conversions update the lead but don't create new customers

### Properties Not Created

- Verify lead has projects with addresses
- Check that `projects` field is properly populated
- Review console logs for property creation errors

## API Functions

### `convertLeadToCustomer(leadId: string)`

Main conversion function located in `src/lib/leadConversion.ts`

**Returns**: Customer ID (UUID)

**Side Effects**:

- Creates customer record
- Creates property records
- Updates lead stage to 'won'
- Links lead and customer

### `convertLeadForProposal(leadId: string, proposalId: string)`

Converts a lead and links it to a proposal

**Returns**: Customer ID (UUID)

**Side Effects**:

- All effects of `convertLeadToCustomer`
- Updates proposal with customer_id

## Database Schema

### leads table

- `converted_to_customer_id` (UUID, nullable): Reference to customer created from this lead

### customers table

- `converted_from_lead_id` (UUID, nullable): Reference to lead this customer was created from

### proposals table

- `lead_id` (UUID, nullable): Reference to originating lead
- `customer_id` (UUID, nullable): Reference to customer (populated after conversion)

### contracts table

- `proposal_id` (UUID, nullable): Reference to proposal (used to trace back to lead)
