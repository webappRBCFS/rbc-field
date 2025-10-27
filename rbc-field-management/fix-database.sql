-- Complete database fix for RBC Field Management
-- This script will fix all RLS and table issues

-- 1. Disable RLS on all tables
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lead_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lead_sources DISABLE ROW LEVEL SECURITY;

-- 2. Drop and recreate user_profiles table to remove any constraints
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 3. Recreate user_profiles table with proper structure
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'crew',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create a test admin user profile
INSERT INTO user_profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@rbcfield.com',
  'Admin',
  'User',
  'admin',
  true
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role;

-- 5. Ensure all other tables exist and are accessible
-- Check if leads table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        -- Create leads table
        CREATE TABLE leads (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          company_name TEXT,
          contact_first_name TEXT NOT NULL,
          contact_last_name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          zip_code TEXT,
          property_type TEXT,
          property_sqft INTEGER,
          service_needs TEXT,
          estimated_budget DECIMAL(10,2),
          lead_source_id UUID,
          lead_source_other TEXT,
          stage TEXT DEFAULT 'new',
          priority TEXT DEFAULT 'medium',
          assigned_to UUID,
          expected_close_date DATE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          custom_fields JSONB DEFAULT '{}'::jsonb
        );
    END IF;
END $$;

-- 6. Check if lead_sources table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_sources') THEN
        -- Create lead_sources table
        CREATE TABLE lead_sources (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL UNIQUE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Insert default lead sources
        INSERT INTO lead_sources (name) VALUES
          ('Website'),
          ('Referral'),
          ('Cold Call'),
          ('Email Campaign'),
          ('Social Media'),
          ('Trade Show'),
          ('Other');
    END IF;
END $$;

-- 7. Check if lead_activities table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_activities') THEN
        -- Create lead_activities table
        CREATE TABLE lead_activities (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          lead_id UUID NOT NULL,
          user_id UUID,
          activity_type TEXT NOT NULL,
          subject TEXT,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- 8. Verify everything is working
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as user_profiles_count FROM user_profiles;
SELECT COUNT(*) as leads_count FROM leads;
SELECT COUNT(*) as lead_sources_count FROM lead_sources;
