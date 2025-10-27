-- Multi-Company Operational Structure Schema
-- Run this in your Supabase SQL editor

-- Create operational divisions table
CREATE TABLE IF NOT EXISTS operational_divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  color_code TEXT DEFAULT '#3B82F6', -- For UI theming
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the 3 operational divisions
INSERT INTO operational_divisions (name, code, description, color_code) VALUES
('Maintenance Division', 'MAINT', 'Janitorial upkeep for residential multi-family buildings', '#10B981'),
('Office Cleaning Division', 'OFFICE', 'Cleaning services for offices of all sizes', '#3B82F6'),
('Post-Construction Division', 'POSTCON', 'Apartment turnovers and post-construction cleaning', '#F59E0B')
ON CONFLICT (code) DO NOTHING;

-- Add division tracking to service categories
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS operational_division_id UUID REFERENCES operational_divisions(id);

-- Update existing service categories with their divisions
UPDATE service_categories SET operational_division_id = (SELECT id FROM operational_divisions WHERE code = 'MAINT') WHERE name = 'Maintenance (Janitorial)';
UPDATE service_categories SET operational_division_id = (SELECT id FROM operational_divisions WHERE code = 'OFFICE') WHERE name = 'Office Cleaning';
UPDATE service_categories SET operational_division_id = (SELECT id FROM operational_divisions WHERE code = 'POSTCON') WHERE name = 'Apartment Turnover';
UPDATE service_categories SET operational_division_id = (SELECT id FROM operational_divisions WHERE code = 'POSTCON') WHERE name = 'Residential Post-Construction';
UPDATE service_categories SET operational_division_id = (SELECT id FROM operational_divisions WHERE code = 'POSTCON') WHERE name = 'Commercial Post-Construction';

-- Add division tracking to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS operational_division_id UUID REFERENCES operational_divisions(id);

-- Add division tracking to jobs (when we create the jobs table)
-- This will be used for scheduling, crew assignment, and job completion
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS operational_division_id UUID REFERENCES operational_divisions(id);

-- Add division tracking to user profiles for crew assignment
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS primary_division_id UUID REFERENCES operational_divisions(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS secondary_divisions UUID[] DEFAULT '{}';

-- Add division tracking to time tracking (when we create the time_tracking table)
ALTER TABLE time_tracking ADD COLUMN IF NOT EXISTS operational_division_id UUID REFERENCES operational_divisions(id);

-- Add division tracking to QC visits
ALTER TABLE qc_visits ADD COLUMN IF NOT EXISTS operational_division_id UUID REFERENCES operational_divisions(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_categories_division ON service_categories(operational_division_id);
CREATE INDEX IF NOT EXISTS idx_proposals_division ON proposals(operational_division_id);
CREATE INDEX IF NOT EXISTS idx_jobs_division ON jobs(operational_division_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_primary_division ON user_profiles(primary_division_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_division ON time_tracking(operational_division_id);
CREATE INDEX IF NOT EXISTS idx_qc_visits_division ON qc_visits(operational_division_id);

-- Create a view for division-aware reporting
CREATE OR REPLACE VIEW division_summary AS
SELECT
  od.id as division_id,
  od.name as division_name,
  od.code as division_code,
  od.color_code,
  COUNT(DISTINCT p.id) as total_proposals,
  COUNT(DISTINCT j.id) as total_jobs,
  COUNT(DISTINCT up.id) as total_employees,
  COALESCE(SUM(p.total_amount), 0) as total_proposal_value,
  COALESCE(SUM(j.estimated_hours), 0) as total_estimated_hours
FROM operational_divisions od
LEFT JOIN service_categories sc ON sc.operational_division_id = od.id
LEFT JOIN proposals p ON p.operational_division_id = od.id
LEFT JOIN jobs j ON j.operational_division_id = od.id
LEFT JOIN user_profiles up ON up.primary_division_id = od.id
WHERE od.is_active = true
GROUP BY od.id, od.name, od.code, od.color_code;

-- Add division context to leads (optional - for lead routing)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferred_division_id UUID REFERENCES operational_divisions(id);

-- Create a function to get division by service category
CREATE OR REPLACE FUNCTION get_division_by_service_category(service_cat_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT operational_division_id
    FROM service_categories
    WHERE id = service_cat_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to auto-assign division to proposals
CREATE OR REPLACE FUNCTION auto_assign_proposal_division()
RETURNS TRIGGER AS $$
BEGIN
  -- If no division is specified, try to get it from service category
  IF NEW.operational_division_id IS NULL AND NEW.service_category_id IS NOT NULL THEN
    NEW.operational_division_id := get_division_by_service_category(NEW.service_category_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign division to proposals
DROP TRIGGER IF EXISTS trigger_auto_assign_proposal_division ON proposals;
CREATE TRIGGER trigger_auto_assign_proposal_division
  BEFORE INSERT OR UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_proposal_division();
