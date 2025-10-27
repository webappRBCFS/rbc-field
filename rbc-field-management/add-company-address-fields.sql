-- Add city, state, zip columns for company address in leads table
-- This allows us to store full address details when using Google Places API

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS company_city TEXT,
ADD COLUMN IF NOT EXISTS company_state TEXT,
ADD COLUMN IF NOT EXISTS company_zip TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN leads.company_city IS 'Company city from Google Places API';
COMMENT ON COLUMN leads.company_state IS 'Company state (2-letter code) from Google Places API';
COMMENT ON COLUMN leads.company_zip IS 'Company zip code from Google Places API';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('company_address', 'company_city', 'company_state', 'company_zip')
ORDER BY column_name;

