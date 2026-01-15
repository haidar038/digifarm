-- =====================================================
-- Public Activity Stats Function
-- =====================================================
-- This function returns aggregated statistics for the
-- public landing page. Uses SECURITY DEFINER to bypass
-- RLS policies safely, only returning aggregate counts
-- (no individual user data exposed).
--
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- Drop if exists for clean deployment
DROP FUNCTION IF EXISTS public.get_public_activity_stats();

-- Create the function
CREATE OR REPLACE FUNCTION public.get_public_activity_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Allows the function to bypass RLS
SET search_path = public  -- Security best practice
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalProduction', COALESCE(
      (SELECT SUM(harvest_yield_kg) FROM productions WHERE status = 'harvested'), 0
    ),
    'totalLandArea', COALESCE(
      (SELECT SUM(area_m2) FROM lands), 0
    ),
    'landCount', COALESCE(
      (SELECT COUNT(*) FROM lands), 0
    ),
    'farmerCount', COALESCE(
      (SELECT COUNT(*) FROM user_profiles WHERE role = 'farmer'), 0
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_activity_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_activity_stats() TO authenticated;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to test the function:
-- SELECT public.get_public_activity_stats();
