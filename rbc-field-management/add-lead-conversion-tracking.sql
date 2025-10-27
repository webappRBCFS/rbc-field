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

-- Update the conversion function to set both references
COMMENT ON COLUMN customers.converted_from_lead_id IS 'Reference to the lead this customer was converted from';
COMMENT ON COLUMN leads.converted_to_customer_id IS 'Reference to the customer this lead was converted to';

