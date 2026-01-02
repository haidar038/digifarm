-- =====================================================
-- CRITICAL FIX: Convert role column to proper enum type
-- =====================================================
-- This fixes PostgREST error 42704 (undefined_object)
-- The issue is mismatch between column type and enum type
-- =====================================================

-- Step 1: Ensure user_role enum exists with all values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('farmer', 'manager', 'admin', 'observer');
    RAISE NOTICE 'Created user_role enum type';
  END IF;
END$$;

-- Step 2: Add observer value if missing
DO $$
BEGIN
  -- Check if observer exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'observer'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'observer';
    RAISE NOTICE 'Added observer to user_role enum';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'observer already exists in enum';
END$$;

-- Step 3: Ensure role column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'role' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN role user_role DEFAULT 'farmer'::user_role;
    RAISE NOTICE 'Added role column';
  END IF;
END$$;

-- Step 4: Update any null or invalid roles to 'farmer'
UPDATE public.user_profiles 
SET role = 'farmer' 
WHERE role IS NULL;

-- Step 5: Convert role column from TEXT to user_role enum if needed
DO $$
DECLARE
  current_type TEXT;
BEGIN
  SELECT udt_name INTO current_type
  FROM information_schema.columns 
  WHERE table_name = 'user_profiles' 
  AND column_name = 'role' 
  AND table_schema = 'public';
  
  RAISE NOTICE 'Current role column type: %', current_type;
  
  IF current_type != 'user_role' THEN
    RAISE NOTICE 'Converting role column from % to user_role...', current_type;
    
    -- First ensure all values are valid
    UPDATE public.user_profiles 
    SET role = 'farmer' 
    WHERE role NOT IN ('farmer', 'manager', 'admin', 'observer');
    
    -- Convert to enum
    ALTER TABLE public.user_profiles 
    ALTER COLUMN role TYPE user_role USING role::user_role;
    
    RAISE NOTICE 'Conversion complete!';
  ELSE
    RAISE NOTICE 'Column already using user_role type';
  END IF;
END$$;

-- Step 6: Set default
ALTER TABLE public.user_profiles 
ALTER COLUMN role SET DEFAULT 'farmer'::user_role;

-- Step 7: Update handle_new_user function to use proper enum casting
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
    'farmer'::user_role  -- Proper enum cast
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %, creating basic profile', SQLERRM;
    INSERT INTO public.user_profiles (id, full_name, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'farmer'::user_role);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Step 8: Reload PostgREST schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';

-- Step 9: Verify fix
SELECT 'Fix applied! Verify role column:' as status;
SELECT column_name, udt_name as type
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'role';
