-- =====================================================
-- Debug and Fix user_profiles table
-- Run this in Supabase SQL Editor to diagnose the issue
-- =====================================================

-- Step 1: Check if user_role type exists and its values
SELECT typname, enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname = 'user_role';

-- Step 2: Check the role column definition
SELECT column_name, data_type, udt_name, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND table_schema = 'public';

-- Step 3: Reload PostgREST schema cache (important after migrations!)
NOTIFY pgrst, 'reload schema';

-- Step 4: If role column is TEXT instead of user_role enum, fix it:
-- First check if it's TEXT
DO $$
DECLARE
    col_type TEXT;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'user_profiles' 
    AND column_name = 'role'
    AND table_schema = 'public';
    
    RAISE NOTICE 'Current role column type: %', col_type;
    
    -- If it's TEXT, we need to convert it
    IF col_type = 'text' OR col_type = 'character varying' THEN
        RAISE NOTICE 'Converting role column to user_role enum...';
        
        -- Update any invalid values to 'farmer'
        UPDATE public.user_profiles 
        SET role = 'farmer' 
        WHERE role NOT IN ('farmer', 'manager', 'admin', 'observer') OR role IS NULL;
        
        -- Alter the column type
        ALTER TABLE public.user_profiles 
        ALTER COLUMN role TYPE user_role USING role::user_role;
        
        ALTER TABLE public.user_profiles 
        ALTER COLUMN role SET DEFAULT 'farmer'::user_role;
        
        RAISE NOTICE 'Conversion complete!';
    ELSE
        RAISE NOTICE 'Role column is already using type: %', col_type;
    END IF;
END$$;

-- Step 5: Reload schema again after changes
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify the fix
SELECT id, full_name, role, pg_typeof(role) as role_type
FROM public.user_profiles
LIMIT 5;
