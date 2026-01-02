-- =====================================================
-- Manager-Farmer Connection System Migration
-- =====================================================
-- This migration implements:
-- 1. Connection status and type ENUM types
-- 2. manager_farmer_connections table
-- 3. connection_revoke_requests table
-- 4. Audit columns for existing tables
-- 5. Helper functions for connection checks
-- 6. Updated RLS policies for manager CRUD access
-- =====================================================

-- =====================================================
-- STEP 1: Create ENUM types for connection system
-- =====================================================
DO $$
BEGIN
  -- Create connection_status enum if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_status') THEN
    CREATE TYPE connection_status AS ENUM ('pending', 'active', 'rejected', 'revoked');
  END IF;
  
  -- Create connection_type enum if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_type') THEN
    CREATE TYPE connection_type AS ENUM ('admin_assigned', 'manager_requested');
  END IF;
END$$;

-- =====================================================
-- STEP 2: Create manager_farmer_connections table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.manager_farmer_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    status connection_status NOT NULL DEFAULT 'pending',
    connection_type connection_type NOT NULL,
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    responded_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES public.user_profiles(id),
    
    -- Notes
    request_note TEXT,
    response_note TEXT,
    
    -- Constraints: One farmer can only have one ACTIVE connection
    -- We use a partial unique index instead of UNIQUE constraint
    -- to allow multiple revoked/rejected connections in history
    CONSTRAINT different_users CHECK (manager_id != farmer_id)
);

-- Partial unique index: One farmer can only have one active/pending connection
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_farmer_connection 
ON public.manager_farmer_connections (farmer_id) 
WHERE status IN ('active', 'pending');

-- Regular indexes for performance
CREATE INDEX IF NOT EXISTS idx_mfc_manager_id ON public.manager_farmer_connections(manager_id);
CREATE INDEX IF NOT EXISTS idx_mfc_farmer_id ON public.manager_farmer_connections(farmer_id);
CREATE INDEX IF NOT EXISTS idx_mfc_status ON public.manager_farmer_connections(status);

