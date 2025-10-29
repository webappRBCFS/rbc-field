-- Add description column to proposals table
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS description TEXT;

