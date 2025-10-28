-- Create activity_logs table for tracking activities across the application

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_type TEXT NOT NULL, -- e.g., 'property_updated', 'job_created', 'payment_received'
    entity_type TEXT NOT NULL, -- 'lead', 'customer', 'property', 'job', 'contract', 'proposal'
    entity_id UUID NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB, -- Additional data about the activity
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

