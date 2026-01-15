-- =====================================================
-- Public Farmer Map Data Function
-- =====================================================
-- This function returns farmer location data for the
-- public landing page map. Uses SECURITY DEFINER to
-- bypass RLS policies safely, only returning limited
-- public-facing data.
--
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- Drop if exists for clean deployment
DROP FUNCTION IF EXISTS public.get_public_farmer_map_data();

-- Create the function
CREATE OR REPLACE FUNCTION public.get_public_farmer_map_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Allows the function to bypass RLS
SET search_path = public  -- Security best practice
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(farmer_data) INTO result
  FROM (
    SELECT DISTINCT ON (up.id)
      up.id,
      up.full_name,
      NULL::TEXT AS avatar_url,  -- user_profiles does not have avatar_url column yet
      up.regency_name,
      fp.farmer_code,
      fp.status,
      -- Land statistics (aggregated separately to avoid row multiplication)
      COALESCE(land_stats.total_area_m2, 0) AS total_area_m2,
      COALESCE(land_stats.land_count, 0) AS land_count,
      -- Commodities collected from all lands (flattened and unique)
      COALESCE(commodities_agg.commodities, '[]'::json) AS commodities,
      -- Use the first land's coordinates as the farmer's location
      land_stats.latitude,
      land_stats.longitude
    FROM user_profiles up
    INNER JOIN farmer_profiles fp ON fp.user_id = up.id
    -- Get land stats without unnest (avoids row multiplication)
    LEFT JOIN LATERAL (
      SELECT
        SUM(l.area_m2)::numeric AS total_area_m2,
        COUNT(*)::integer AS land_count,
        MIN(l.latitude) AS latitude,
        MIN(l.longitude) AS longitude
      FROM lands l
      WHERE l.user_id = up.id
        AND l.latitude IS NOT NULL
        AND l.longitude IS NOT NULL
    ) land_stats ON TRUE
    -- Get commodities separately
    LEFT JOIN LATERAL (
      SELECT json_agg(DISTINCT commodity) AS commodities
      FROM lands l
      CROSS JOIN LATERAL unnest(l.commodities) AS commodity
      WHERE l.user_id = up.id
        AND l.latitude IS NOT NULL
        AND l.longitude IS NOT NULL
    ) commodities_agg ON TRUE
    WHERE up.role = 'farmer'
      AND fp.status = 'active'
      AND land_stats.latitude IS NOT NULL
      AND land_stats.longitude IS NOT NULL
    ORDER BY up.id
  ) farmer_data;
  
  -- Return empty array if no data
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_farmer_map_data() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_farmer_map_data() TO authenticated;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to test the function:
-- SELECT public.get_public_farmer_map_data();
