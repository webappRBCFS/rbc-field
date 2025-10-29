-- Add project_address column to proposals table to track which project was selected
-- This allows proposals to be linked to properties after lead conversion
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS project_address TEXT;

