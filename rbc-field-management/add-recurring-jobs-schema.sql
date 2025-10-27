-- Add recurring job fields to jobs table
-- This script adds the necessary columns for robust recurring scheduling

-- Add recurring job columns
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS recurrence_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dsny_integration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dsny_pickup_days TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dsny_maintenance_days TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_recurring_instance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_job_id UUID REFERENCES jobs(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_is_recurring ON jobs(is_recurring);
CREATE INDEX IF NOT EXISTS idx_jobs_parent_job_id ON jobs(parent_job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_recurrence_type ON jobs(recurrence_type);

-- Add check constraints for data integrity
ALTER TABLE jobs
ADD CONSTRAINT IF NOT EXISTS check_recurrence_type
CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'custom'));

ALTER TABLE jobs
ADD CONSTRAINT IF NOT EXISTS check_recurrence_interval
CHECK (recurrence_interval >= 1 AND recurrence_interval <= 12);

ALTER TABLE jobs
ADD CONSTRAINT IF NOT EXISTS check_recurrence_days
CHECK (array_length(recurrence_days, 1) IS NULL OR array_length(recurrence_days, 1) <= 7);

-- Create a view for recurring job series
CREATE OR REPLACE VIEW recurring_job_series AS
SELECT
    parent.id as series_id,
    parent.job_number as series_number,
    parent.title as series_title,
    parent.customer_id,
    parent.property_id,
    parent.recurrence_type,
    parent.recurrence_interval,
    parent.recurrence_days,
    parent.recurrence_end_date,
    parent.recurrence_count,
    COUNT(child.id) as instances_created,
    MIN(child.scheduled_date) as first_occurrence,
    MAX(child.scheduled_date) as last_occurrence
FROM jobs parent
LEFT JOIN jobs child ON child.parent_job_id = parent.id
WHERE parent.is_recurring = true AND parent.parent_job_id IS NULL
GROUP BY parent.id, parent.job_number, parent.title, parent.customer_id,
         parent.property_id, parent.recurrence_type, parent.recurrence_interval,
         parent.recurrence_days, parent.recurrence_end_date, parent.recurrence_count;

-- Create a function to generate next recurring job instances
CREATE OR REPLACE FUNCTION generate_next_recurring_instances()
RETURNS INTEGER AS $$
DECLARE
    job_record RECORD;
    next_date DATE;
    job_count INTEGER := 0;
    current_date DATE;
    interval_days INTEGER;
BEGIN
    -- Find recurring jobs that need more instances
    FOR job_record IN
        SELECT * FROM jobs
        WHERE is_recurring = true
        AND parent_job_id IS NULL
        AND (recurrence_count = 0 OR
             (SELECT COUNT(*) FROM jobs WHERE parent_job_id = job_record.id) < recurrence_count)
        AND (recurrence_end_date IS NULL OR recurrence_end_date > CURRENT_DATE)
    LOOP
        -- Get the last scheduled instance
        SELECT MAX(scheduled_date) INTO current_date
        FROM jobs
        WHERE parent_job_id = job_record.id;

        -- If no instances exist, use the parent job's scheduled date
        IF current_date IS NULL THEN
            current_date := job_record.scheduled_date;
        END IF;

        -- Calculate next occurrence based on recurrence type
        CASE job_record.recurrence_type
            WHEN 'daily' THEN
                next_date := current_date + (job_record.recurrence_interval || ' days')::INTERVAL;
            WHEN 'weekly' THEN
                next_date := current_date + (job_record.recurrence_interval || ' weeks')::INTERVAL;
            WHEN 'monthly' THEN
                next_date := current_date + (job_record.recurrence_interval || ' months')::INTERVAL;
            WHEN 'custom' THEN
                -- For custom recurrence, find the next occurrence based on selected days
                next_date := get_next_custom_recurrence_date(current_date, job_record.recurrence_days);
            ELSE
                CONTINUE; -- Skip invalid recurrence types
        END CASE;

        -- Check if we should create this instance
        IF next_date IS NOT NULL
           AND (job_record.recurrence_end_date IS NULL OR next_date <= job_record.recurrence_end_date)
           AND (job_record.recurrence_count = 0 OR
                (SELECT COUNT(*) FROM jobs WHERE parent_job_id = job_record.id) < job_record.recurrence_count) THEN

            -- Create the new job instance
            INSERT INTO jobs (
                job_number, title, description, service_type, scheduled_date,
                scheduled_start_time, scheduled_end_time, estimated_duration,
                status, priority, quoted_amount, customer_id, property_id,
                notes, is_recurring_instance, parent_job_id
            ) VALUES (
                job_record.job_number || '-' || (SELECT COUNT(*) FROM jobs WHERE parent_job_id = job_record.id) + 1,
                job_record.title,
                job_record.description,
                job_record.service_type,
                next_date,
                job_record.scheduled_start_time,
                job_record.scheduled_end_time,
                job_record.estimated_duration,
                'scheduled',
                job_record.priority,
                job_record.quoted_amount,
                job_record.customer_id,
                job_record.property_id,
                job_record.notes,
                true,
                job_record.id
            );

            job_count := job_count + 1;
        END IF;
    END LOOP;

    RETURN job_count;
