# Lead Schema Update Instructions

## Step 1: Open Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Click **"New Query"**

## Step 2: Paste and Run the SQL

Copy the entire SQL script from the `update-leads-schema.sql` file and paste it into the SQL Editor, then click **"Run"**.

## What This Does:

### 1. **Adds Company Fields**

- `company_address` - Full address of the company
- `company_website` - Website URL

### 2. **Adds Contacts Array (JSONB)**

- Stores multiple contacts per lead
- Each contact has: name, phone, cell, email
- Format: `[{id, name, phone, cell, email}]`

### 3. **Adds Projects Array (JSONB)**

- Stores multiple potential projects per lead
- Each project has: type, address, unit_count, work_type, notes
- Format: `[{id, type, address, unit_count, work_type, notes}]`

### 4. **Adds Lead Notes Array (JSONB)**

- Time-stamped notes for tracking lead history
- Each note has: timestamp, note
- Format: `[{timestamp, note}]`

### 5. **Adds Next Activity Date**

- Date for next activity/action
- Creates an index for efficient sorting in the lead list
- Required field in the new form

### 6. **Updates Existing Leads**

- Sets default empty arrays for new columns on existing leads
- Ensures no null values that could cause errors

## Verification

After running the SQL, you should see a verification query result showing all the new columns were added successfully.

## Next Steps

After the SQL is run:

1. The LeadCreate form will work with the new structure
2. You can create leads with multiple contacts and projects
3. The lead list can be sorted by "Next Activity Date"
4. All existing leads will have empty arrays for the new fields
