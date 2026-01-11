-- =====================================================
-- FORUM ACCEPT ANSWER POLICY FIX
-- =====================================================
-- This migration adds an RLS policy to allow thread authors
-- to update is_accepted_answer on replies to their threads
-- =====================================================

-- Allow thread author to update is_accepted_answer on replies to their thread
-- This fixes the bug where thread authors couldn't accept answers because
-- the existing policy only allowed reply authors to update their own replies
CREATE POLICY "forum_replies_thread_author_accept" ON forum_replies
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM forum_threads
            WHERE forum_threads.id = forum_replies.thread_id
            AND forum_threads.author_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM forum_threads
            WHERE forum_threads.id = forum_replies.thread_id
            AND forum_threads.author_id = auth.uid()
        )
    );

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Forum accept answer policy fix complete!' as status;
