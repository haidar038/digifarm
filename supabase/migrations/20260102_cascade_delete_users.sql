-- =====================================================
-- Admin User Management Migration
-- =====================================================
-- This migration:
-- 1. Changes FK constraints on lands, productions, activities to CASCADE delete
-- 2. Ensures when a user is deleted, all their data is also deleted
-- =====================================================

-- Drop existing constraints and recreate with CASCADE
-- LANDS table
ALTER TABLE public.lands 
DROP CONSTRAINT IF EXISTS lands_user_id_fkey;

ALTER TABLE public.lands
ADD CONSTRAINT lands_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- PRODUCTIONS table
ALTER TABLE public.productions 
DROP CONSTRAINT IF EXISTS productions_user_id_fkey;

ALTER TABLE public.productions
ADD CONSTRAINT productions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ACTIVITIES table
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS activities_user_id_fkey;

ALTER TABLE public.activities
ADD CONSTRAINT activities_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add comments for documentation
COMMENT ON CONSTRAINT lands_user_id_fkey ON public.lands IS 
  'Cascade delete: when user is deleted, all their lands are also deleted';
COMMENT ON CONSTRAINT productions_user_id_fkey ON public.productions IS 
  'Cascade delete: when user is deleted, all their productions are also deleted';
COMMENT ON CONSTRAINT activities_user_id_fkey ON public.activities IS 
  'Cascade delete: when user is deleted, all their activities are also deleted';
