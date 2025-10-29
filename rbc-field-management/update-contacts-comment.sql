-- Update the comment on the contacts column to include the extension field
-- This is just for documentation - JSONB arrays can store any structure

COMMENT ON COLUMN leads.contacts IS 'Array of contact objects with name, phone, extension (optional), cell, email';

