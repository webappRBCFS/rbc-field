-- Add template_type column to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS template_type VARCHAR(50);

-- Create an index for template_type
CREATE INDEX IF NOT EXISTS idx_contracts_template_type ON contracts(template_type);

