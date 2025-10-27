-- RBC Field Management System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'dispatcher', 'crew', 'qc_inspector', 'customer');

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'crew',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LEAD MANAGEMENT
-- =============================================

-- Lead sources
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

-- Lead pipeline stages
CREATE TYPE lead_stage AS ENUM ('new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost');

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact Information
  company_name TEXT,
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Property Details
  property_type TEXT, -- Office, Warehouse, Manufacturing, etc.
  property_sqft INTEGER,

  -- Service Needs
  service_needs TEXT,
  estimated_budget DECIMAL(10,2),

  -- Lead Tracking
  lead_source_id UUID REFERENCES lead_sources(id),
  lead_source_other TEXT, -- Used when source is "Other"
  stage lead_stage DEFAULT 'new',
  priority TEXT DEFAULT 'medium', -- low, medium, high
  assigned_to UUID REFERENCES user_profiles(id),

  -- Dates
  expected_close_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}'::jsonb
);

-- Lead activities (timeline/notes)
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  activity_type TEXT NOT NULL, -- note, call, email, meeting, status_change
  subject TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CUSTOMERS & PROPERTIES
-- =============================================

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Information
  company_name TEXT,
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  -- Billing Information
  billing_address TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip_code TEXT,

  -- Settings
  payment_terms INTEGER DEFAULT 30, -- days
  preferred_payment_method TEXT,
  billing_frequency TEXT, -- per_job, weekly, monthly, quarterly

  -- Relationships
  converted_from_lead_id UUID REFERENCES leads(id),

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}'::jsonb
);

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Property Details
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  property_type TEXT NOT NULL, -- Office, Warehouse, Manufacturing, Retail, Residential
  sqft INTEGER,

  -- Contact (if different from customer)
  site_contact_name TEXT,
  site_contact_phone TEXT,
  site_contact_email TEXT,

  -- Access Information
  access_instructions TEXT,
  gate_code TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- SERVICE CATALOG
-- =============================================

-- Service categories
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service catalog
CREATE TABLE service_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES service_categories(id),

  -- Service Details
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE, -- SKU or service code

  -- Pricing
  unit_type TEXT DEFAULT 'fixed', -- fixed, per_sqft, per_hour, per_unit
  default_price DECIMAL(10,2),
  cost DECIMAL(10,2), -- For P&L calculations

  -- Settings
  is_recurring_eligible BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROPOSALS
-- =============================================

-- Proposal templates
CREATE TABLE proposal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  template_content TEXT, -- HTML or markdown template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal status
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired');

-- Proposals
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_number TEXT UNIQUE NOT NULL,

  -- Relationships
  lead_id UUID REFERENCES leads(id),
  customer_id UUID REFERENCES customers(id),
  property_id UUID REFERENCES properties(id),
  template_id UUID REFERENCES proposal_templates(id),
  created_by UUID REFERENCES user_profiles(id),

  -- Proposal Details
  title TEXT NOT NULL,
  description TEXT,

  -- Pricing
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,

  -- Terms
  payment_terms INTEGER DEFAULT 30,
  valid_until DATE,
  terms_and_conditions TEXT,

  -- Status & Dates
  status proposal_status DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by TEXT, -- Customer name who approved
  signature_data TEXT, -- E-signature data

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal line items
CREATE TABLE proposal_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES service_catalog(id),

  -- Item Details
  display_order INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,

  -- Recurring Settings
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT, -- weekly, biweekly, monthly, quarterly, annually
  recurring_duration INTEGER, -- number of periods

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EMPLOYEES & CREWS
-- =============================================

-- Employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_profile_id UUID REFERENCES user_profiles(id),

  -- Basic Info
  employee_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  -- Employment Details
  hire_date DATE,
  termination_date DATE,
  employment_type TEXT DEFAULT 'full_time', -- full_time, part_time, contractor

  -- Payroll
  hourly_rate DECIMAL(10,2),
  overtime_rate DECIMAL(10,2),

  -- Skills & Certifications
  skills TEXT[],
  certifications JSONB DEFAULT '[]'::jsonb,

  -- Scheduling
  is_available_for_scheduling BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crews (teams)
CREATE TABLE crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  lead_employee_id UUID REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crew members (junction table)
CREATE TABLE crew_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(crew_id, employee_id)
);

-- =============================================
-- JOBS & SCHEDULING
-- =============================================

