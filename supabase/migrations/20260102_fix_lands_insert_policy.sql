-- =====================================================
-- Fix lands insert policy for farmers
-- =====================================================
-- This migration fixes the RLS policy for lands table
-- to ensure farmers can insert their own lands correctly.
-- 
-- Issue: 403 error (42501) when farmer tries to add land
-- Cause: RLS policy evaluated before trigger sets user_id
-- Solution: Update policy to allow authenticated users to insert
--           when they set user_id to their own auth.uid()
-- =====================================================

-- Drop existing lands insert policy
DROP POLICY IF EXISTS "lands_insert_policy" ON public.lands;

-- Create new policy that allows:
-- 1. User inserting with their own user_id (user_id = auth.uid())
-- 2. User inserting with NULL user_id (trigger will set it)
-- 3. Admin can insert for any user
-- 4. Connected manager can insert for their farmer
CREATE POLICY "lands_insert_policy" ON public.lands
FOR INSERT WITH CHECK (
  -- Allow if user_id matches current user OR is NULL (will be set by trigger)
  (user_id = auth.uid() OR user_id IS NULL)
  -- OR if user is admin
  OR public.is_admin()
  -- OR if manager is connected to the farmer (for manager CRUD)
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

-- Also fix productions insert policy
DROP POLICY IF EXISTS "productions_insert_policy" ON public.productions;
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

-- Also fix activities insert policy
DROP POLICY IF EXISTS "activities_insert_policy" ON public.activities;
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

-- Done!
SELECT 'Lands insert policy fix completed!' as status;
