-- =====================================================
-- Observer Read Access Migration
-- =====================================================
-- This migration adds read-only access for the observer role to:
-- 1. lands - SELECT
-- 2. productions - SELECT  
-- 3. activities - SELECT
-- 4. user_profiles - SELECT
-- 5. manager_farmer_connections - SELECT
--
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- =====================================================
-- SECTION 1: Create helper function for observer check
-- =====================================================

-- Create function to check if user is observer
CREATE OR REPLACE FUNCTION public.is_observer()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() = 'observer'::user_role;
$$;

-- Create function that includes observer in read access
CREATE OR REPLACE FUNCTION public.is_manager_admin_or_observer()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() IN ('manager'::user_role, 'admin'::user_role, 'observer'::user_role);
$$;

-- =====================================================
-- SECTION 2: Update LANDS SELECT policy
-- =====================================================

DROP POLICY IF EXISTS "lands_select_policy" ON public.lands;

CREATE POLICY "lands_select_policy" ON public.lands
FOR SELECT USING (
  user_id = auth.uid() 
  OR public.is_manager_admin_or_observer()
  OR user_id IS NULL
);

-- =====================================================
-- SECTION 3: Update PRODUCTIONS SELECT policy
-- =====================================================

DROP POLICY IF EXISTS "productions_select_policy" ON public.productions;

CREATE POLICY "productions_select_policy" ON public.productions
FOR SELECT USING (
  user_id = auth.uid() 
  OR public.is_manager_admin_or_observer()
  OR user_id IS NULL
);

-- =====================================================
-- SECTION 4: Update ACTIVITIES SELECT policy
-- =====================================================

DROP POLICY IF EXISTS "activities_select_policy" ON public.activities;

CREATE POLICY "activities_select_policy" ON public.activities
FOR SELECT USING (
  user_id = auth.uid() 
  OR public.is_manager_admin_or_observer()
  OR user_id IS NULL
);

-- =====================================================
-- SECTION 5: Update USER_PROFILES SELECT policy
-- =====================================================

DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;

CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
FOR SELECT USING (
  id = auth.uid() 
  OR public.is_manager_admin_or_observer()
);

-- =====================================================
-- SECTION 6: Update MANAGER_FARMER_CONNECTIONS SELECT policy
-- =====================================================

DROP POLICY IF EXISTS "mfc_select_policy" ON public.manager_farmer_connections;

-- Observer can see all connections (read-only for reporting)
CREATE POLICY "mfc_select_policy" ON public.manager_farmer_connections
FOR SELECT USING (
  manager_id = auth.uid()
  OR farmer_id = auth.uid()
  OR public.is_admin()
  OR public.is_observer()
);

-- =====================================================
-- Add comments for documentation
-- =====================================================

COMMENT ON FUNCTION public.is_observer() IS 'Returns true if the current user is an observer';
COMMENT ON FUNCTION public.is_manager_admin_or_observer() IS 'Returns true if the current user is a manager, admin, or observer';

-- =====================================================
-- Verification
-- =====================================================
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND policyname LIKE '%select%'
ORDER BY tablename;
