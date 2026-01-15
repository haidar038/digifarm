-- =====================================================
-- Farmer Profiles Table
-- =====================================================
-- Creates a separate table for farmer-specific attributes
-- following the table-per-role pattern
-- =====================================================

-- Step 1: Create farmer_status enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'farmer_status') THEN
    CREATE TYPE farmer_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
    RAISE NOTICE 'Created farmer_status enum type';
  END IF;
END$$;

-- Step 2: Create sequence for farmer_code generation (RDF-XXXXXX format)
CREATE SEQUENCE IF NOT EXISTS farmer_code_seq START 1;

-- Step 3: Create function to generate farmer_code
CREATE OR REPLACE FUNCTION generate_farmer_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RDF-' || LPAD(nextval('farmer_code_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create farmer_profiles table
CREATE TABLE IF NOT EXISTS public.farmer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  farmer_code VARCHAR(10) NOT NULL UNIQUE DEFAULT generate_farmer_code(),
  status farmer_status NOT NULL DEFAULT 'active'::farmer_status,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create updated_at trigger for farmer_profiles
CREATE TRIGGER on_farmer_profiles_updated
  BEFORE UPDATE ON public.farmer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Step 6: Enable Row Level Security
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS Policies

-- Policy: Farmers can view their own farmer_profile
CREATE POLICY "Farmers can view own farmer_profile"
ON public.farmer_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can view all farmer_profiles
CREATE POLICY "Admins can view all farmer_profiles"
ON public.farmer_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Policy: Admins can update all farmer_profiles
CREATE POLICY "Admins can update all farmer_profiles"
ON public.farmer_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Policy: Managers can view farmer_profiles of their connected farmers
CREATE POLICY "Managers can view connected farmer_profiles"
ON public.farmer_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.manager_farmer_connections mfc
    JOIN public.user_profiles up ON up.id = auth.uid()
    WHERE mfc.farmer_id = farmer_profiles.user_id
    AND mfc.manager_id = auth.uid()
    AND mfc.status = 'active'
    AND up.role = 'manager'::user_role
  )
);

-- Policy: Observers can view all farmer_profiles (read-only)
CREATE POLICY "Observers can view all farmer_profiles"
ON public.farmer_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'observer'::user_role
  )
);

-- Step 8: Migrate existing farmers to have farmer_profiles records
-- This inserts farmer_profiles for all existing users with role='farmer'
INSERT INTO public.farmer_profiles (user_id)
SELECT id FROM public.user_profiles
WHERE role = 'farmer'::user_role
AND NOT EXISTS (
  SELECT 1 FROM public.farmer_profiles fp WHERE fp.user_id = user_profiles.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 9: Update handle_new_user function to also create farmer_profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles
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
  
  -- Also create farmer_profile for the new farmer
  INSERT INTO public.farmer_profiles (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %, creating basic profile', SQLERRM;
    -- Fallback: create basic profile
    INSERT INTO public.user_profiles (id, full_name, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'farmer'::user_role);
    -- Try to create farmer_profile even in fallback
    BEGIN
      INSERT INTO public.farmer_profiles (user_id) VALUES (NEW.id);
    EXCEPTION WHEN others THEN
      RAISE WARNING 'Could not create farmer_profile: %', SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Step 10: Create index for performance
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user_id ON public.farmer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_status ON public.farmer_profiles(status);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_farmer_code ON public.farmer_profiles(farmer_code);

-- Step 11: Add comment for documentation
COMMENT ON TABLE public.farmer_profiles IS 'Stores farmer-specific profile information including unique farmer code and status';
COMMENT ON COLUMN public.farmer_profiles.farmer_code IS 'Unique identifier for farmers in format RDF-XXXXXX';
COMMENT ON COLUMN public.farmer_profiles.status IS 'Current status of the farmer: active, inactive, pending, or suspended';

-- Step 12: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verification query (run after migration)
-- SELECT up.full_name, up.role, fp.farmer_code, fp.status
-- FROM user_profiles up
-- LEFT JOIN farmer_profiles fp ON fp.user_id = up.id
-- WHERE up.role = 'farmer'::user_role;
