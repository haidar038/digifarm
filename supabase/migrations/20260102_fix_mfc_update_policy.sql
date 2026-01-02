-- =====================================================
-- Quick Fix: Manager Farmer Connections UPDATE Policy
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor
-- to fix 403 error when farmer approves connection
-- =====================================================

-- The issue: UPDATE policies need both USING and WITH CHECK
-- USING: checks if user can access the EXISTING row
-- WITH CHECK: checks if the NEW values after update are allowed
--
-- When farmer changes status from 'pending' to 'active':
-- - USING must pass on the original row (status = pending)
-- - WITH CHECK must pass on the new row (status = active/rejected)

DROP POLICY IF EXISTS "mfc_update_policy" ON public.manager_farmer_connections;

CREATE POLICY "mfc_update_policy" ON public.manager_farmer_connections
FOR UPDATE 
USING (
  -- Can access row if: farmer's own pending connection OR admin
  (farmer_id = auth.uid() AND status = 'pending'::connection_status)
  OR public.is_admin()
)
WITH CHECK (
  -- New values allowed if: farmer updating their connection OR admin
  farmer_id = auth.uid()
  OR public.is_admin()
);

-- Verify the policy was created
SELECT 
  'Policies on manager_farmer_connections:' as info,
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'manager_farmer_connections'
ORDER BY policyname;