-- =====================================================
-- STEP 3: Create connection_revoke_requests table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.connection_revoke_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES public.manager_farmer_connections(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.user_profiles(id),
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    responded_by UUID REFERENCES public.user_profiles(id),
    response_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crr_connection_id ON public.connection_revoke_requests(connection_id);
CREATE INDEX IF NOT EXISTS idx_crr_status ON public.connection_revoke_requests(status);

-- =====================================================
-- STEP 4: Add audit columns to existing tables
-- =====================================================

-- Add audit columns to lands table
ALTER TABLE public.lands 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.user_profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.user_profiles(id);

-- Add audit columns to productions table
ALTER TABLE public.productions 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.user_profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.user_profiles(id);

-- Add audit columns to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.user_profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.user_profiles(id);

-- =====================================================
-- STEP 5: Create helper functions
-- =====================================================

-- Drop existing functions if they exist (to allow recreation)
DROP FUNCTION IF EXISTS public.is_connected_manager(UUID);
DROP FUNCTION IF EXISTS public.get_farmer_manager(UUID);
DROP FUNCTION IF EXISTS public.can_manager_crud_farmer(UUID);

-- Check if current user is connected manager of a farmer
CREATE FUNCTION public.is_connected_manager(farmer_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.manager_farmer_connections
    WHERE manager_id = auth.uid()
    AND farmer_id = farmer_uuid
    AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public;

-- Get farmer's manager (returns NULL if no active connection)
CREATE FUNCTION public.get_farmer_manager(farmer_uuid UUID)
RETURNS UUID AS $$
  SELECT manager_id FROM public.manager_farmer_connections
  WHERE farmer_id = farmer_uuid AND status = 'active'
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public;

-- Check if current user (manager) can CRUD farmer's data
CREATE FUNCTION public.can_manager_crud_farmer(farmer_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT 
    public.is_admin() -- Admin can always CRUD
    OR (
      public.get_user_role() = 'manager'::user_role 
      AND public.is_connected_manager(farmer_uuid)
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public;

-- =====================================================
-- STEP 6: Update triggers for audit trail
-- =====================================================

-- Update set_user_id function to also set created_by
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  -- Set created_by if not already set
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Create function for setting updated_by on update
CREATE OR REPLACE FUNCTION public.set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Create triggers for updated_by
DROP TRIGGER IF EXISTS set_lands_updated_by ON public.lands;
CREATE TRIGGER set_lands_updated_by
  BEFORE UPDATE ON public.lands
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_by();

DROP TRIGGER IF EXISTS set_productions_updated_by ON public.productions;
CREATE TRIGGER set_productions_updated_by
  BEFORE UPDATE ON public.productions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_by();

DROP TRIGGER IF EXISTS set_activities_updated_by ON public.activities;
CREATE TRIGGER set_activities_updated_by
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_by();

-- =====================================================
-- STEP 7: Update RLS policies for manager CRUD access
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.manager_farmer_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_revoke_requests ENABLE ROW LEVEL SECURITY;

-- ----- MANAGER_FARMER_CONNECTIONS POLICIES -----
CREATE POLICY "mfc_select_policy" ON public.manager_farmer_connections
FOR SELECT USING (
  manager_id = auth.uid()  -- Manager can see their connections
  OR farmer_id = auth.uid() -- Farmer can see connections to them
  OR public.is_admin()      -- Admin can see all
);

CREATE POLICY "mfc_insert_policy" ON public.manager_farmer_connections
FOR INSERT WITH CHECK (
  (
    -- Manager can request connection (status must be pending)
    public.get_user_role() = 'manager'::user_role
    AND manager_id = auth.uid()
    AND status = 'pending'
    AND connection_type = 'manager_requested'
  )
  OR public.is_admin() -- Admin can create any connection
);

CREATE POLICY "mfc_update_policy" ON public.manager_farmer_connections
FOR UPDATE USING (
  (
    -- Farmer can approve/reject their pending connections
    farmer_id = auth.uid()
    AND status = 'pending'
  )
  OR public.is_admin() -- Admin can update any connection
);

CREATE POLICY "mfc_delete_policy" ON public.manager_farmer_connections
FOR DELETE USING (
  public.is_admin() -- Only admin can delete connections
);

-- ----- CONNECTION_REVOKE_REQUESTS POLICIES -----
CREATE POLICY "crr_select_policy" ON public.connection_revoke_requests
FOR SELECT USING (
  requested_by = auth.uid()
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.manager_farmer_connections mfc
    WHERE mfc.id = connection_id AND mfc.manager_id = auth.uid()
  )
);

CREATE POLICY "crr_insert_policy" ON public.connection_revoke_requests
FOR INSERT WITH CHECK (
  -- Farmer can request revoke for their connection
  EXISTS (
    SELECT 1 FROM public.manager_farmer_connections mfc
    WHERE mfc.id = connection_id 
    AND mfc.farmer_id = auth.uid()
    AND mfc.status = 'active'
  )
);

CREATE POLICY "crr_update_policy" ON public.connection_revoke_requests
FOR UPDATE USING (
  public.is_admin() -- Only admin can respond to revoke requests
);

-- ----- UPDATE LANDS POLICIES for Manager CRUD -----
DROP POLICY IF EXISTS "lands_select_policy" ON public.lands;
DROP POLICY IF EXISTS "lands_insert_policy" ON public.lands;
DROP POLICY IF EXISTS "lands_update_policy" ON public.lands;
DROP POLICY IF EXISTS "lands_delete_policy" ON public.lands;

CREATE POLICY "lands_select_policy" ON public.lands
FOR SELECT USING (
  user_id = auth.uid() 
  OR public.is_manager_or_admin()
  OR user_id IS NULL
);

CREATE POLICY "lands_insert_policy" ON public.lands
FOR INSERT WITH CHECK (
  user_id = auth.uid() 
  OR user_id IS NULL
  OR public.is_admin()
  OR public.can_manager_crud_farmer(user_id) -- Manager can insert for connected farmer
);

CREATE POLICY "lands_update_policy" ON public.lands
FOR UPDATE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR public.can_manager_crud_farmer(user_id) -- Manager can update connected farmer's data
);

CREATE POLICY "lands_delete_policy" ON public.lands
FOR DELETE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR public.can_manager_crud_farmer(user_id) -- Manager can delete connected farmer's data
);

-- ----- UPDATE PRODUCTIONS POLICIES for Manager CRUD -----
DROP POLICY IF EXISTS "productions_select_policy" ON public.productions;
DROP POLICY IF EXISTS "productions_insert_policy" ON public.productions;
DROP POLICY IF EXISTS "productions_update_policy" ON public.productions;
DROP POLICY IF EXISTS "productions_delete_policy" ON public.productions;

CREATE POLICY "productions_select_policy" ON public.productions
FOR SELECT USING (
  user_id = auth.uid() 
  OR public.is_manager_or_admin()
  OR user_id IS NULL
);

CREATE POLICY "productions_insert_policy" ON public.productions
FOR INSERT WITH CHECK (
  user_id = auth.uid() 
  OR user_id IS NULL
  OR public.is_admin()
  OR public.can_manager_crud_farmer(user_id)
);

CREATE POLICY "productions_update_policy" ON public.productions
FOR UPDATE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR public.can_manager_crud_farmer(user_id)
);

