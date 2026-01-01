-- =====================================================
-- RBAC Fix Script v2 - Run this to fix the existing migration
-- =====================================================
-- This script handles the case where policies already exist
-- and depend on the functions we need to recreate
-- =====================================================

-- =====================================================
-- STEP 1: Create role_type ENUM (if not exists)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('farmer', 'manager', 'admin');
  END IF;
END$$;

-- =====================================================
-- STEP 2: Migrate role column from TEXT to ENUM
-- =====================================================

-- Drop the old check constraint
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add a temporary column with the enum type (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'role_new'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN role_new user_role DEFAULT 'farmer';
  END IF;
END$$;

-- Migrate existing data
UPDATE public.user_profiles 
SET role_new = role::user_role 
WHERE role IS NOT NULL 
  AND role_new IS NULL
  AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'role' 
    AND data_type = 'text'
  );

-- Drop the old column and rename the new one (only if old column is TEXT)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'role' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.user_profiles DROP COLUMN role;
    ALTER TABLE public.user_profiles RENAME COLUMN role_new TO role;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'role_new'
  ) THEN
    ALTER TABLE public.user_profiles DROP COLUMN role_new;
  END IF;
END$$;

-- Set default and not null
ALTER TABLE public.user_profiles 
ALTER COLUMN role SET DEFAULT 'farmer'::user_role;

DO $$
BEGIN
  ALTER TABLE public.user_profiles ALTER COLUMN role SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END$$;

-- =====================================================
-- STEP 3: Drop ALL policies that depend on functions
-- =====================================================

-- Drop lands policies
DROP POLICY IF EXISTS "lands_select_policy" ON public.lands;
DROP POLICY IF EXISTS "lands_insert_policy" ON public.lands;
DROP POLICY IF EXISTS "lands_update_policy" ON public.lands;
DROP POLICY IF EXISTS "lands_delete_policy" ON public.lands;

-- Drop productions policies
DROP POLICY IF EXISTS "productions_select_policy" ON public.productions;
DROP POLICY IF EXISTS "productions_insert_policy" ON public.productions;
DROP POLICY IF EXISTS "productions_update_policy" ON public.productions;
DROP POLICY IF EXISTS "productions_delete_policy" ON public.productions;

-- Drop activities policies
DROP POLICY IF EXISTS "activities_select_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_insert_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_update_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_delete_policy" ON public.activities;

-- Drop user_profiles policies
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;

-- =====================================================
-- STEP 4: Drop and recreate helper functions
-- =====================================================

DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_manager_or_admin();

CREATE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'farmer'::user_role
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() = 'admin'::user_role;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('manager'::user_role, 'admin'::user_role);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 5: Recreate RLS policies
-- =====================================================

-- LANDS
CREATE POLICY "lands_select_policy" ON public.lands
FOR SELECT USING (
  user_id = auth.uid() OR public.is_manager_or_admin() OR user_id IS NULL
);
CREATE POLICY "lands_insert_policy" ON public.lands
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL OR public.is_admin()
);
CREATE POLICY "lands_update_policy" ON public.lands
FOR UPDATE USING (
  user_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "lands_delete_policy" ON public.lands
FOR DELETE USING (
  user_id = auth.uid() OR public.is_admin()
);

-- PRODUCTIONS
CREATE POLICY "productions_select_policy" ON public.productions
FOR SELECT USING (
  user_id = auth.uid() OR public.is_manager_or_admin() OR user_id IS NULL
);
CREATE POLICY "productions_insert_policy" ON public.productions
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL OR public.is_admin()
);
CREATE POLICY "productions_update_policy" ON public.productions
FOR UPDATE USING (
  user_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "productions_delete_policy" ON public.productions
FOR DELETE USING (
  user_id = auth.uid() OR public.is_admin()
);

-- ACTIVITIES
CREATE POLICY "activities_select_policy" ON public.activities
FOR SELECT USING (
  user_id = auth.uid() OR public.is_manager_or_admin() OR user_id IS NULL
);
CREATE POLICY "activities_insert_policy" ON public.activities
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL OR public.is_admin()
);
CREATE POLICY "activities_update_policy" ON public.activities
FOR UPDATE USING (
  user_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "activities_delete_policy" ON public.activities
FOR DELETE USING (
  user_id = auth.uid() OR public.is_admin()
);

-- USER_PROFILES
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
FOR SELECT USING (
  id = auth.uid() OR public.is_admin()
);
CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
FOR UPDATE USING (
  id = auth.uid() OR public.is_admin()
);
CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
FOR INSERT WITH CHECK (
  id = auth.uid()
);

-- =====================================================
-- STEP 6: Update handle_new_user to include all fields
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, full_name, phone,
    province_code, province_name,
    regency_code, regency_name,
    district_code, district_name,
    village_code, village_name,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'province_code',
    NEW.raw_user_meta_data->>'province_name',
    NEW.raw_user_meta_data->>'regency_code',
    NEW.raw_user_meta_data->>'regency_name',
    NEW.raw_user_meta_data->>'district_code',
    NEW.raw_user_meta_data->>'district_name',
    NEW.raw_user_meta_data->>'village_code',
    NEW.raw_user_meta_data->>'village_name',
    'farmer'::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: Seed admin user
-- =====================================================
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'haidar038@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    UPDATE public.user_profiles 
    SET role = 'admin'::user_role, updated_at = NOW()
    WHERE id = admin_user_id;
    
    UPDATE public.lands SET user_id = admin_user_id WHERE user_id IS NULL;
    UPDATE public.productions SET user_id = admin_user_id WHERE user_id IS NULL;
    UPDATE public.activities SET user_id = admin_user_id WHERE user_id IS NULL;
    
    RAISE NOTICE 'Admin user set successfully for haidar038@gmail.com';
  ELSE
    RAISE NOTICE 'User haidar038@gmail.com not found. Please register first.';
  END IF;
END $$;

-- =====================================================
-- STEP 8: Add comments
-- =====================================================
COMMENT ON TYPE user_role IS 'User roles for RBAC: farmer (default), manager (can view all), admin (full access)';
COMMENT ON FUNCTION public.get_user_role() IS 'Returns the role of the current authenticated user';
COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the current user is an admin';
COMMENT ON FUNCTION public.is_manager_or_admin() IS 'Returns true if the current user is a manager or admin';
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile with all fields from registration metadata';
COMMENT ON COLUMN public.user_profiles.role IS 'User role for access control - uses user_role enum';

-- Done!
SELECT 'RBAC Fix v2 completed successfully!' as status;