-- Job status
CREATE TYPE job_status AS ENUM (
  'draft',
  'scheduled',
  'in_progress',
  'completed',
  'under_review',
  'qc_scheduled',
  'qc_passed',
  'qc_failed',
  'approved',
  'cancelled'
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number TEXT UNIQUE NOT NULL,

  -- Relationships
  customer_id UUID NOT NULL REFERENCES customers(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  proposal_id UUID REFERENCES proposals(id),
  created_by UUID REFERENCES user_profiles(id),

  -- Job Details
  title TEXT NOT NULL,
  description TEXT,
  service_type TEXT,

  -- Scheduling
  scheduled_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  estimated_duration INTEGER, -- minutes

  -- Assignment
  assigned_crew_id UUID REFERENCES crews(id),
  assigned_employee_id UUID REFERENCES employees(id),

  -- Completion
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  completion_notes TEXT,

  -- Recurring
  is_recurring BOOLEAN DEFAULT false,
  recurring_schedule_id UUID, -- Self-reference for recurring jobs
  parent_recurring_job_id UUID REFERENCES jobs(id),

  -- Status
  status job_status DEFAULT 'draft',
  priority TEXT DEFAULT 'medium',

  -- Pricing
  quoted_amount DECIMAL(10,2),
  actual_amount DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring schedules (for recurring jobs)
CREATE TABLE recurring_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  property_id UUID NOT NULL REFERENCES properties(id),

  -- Schedule Details
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL, -- weekly, biweekly, monthly, quarterly
  day_of_week INTEGER, -- 0-6 for weekly schedules
  day_of_month INTEGER, -- 1-31 for monthly schedules
  preferred_time TIME,

  -- Assignment
  assigned_crew_id UUID REFERENCES crews(id),
  assigned_employee_id UUID REFERENCES employees(id),

  -- Active Period
  start_date DATE NOT NULL,
  end_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job assignments (track who's assigned to each job)
CREATE TABLE job_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  crew_id UUID REFERENCES crews(id),
  employee_id UUID REFERENCES employees(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES user_profiles(id),
  CHECK (crew_id IS NOT NULL OR employee_id IS NOT NULL)
);

-- =============================================
-- TIME TRACKING
-- =============================================

-- Time entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  job_id UUID REFERENCES jobs(id),

  -- Time Data
  clock_in_time TIMESTAMPTZ NOT NULL,
  clock_out_time TIMESTAMPTZ,
  break_duration INTEGER DEFAULT 0, -- minutes
  total_hours DECIMAL(5,2),

  -- Location (GPS verification)
  clock_in_latitude DECIMAL(10,8),
  clock_in_longitude DECIMAL(11,8),
  clock_out_latitude DECIMAL(10,8),
  clock_out_longitude DECIMAL(11,8),

  -- Classification
  entry_type TEXT DEFAULT 'job', -- shift, job, break

  -- Approval
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job materials (materials used on jobs)
CREATE TABLE job_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),

  -- Material Details
  material_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT, -- gallon, box, unit, etc.
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2),

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job photos
CREATE TABLE job_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES employees(id),

  -- Photo Details
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER, -- bytes
  photo_type TEXT DEFAULT 'completion', -- before, during, completion, issue
  caption TEXT,

  -- Location
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- QC & REVIEW
-- =============================================

-- QC schedule rules (for rotating QC inspections)
CREATE TABLE qc_schedule_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurring_schedule_id UUID REFERENCES recurring_schedules(id),

  -- Rule Details
  inspection_frequency INTEGER NOT NULL, -- Inspect every N occurrences
  last_inspection_date DATE,
  next_inspection_date DATE,

  -- Assignment
  default_inspector_id UUID REFERENCES employees(id),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QC inspections
CREATE TABLE qc_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES employees(id),

  -- Inspection Details
  scheduled_date DATE,
  scheduled_time TIME,
  inspection_date TIMESTAMPTZ,

  -- Results
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, passed, failed
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  findings TEXT,
  issues_found TEXT[],
  corrective_actions TEXT,

  -- Follow-up
  requires_followup BOOLEAN DEFAULT false,
  followup_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVOICING & PAYMENTS
-- =============================================

-- Invoice status
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled');

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,

  -- Relationships
  customer_id UUID NOT NULL REFERENCES customers(id),
  property_id UUID REFERENCES properties(id),
  created_by UUID REFERENCES user_profiles(id),

  -- Invoice Details
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,

  -- Amounts
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,

  -- Status
  status invoice_status DEFAULT 'draft',

  -- Terms
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  terms_and_conditions TEXT,

  -- Dates
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),

  -- Item Details
  display_order INTEGER DEFAULT 0,
  description TEXT NOT NULL,

  -- Pricing
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),

  -- Payment Details
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- cash, check, credit_card, ach, online

  -- Reference Information
  reference_number TEXT, -- check number, transaction ID, etc.
  processor_transaction_id TEXT, -- Stripe, Square transaction ID

  -- Notes
  notes TEXT,

  -- Processing
  recorded_by UUID REFERENCES user_profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS & COMMUNICATION