CREATE POLICY "productions_delete_policy" ON public.productions
FOR DELETE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR public.can_manager_crud_farmer(user_id)
);

-- ----- UPDATE ACTIVITIES POLICIES for Manager CRUD -----
DROP POLICY IF EXISTS "activities_select_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_insert_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_update_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_delete_policy" ON public.activities;

CREATE POLICY "activities_select_policy" ON public.activities
FOR SELECT USING (
  user_id = auth.uid() 
  OR public.is_manager_or_admin()
  OR user_id IS NULL
);

CREATE POLICY "activities_insert_policy" ON public.activities
FOR INSERT WITH CHECK (
  user_id = auth.uid() 
  OR user_id IS NULL
  OR public.is_admin()
  OR public.can_manager_crud_farmer(user_id)
);

CREATE POLICY "activities_update_policy" ON public.activities
FOR UPDATE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR public.can_manager_crud_farmer(user_id)
);

CREATE POLICY "activities_delete_policy" ON public.activities
FOR DELETE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR public.can_manager_crud_farmer(user_id)
);

-- =====================================================
-- STEP 8: Add updated_at trigger for connections table
-- =====================================================
DROP TRIGGER IF EXISTS handle_mfc_updated_at ON public.manager_farmer_connections;
CREATE TRIGGER handle_mfc_updated_at
  BEFORE UPDATE ON public.manager_farmer_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- STEP 9: Add comments for documentation
-- =====================================================
COMMENT ON TABLE public.manager_farmer_connections IS 'Stores manager-farmer connections for delegated data management';
COMMENT ON TABLE public.connection_revoke_requests IS 'Stores farmer requests to revoke manager connection';

COMMENT ON TYPE connection_status IS 'Status of manager-farmer connection: pending, active, rejected, revoked';
COMMENT ON TYPE connection_type IS 'How the connection was created: admin_assigned or manager_requested';

COMMENT ON FUNCTION public.is_connected_manager(UUID) IS 'Returns true if current user is an active connected manager of the given farmer';
COMMENT ON FUNCTION public.get_farmer_manager(UUID) IS 'Returns the manager_id of the active connection for a farmer, or NULL';
COMMENT ON FUNCTION public.can_manager_crud_farmer(UUID) IS 'Returns true if current user can CRUD data for the given farmer (admin or connected manager)';

COMMENT ON COLUMN public.lands.created_by IS 'User who created this record (may differ from user_id if manager created on behalf)';
COMMENT ON COLUMN public.lands.updated_by IS 'User who last updated this record';
COMMENT ON COLUMN public.productions.created_by IS 'User who created this record (may differ from user_id if manager created on behalf)';
COMMENT ON COLUMN public.productions.updated_by IS 'User who last updated this record';
COMMENT ON COLUMN public.activities.created_by IS 'User who created this record (may differ from user_id if manager created on behalf)';
COMMENT ON COLUMN public.activities.updated_by IS 'User who last updated this record';
