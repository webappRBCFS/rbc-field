-- Add template_type column to proposals table
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS template_type TEXT;

