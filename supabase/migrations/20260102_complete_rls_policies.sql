-- =====================================================
-- Complete RLS Policies Migration
-- =====================================================
-- This migration adds all missing RLS policies for:
-- 1. lands - SELECT, UPDATE, DELETE
-- 2. productions - SELECT, UPDATE, DELETE  
-- 3. activities - SELECT, UPDATE, DELETE
-- 4. connection_revoke_requests - SELECT, UPDATE
-- 5. user_profiles - UPDATE
--
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- =====================================================
-- SECTION 1: LANDS TABLE POLICIES
-- =====================================================

-- Drop existing policies to recreate cleanly
DROP POLICY IF EXISTS "lands_select_policy" ON public.lands;
DROP POLICY IF EXISTS "lands_insert_policy" ON public.lands;
DROP POLICY IF EXISTS "lands_update_policy" ON public.lands;
DROP POLICY IF EXISTS "lands_delete_policy" ON public.lands;

-- SELECT: User sees own data, Manager/Admin see all
CREATE POLICY "lands_select_policy" ON public.lands
FOR SELECT USING (
  user_id = auth.uid() 
  OR public.is_manager_or_admin()
  OR user_id IS NULL
);

-- INSERT: User inserts own data, Manager for connected farmers, Admin for all
CREATE POLICY "lands_insert_policy" ON public.lands
FOR INSERT WITH CHECK (
  (user_id = auth.uid() OR user_id IS NULL)
  OR public.is_admin()
  OR (
    public.get_user_role() = 'manager'::user_role 
    AND EXISTS (
      SELECT 1 FROM public.manager_farmer_connections
      WHERE manager_id = auth.uid()
      AND farmer_id = user_id
      AND status = 'active'
    )
  )
);

-- UPDATE: User updates own data, Manager for connected farmers, Admin for all
CREATE POLICY "lands_update_policy" ON public.lands
FOR UPDATE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR (
    public.get_user_role() = 'manager'::user_role 
    AND EXISTS (
      SELECT 1 FROM public.manager_farmer_connections
      WHERE manager_id = auth.uid()
      AND farmer_id = user_id
      AND status = 'active'
    )
  )
);

-- DELETE: User deletes own data, Manager for connected farmers, Admin for all
CREATE POLICY "lands_delete_policy" ON public.lands
FOR DELETE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR (
    public.get_user_role() = 'manager'::user_role 
    AND EXISTS (
      SELECT 1 FROM public.manager_farmer_connections
      WHERE manager_id = auth.uid()
      AND farmer_id = user_id
      AND status = 'active'
    )
  )
);

-- =====================================================
-- SECTION 2: PRODUCTIONS TABLE POLICIES
-- =====================================================

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
  (user_id = auth.uid() OR user_id IS NULL)
  OR public.is_admin()
  OR (
    public.get_user_role() = 'manager'::user_role 
    AND EXISTS (
      SELECT 1 FROM public.manager_farmer_connections
      WHERE manager_id = auth.uid()
      AND farmer_id = user_id
      AND status = 'active'
    )
  )
);

CREATE POLICY "productions_update_policy" ON public.productions
FOR UPDATE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR (
    public.get_user_role() = 'manager'::user_role 
    AND EXISTS (
      SELECT 1 FROM public.manager_farmer_connections
      WHERE manager_id = auth.uid()
      AND farmer_id = user_id
      AND status = 'active'
    )
  )
);

CREATE POLICY "productions_delete_policy" ON public.productions
FOR DELETE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR (
    public.get_user_role() = 'manager'::user_role 
    AND EXISTS (
      SELECT 1 FROM public.manager_farmer_connections
      WHERE manager_id = auth.uid()
      AND farmer_id = user_id
      AND status = 'active'
    )
  )
);

-- =====================================================
-- SECTION 3: ACTIVITIES TABLE POLICIES
-- =====================================================

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
  (user_id = auth.uid() OR user_id IS NULL)
  OR public.is_admin()
  OR (
    public.get_user_role() = 'manager'::user_role 
    AND EXISTS (
      SELECT 1 FROM public.manager_farmer_connections
      WHERE manager_id = auth.uid()
      AND farmer_id = user_id
      AND status = 'active'
    )
  )
);

CREATE POLICY "activities_update_policy" ON public.activities
FOR UPDATE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR (
    public.get_user_role() = 'manager'::user_role 
    AND EXISTS (
      SELECT 1 FROM public.manager_farmer_connections
      WHERE manager_id = auth.uid()
      AND farmer_id = user_id
      AND status = 'active'
    )
  )
);

