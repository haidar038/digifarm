-- =====================================================
-- RBAC (Role-Based Access Control) System Migration
-- =====================================================
-- This migration implements:
-- 1. role ENUM type (farmer, manager, admin)
-- 2. Data isolation per user (user_id columns)
-- 3. Proper RLS policies for all tables
-- 4. Admin seeding for haidar038@gmail.com
-- 5. Updated handle_new_user trigger with all profile fields
-- =====================================================

-- =====================================================
-- STEP 1: Create role_type ENUM and migrate role column
-- =====================================================
DO $$
BEGIN
  -- Create enum type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('farmer', 'manager', 'admin');
  END IF;
END$$;

-- Drop the old check constraint
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add a temporary column with the enum type
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role_new user_role DEFAULT 'farmer';

-- Migrate existing data
UPDATE public.user_profiles 
SET role_new = role::user_role 
WHERE role IS NOT NULL AND role_new IS NULL;

-- Drop the old column and rename the new one (only if old column exists as TEXT)
DO $$
BEGIN
  -- Check if role column is TEXT type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'role' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.user_profiles DROP COLUMN role;
    ALTER TABLE public.user_profiles RENAME COLUMN role_new TO role;
  ELSE
    -- Role is already enum, just drop the temp column if exists
    ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS role_new;
  END IF;
END$$;

-- Set default and not null
ALTER TABLE public.user_profiles 
ALTER COLUMN role SET DEFAULT 'farmer'::user_role,
ALTER COLUMN role SET NOT NULL;

-- =====================================================
-- STEP 2: Add user_id column to data tables
-- =====================================================

-- Add user_id to lands table
ALTER TABLE public.lands 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add user_id to productions table  
ALTER TABLE public.productions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add user_id to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lands_user_id ON public.lands(user_id);
CREATE INDEX IF NOT EXISTS idx_productions_user_id ON public.productions(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);

-- =====================================================
-- STEP 3: Create helper functions for role checking
-- =====================================================

-- Drop existing functions first (required when changing return type)
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

-- Helper function to check if current user is admin
CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() = 'admin'::user_role;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if current user is manager or admin
CREATE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('manager'::user_role, 'admin'::user_role);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 4: Drop existing public RLS policies
-- =====================================================

-- Drop lands policies
DROP POLICY IF EXISTS "Allow public read access on lands" ON public.lands;
DROP POLICY IF EXISTS "Allow public insert access on lands" ON public.lands;
DROP POLICY IF EXISTS "Allow public update access on lands" ON public.lands;
DROP POLICY IF EXISTS "Allow public delete access on lands" ON public.lands;
DROP POLICY IF EXISTS "lands_select_policy" ON public.lands;
DROP POLICY IF EXISTS "lands_insert_policy" ON public.lands;
DROP POLICY IF EXISTS "lands_update_policy" ON public.lands;
DROP POLICY IF EXISTS "lands_delete_policy" ON public.lands;

-- Drop productions policies
DROP POLICY IF EXISTS "Allow public read access on productions" ON public.productions;
DROP POLICY IF EXISTS "Allow public insert access on productions" ON public.productions;
DROP POLICY IF EXISTS "Allow public update access on productions" ON public.productions;
DROP POLICY IF EXISTS "Allow public delete access on productions" ON public.productions;
DROP POLICY IF EXISTS "productions_select_policy" ON public.productions;
DROP POLICY IF EXISTS "productions_insert_policy" ON public.productions;
DROP POLICY IF EXISTS "productions_update_policy" ON public.productions;
DROP POLICY IF EXISTS "productions_delete_policy" ON public.productions;

-- Drop activities policies
DROP POLICY IF EXISTS "Allow public read access on activities" ON public.activities;
DROP POLICY IF EXISTS "Allow public insert access on activities" ON public.activities;
DROP POLICY IF EXISTS "Allow public update access on activities" ON public.activities;
DROP POLICY IF EXISTS "Allow public delete access on activities" ON public.activities;
DROP POLICY IF EXISTS "activities_select_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_insert_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_update_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_delete_policy" ON public.activities;