-- =============================================

-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Channels
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,

  -- Event Types (JSONB for flexibility)
  preferences JSONB DEFAULT '{
    "job_assigned": {"email": true, "sms": true, "push": true, "in_app": true},
    "job_updated": {"email": true, "sms": false, "push": true, "in_app": true},
    "invoice_sent": {"email": true, "sms": false, "push": false, "in_app": true},
    "payment_received": {"email": true, "sms": false, "push": false, "in_app": true},
    "proposal_approved": {"email": true, "sms": true, "push": true, "in_app": true}
  }'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Notification Content
  type TEXT NOT NULL, -- job_assigned, invoice_sent, payment_received, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Related Entity
  related_entity_type TEXT, -- job, invoice, proposal, etc.
  related_entity_id UUID,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Delivery
  sent_via TEXT[], -- ['email', 'sms', 'push']

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDIT LOGS
-- =============================================

-- Audit logs (track all important changes)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who & When
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL, -- create, update, delete, approve, cancel, etc.

  -- What
  entity_type TEXT NOT NULL, -- job, invoice, proposal, etc.
  entity_id UUID NOT NULL,

  -- Details
  changes JSONB, -- Store old and new values
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Leads
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_source ON leads(lead_source_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Lead activities
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(lead_id, created_at DESC);

-- Customers
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_customers_email ON customers(email);

-- Properties
CREATE INDEX idx_properties_customer_id ON properties(customer_id);
CREATE INDEX idx_properties_active ON properties(is_active);

-- Proposals
CREATE INDEX idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX idx_proposals_customer_id ON proposals(customer_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);

-- Jobs
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_property_id ON jobs(property_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX idx_jobs_crew ON jobs(assigned_crew_id);
CREATE INDEX idx_jobs_employee ON jobs(assigned_employee_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Time entries
CREATE INDEX idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX idx_time_entries_job ON time_entries(job_id);
CREATE INDEX idx_time_entries_date ON time_entries(clock_in_time);
CREATE INDEX idx_time_entries_approved ON time_entries(is_approved);

-- Invoices
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);

-- Payments
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(user_id, created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic policies (these will be refined based on actual requirements)

-- User profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customers: All authenticated users can read, admin/manager can modify
CREATE POLICY "All users can view customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can modify customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Add more RLS policies as needed for each table

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate proposal numbers
CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.proposal_number IS NULL THEN
    NEW.proposal_number := 'PROP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('proposal_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE proposal_number_seq;

CREATE TRIGGER generate_proposal_number_trigger
  BEFORE INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION generate_proposal_number();

-- Function to auto-generate job numbers
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_number IS NULL THEN
    NEW.job_number := 'JOB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('job_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE job_number_seq;

CREATE TRIGGER generate_job_number_trigger
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION generate_job_number();

-- Function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE invoice_number_seq;

CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- Function to calculate invoice balance
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance_due := NEW.total - NEW.amount_paid;

  -- Update status based on balance
  IF NEW.balance_due <= 0 THEN
    NEW.status := 'paid';
  ELSIF NEW.amount_paid > 0 AND NEW.balance_due > 0 THEN
    NEW.status := 'partial';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.balance_due > 0 THEN
    NEW.status := 'overdue';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_invoice_balance_trigger
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_balance();

-- =============================================
-- SAMPLE DATA (OPTIONAL)
-- =============================================

-- You can insert sample data here for testing
-- This will be removed in production

COMMENT ON DATABASE CURRENT_DATABASE() IS 'RBC Field Management System - Complete schema for field service management including leads, proposals, jobs, time tracking, QC, invoicing, and payments';

