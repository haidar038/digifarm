-- =====================================================
-- Audit Log System Migration
-- Created: 2026-01-03
-- Description: Dedicated audit log table with triggers
-- =====================================================

-- 1. Create ENUM type for audit actions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
        CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete');
    END IF;
END $$;

-- 2. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    action audit_action NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    changes JSONB, -- Diff between old and new
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_logs(record_id);

-- 4. Enable RLS (Admin only access)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- Create policies
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (TRUE);

-- 5. Helper function to compute JSONB diff
CREATE OR REPLACE FUNCTION jsonb_diff(old_data JSONB, new_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB := '{}';
    key TEXT;
BEGIN
    -- Get all keys from both objects
    FOR key IN SELECT DISTINCT jsonb_object_keys(old_data) UNION SELECT DISTINCT jsonb_object_keys(new_data)
    LOOP
        -- Check if values are different
        IF (old_data -> key) IS DISTINCT FROM (new_data -> key) THEN
            result := result || jsonb_build_object(
                key, 
                jsonb_build_object(
                    'old', old_data -> key,
                    'new', new_data -> key
                )
            );
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$;

-- 6. Create trigger function for logging table changes
CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    current_user_role TEXT;
BEGIN
    -- Get current user info
    current_user_id := auth.uid();
    
    -- Get user email and role if authenticated
    IF current_user_id IS NOT NULL THEN
        SELECT email INTO current_user_email
        FROM auth.users
        WHERE id = current_user_id;
        
        SELECT role INTO current_user_role
        FROM user_profiles
        WHERE id = current_user_id;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            user_id, 
            user_email, 
            user_role, 
            action, 
            table_name, 
            record_id, 
            new_data
        )
        VALUES (
            current_user_id, 
            current_user_email, 
            current_user_role, 
            'create', 
            TG_TABLE_NAME, 
            NEW.id, 
            to_jsonb(NEW)
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            user_id, 
            user_email, 
            user_role, 
            action, 
            table_name, 
            record_id, 
            old_data, 
            new_data, 
            changes
        )
        VALUES (
            current_user_id, 
            current_user_email, 
            current_user_role, 
            'update', 
            TG_TABLE_NAME, 
            NEW.id, 
            to_jsonb(OLD), 
            to_jsonb(NEW),
            jsonb_diff(to_jsonb(OLD), to_jsonb(NEW))
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            user_id, 
            user_email, 
            user_role, 
            action, 
            table_name, 
            record_id, 
            old_data
        )
        VALUES (
            current_user_id, 
            current_user_email, 
            current_user_role, 
            'delete', 
            TG_TABLE_NAME, 
            OLD.id, 
            to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- 7. Apply triggers to tables
-- Drop existing triggers if any
DROP TRIGGER IF EXISTS audit_lands ON lands;
DROP TRIGGER IF EXISTS audit_productions ON productions;
DROP TRIGGER IF EXISTS audit_activities ON activities;

-- Create triggers
CREATE TRIGGER audit_lands 
    AFTER INSERT OR UPDATE OR DELETE ON lands
    FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER audit_productions 
    AFTER INSERT OR UPDATE OR DELETE ON productions
    FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER audit_activities 
    AFTER INSERT OR UPDATE OR DELETE ON activities
    FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- Done!
COMMENT ON TABLE audit_logs IS 'Stores audit trail for all changes to critical tables';