-- Drop user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;

-- =====================================================
-- STEP 5: Create proper RLS policies
-- =====================================================

-- ----- LANDS TABLE POLICIES -----
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
);

CREATE POLICY "lands_update_policy" ON public.lands
FOR UPDATE USING (
  user_id = auth.uid() 
  OR public.is_admin()
);

CREATE POLICY "lands_delete_policy" ON public.lands
FOR DELETE USING (
  user_id = auth.uid() 
  OR public.is_admin()
);

-- ----- PRODUCTIONS TABLE POLICIES -----
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
);

CREATE POLICY "productions_update_policy" ON public.productions
FOR UPDATE USING (
  user_id = auth.uid() 
  OR public.is_admin()
);

CREATE POLICY "productions_delete_policy" ON public.productions
FOR DELETE USING (
  user_id = auth.uid() 
  OR public.is_admin()
);

-- ----- ACTIVITIES TABLE POLICIES -----
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
);

CREATE POLICY "activities_update_policy" ON public.activities
FOR UPDATE USING (
  user_id = auth.uid() 
  OR public.is_admin()
);

CREATE POLICY "activities_delete_policy" ON public.activities
FOR DELETE USING (
  user_id = auth.uid() 
  OR public.is_admin()
);

-- ----- USER_PROFILES TABLE POLICIES -----
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
FOR SELECT USING (
  id = auth.uid() 
  OR public.is_admin()
);

CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
FOR UPDATE USING (
  id = auth.uid() 
  OR public.is_admin()
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
    id, 
    full_name, 
    phone,
    province_code,
    province_name,
    regency_code,
    regency_name,
    district_code,
    district_name,
    village_code,
    village_name,
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
-- STEP 7: Create function to auto-assign user_id
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for auto user_id assignment
DROP TRIGGER IF EXISTS set_lands_user_id ON public.lands;
CREATE TRIGGER set_lands_user_id
  BEFORE INSERT ON public.lands
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_productions_user_id ON public.productions;
CREATE TRIGGER set_productions_user_id
  BEFORE INSERT ON public.productions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_activities_user_id ON public.activities;
CREATE TRIGGER set_activities_user_id
  BEFORE INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

-- =====================================================
-- STEP 8: Seed admin user
-- =====================================================
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'haidar038@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Update their profile to admin role
    UPDATE public.user_profiles 
    SET role = 'admin'::user_role, updated_at = NOW()
    WHERE id = admin_user_id;
    
    -- Assign unassigned data to admin
    UPDATE public.lands SET user_id = admin_user_id WHERE user_id IS NULL;
    UPDATE public.productions SET user_id = admin_user_id WHERE user_id IS NULL;
    UPDATE public.activities SET user_id = admin_user_id WHERE user_id IS NULL;
    
    RAISE NOTICE 'Admin user set successfully for haidar038@gmail.com';
  ELSE
    RAISE NOTICE 'User haidar038@gmail.com not found. Admin will be set on first login.';
  END IF;
END $$;

-- =====================================================
-- STEP 9: Add comments for documentation
-- =====================================================
COMMENT ON TYPE user_role IS 'User roles for RBAC: farmer (default), manager (can view all), admin (full access)';
COMMENT ON FUNCTION public.get_user_role() IS 'Returns the role of the current authenticated user';
COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the current user is an admin';
COMMENT ON FUNCTION public.is_manager_or_admin() IS 'Returns true if the current user is a manager or admin';
COMMENT ON FUNCTION public.set_user_id() IS 'Automatically sets user_id to the current authenticated user on insert';
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile with all fields from registration metadata';

COMMENT ON COLUMN public.lands.user_id IS 'Owner of this land record';
COMMENT ON COLUMN public.productions.user_id IS 'Owner of this production record';
COMMENT ON COLUMN public.activities.user_id IS 'Owner of this activity record';
COMMENT ON COLUMN public.user_profiles.role IS 'User role for access control - uses user_role enum';
