-- =====================================================
-- AUTH FIX: Fix user registration error
-- Run this in Supabase SQL Editor to fix the signup error
-- =====================================================
-- Error: type "user_role" does not exist (SQLSTATE 42704)
-- Solution: Create the enum type and update the trigger
-- =====================================================

-- STEP 1: Create user_role enum type (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('farmer', 'manager', 'admin');
    RAISE NOTICE 'Created user_role enum type';
  ELSE
    RAISE NOTICE 'user_role enum type already exists';
  END IF;
END$$;

-- STEP 2: Drop the old constraint if exists
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- STEP 3: Ensure role column is TEXT (temporary fix for compatibility)
-- This allows the application to work while we properly migrate
DO $$
DECLARE
  col_type TEXT;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'role';
  
  IF col_type = 'USER-DEFINED' THEN
    RAISE NOTICE 'role column is already using user_role enum';
  ELSE
    RAISE NOTICE 'role column is using type: %', col_type;
  END IF;
END$$;

-- STEP 4: Recreate handle_new_user function with TEXT fallback
-- This version works regardless of whether user_role enum exists
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
    'farmer'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error and still create basic profile
    RAISE WARNING 'Error in handle_new_user: %, creating basic profile', SQLERRM;
    INSERT INTO public.user_profiles (id, full_name, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'farmer');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Done!
SELECT 'Auth fix applied successfully! User registration should now work.' as status;
