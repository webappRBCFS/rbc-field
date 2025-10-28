-- Update properties table with new columns

-- Add new columns
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS units INTEGER,
ADD COLUMN IF NOT EXISTS stories INTEGER,
ADD COLUMN IF NOT EXISTS access_type TEXT,
ADD COLUMN IF NOT EXISTS access_info TEXT,
ADD COLUMN IF NOT EXISTS building_type TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS sales_tax_status TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