CREATE POLICY "activities_delete_policy" ON public.activities
FOR DELETE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR (
    public.get_user_role() = 'manager'::user_role 
    AND EXISTS (
      SELECT 1 FROM public.manager_farmer_connections
      WHERE manager_id = auth.uid()
      AND farmer_id = user_id
      AND status = 'active'
    )
  )
);

-- =====================================================
-- SECTION 4: CONNECTION_REVOKE_REQUESTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "crr_select_policy" ON public.connection_revoke_requests;
DROP POLICY IF EXISTS "crr_insert_policy" ON public.connection_revoke_requests;
DROP POLICY IF EXISTS "crr_update_policy" ON public.connection_revoke_requests;
DROP POLICY IF EXISTS "crr_delete_policy" ON public.connection_revoke_requests;

-- SELECT: Requester, related manager, or admin can see
CREATE POLICY "crr_select_policy" ON public.connection_revoke_requests
FOR SELECT USING (
  requested_by = auth.uid()
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.manager_farmer_connections mfc
    WHERE mfc.id = connection_id AND mfc.manager_id = auth.uid()
  )
);

-- INSERT: Farmer can request revoke for their active connection
CREATE POLICY "crr_insert_policy" ON public.connection_revoke_requests
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.manager_farmer_connections mfc
    WHERE mfc.id = connection_id 
    AND mfc.farmer_id = auth.uid()
    AND mfc.status = 'active'
  )
  OR public.is_admin()
);

-- UPDATE: Only admin can respond to revoke requests
CREATE POLICY "crr_update_policy" ON public.connection_revoke_requests
FOR UPDATE USING (
  public.is_admin()
);

-- DELETE: Only admin can delete revoke requests
CREATE POLICY "crr_delete_policy" ON public.connection_revoke_requests
FOR DELETE USING (
  public.is_admin()
);

-- =====================================================
-- SECTION 5: USER_PROFILES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;

-- SELECT: User sees own profile, Manager/Admin see all
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
FOR SELECT USING (
  id = auth.uid() 
  OR public.is_manager_or_admin()
);

-- INSERT: User can only create their own profile (done via trigger)
CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
FOR INSERT WITH CHECK (
  id = auth.uid()
  OR public.is_admin()
);

-- UPDATE: User updates own profile, Admin can update any
CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
FOR UPDATE USING (
  id = auth.uid() 
  OR public.is_admin()
);

-- DELETE: Only admin can delete profiles
CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
FOR DELETE USING (
  public.is_admin()
);

-- =====================================================
-- SECTION 6: MANAGER_FARMER_CONNECTIONS TABLE POLICIES
-- =====================================================
-- Note: This table may already have policies, but we 
-- recreate them to ensure consistency

DROP POLICY IF EXISTS "mfc_select_policy" ON public.manager_farmer_connections;
DROP POLICY IF EXISTS "mfc_insert_policy" ON public.manager_farmer_connections;
DROP POLICY IF EXISTS "mfc_update_policy" ON public.manager_farmer_connections;
DROP POLICY IF EXISTS "mfc_delete_policy" ON public.manager_farmer_connections;

-- SELECT: Manager sees their connections, Farmer sees connections to them, Admin sees all
CREATE POLICY "mfc_select_policy" ON public.manager_farmer_connections
FOR SELECT USING (
  manager_id = auth.uid()
  OR farmer_id = auth.uid()
  OR public.is_admin()
);

-- INSERT: Manager can request connection (pending), Admin can create any
CREATE POLICY "mfc_insert_policy" ON public.manager_farmer_connections
FOR INSERT WITH CHECK (
  (
    public.get_user_role() = 'manager'::user_role
    AND manager_id = auth.uid()
  )
  OR public.is_admin()
);

-- UPDATE: Farmer can approve/reject their pending connections, Admin can update any
-- USING: checks existing row (must be pending)
-- WITH CHECK: allows new values after update (active/rejected)
CREATE POLICY "mfc_update_policy" ON public.manager_farmer_connections
FOR UPDATE 
USING (
  (farmer_id = auth.uid() AND status = 'pending'::connection_status)
  OR public.is_admin()
)
WITH CHECK (
  farmer_id = auth.uid()
  OR public.is_admin()
);

-- DELETE: Only admin can delete connections
CREATE POLICY "mfc_delete_policy" ON public.manager_farmer_connections
FOR DELETE USING (
  public.is_admin()
);

-- =====================================================
-- DONE - Verification
-- =====================================================
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
