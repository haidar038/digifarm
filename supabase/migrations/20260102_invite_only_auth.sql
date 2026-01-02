-- =====================================================
-- Invite-Only Authentication Migration
-- =====================================================
-- This migration:
-- 1. Adds must_change_password column for force password change on first login
-- 2. Updates user_profiles insert policy to allow service role
-- =====================================================

-- Add must_change_password column
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.must_change_password IS 
  'When true, user must change password on next login. Set by admin when creating user with temporary password.';

-- Create index for performance (will be checked on every login)
CREATE INDEX IF NOT EXISTS idx_user_profiles_must_change_password 
ON public.user_profiles(must_change_password) 
WHERE must_change_password = true;
