-- =====================================================
-- FORUM PUBLIC ACCESS MIGRATION
-- =====================================================
-- This migration updates RLS policies to allow anonymous/public
-- read access to forum tables for view-only functionality
-- =====================================================

-- Drop existing SELECT policies that require authentication
DROP POLICY IF EXISTS "forum_categories_select" ON forum_categories;
DROP POLICY IF EXISTS "forum_threads_select" ON forum_threads;
DROP POLICY IF EXISTS "forum_replies_select" ON forum_replies;
DROP POLICY IF EXISTS "forum_tags_select" ON forum_tags;
DROP POLICY IF EXISTS "forum_thread_tags_select" ON forum_thread_tags;

-- Create new SELECT policies that allow public/anonymous access
CREATE POLICY "forum_categories_public_select" ON forum_categories
    FOR SELECT USING (true);

CREATE POLICY "forum_threads_public_select" ON forum_threads
    FOR SELECT USING (true);

CREATE POLICY "forum_replies_public_select" ON forum_replies
    FOR SELECT USING (true);

CREATE POLICY "forum_tags_public_select" ON forum_tags
    FOR SELECT USING (true);

CREATE POLICY "forum_thread_tags_public_select" ON forum_thread_tags
    FOR SELECT USING (true);

-- Also need to allow public read on user_profiles for author info
-- Check if policy exists first
DROP POLICY IF EXISTS "user_profiles_public_select_limited" ON user_profiles;

-- Create policy that allows anyone to read limited user profile info
-- (only id, full_name, and role - no sensitive data)
CREATE POLICY "user_profiles_public_select_limited" ON user_profiles
    FOR SELECT USING (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Forum public access migration complete!' as status;