END;
$$ LANGUAGE plpgsql;

-- Helper function for custom recurrence
CREATE OR REPLACE FUNCTION get_next_custom_recurrence_date(start_date DATE, recurrence_days INTEGER[])
RETURNS DATE AS $$
DECLARE
    current_date DATE := start_date;
    check_date DATE;
    day_of_week INTEGER;
    i INTEGER;
BEGIN
    -- Check the next 7 days for a matching day
    FOR i IN 1..7 LOOP
        check_date := current_date + i;
        day_of_week := EXTRACT(DOW FROM check_date);

        -- Check if this day is in the recurrence days array
        IF day_of_week = ANY(recurrence_days) THEN
            RETURN check_date;
        END IF;
    END LOOP;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate recurring instances when a recurring job is created
CREATE OR REPLACE FUNCTION trigger_generate_recurring_instances()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate instances for parent recurring jobs
    IF NEW.is_recurring = true AND NEW.parent_job_id IS NULL THEN
        PERFORM generate_next_recurring_instances();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS generate_recurring_instances_trigger ON jobs;
CREATE TRIGGER generate_recurring_instances_trigger
    AFTER INSERT ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_recurring_instances();

-- Add comments for documentation
COMMENT ON COLUMN jobs.is_recurring IS 'Indicates if this job is part of a recurring series';
COMMENT ON COLUMN jobs.recurrence_type IS 'Type of recurrence: none, daily, weekly, monthly, custom';
COMMENT ON COLUMN jobs.recurrence_interval IS 'Interval for recurrence (e.g., every 2 weeks)';
COMMENT ON COLUMN jobs.recurrence_days IS 'Array of day numbers (0=Sunday) for custom recurrence';
COMMENT ON COLUMN jobs.recurrence_end_date IS 'End date for the recurring series';
COMMENT ON COLUMN jobs.recurrence_count IS 'Maximum number of occurrences (0 = unlimited)';
COMMENT ON COLUMN jobs.dsny_integration IS 'Whether this job syncs with DSNY pickup schedule';
COMMENT ON COLUMN jobs.dsny_pickup_days IS 'Array of DSNY pickup days';
COMMENT ON COLUMN jobs.dsny_maintenance_days IS 'Array of maintenance days (day before pickup)';
COMMENT ON COLUMN jobs.is_recurring_instance IS 'Indicates if this is an instance of a recurring job';
COMMENT ON COLUMN jobs.parent_job_id IS 'Reference to the parent recurring job';

COMMENT ON VIEW recurring_job_series IS 'View showing recurring job series with instance counts';
COMMENT ON FUNCTION generate_next_recurring_instances() IS 'Generates next instances for recurring jobs';
COMMENT ON FUNCTION get_next_custom_recurrence_date(DATE, INTEGER[]) IS 'Calculates next occurrence for custom recurrence patterns';
