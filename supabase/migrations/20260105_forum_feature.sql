-- =====================================================
-- FORUM FEATURE MIGRATION
-- =====================================================
-- This migration creates all tables required for the Forum feature
-- including expert role, forum tables, RLS policies, and storage bucket
-- =====================================================

-- Step 1: Add expert role to user_role enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'expert'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'expert';
    RAISE NOTICE 'Added expert to user_role enum';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'expert already exists in enum';
END$$;

-- Step 2: Create forum_categories table
CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6366f1',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create forum_threads table
CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    category_id UUID REFERENCES forum_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_solved BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create forum_replies table with parent_id for nested replies
CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_expert_answer BOOLEAN DEFAULT FALSE,
    is_accepted_answer BOOLEAN DEFAULT FALSE,
    upvote_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create forum_upvotes table
CREATE TABLE IF NOT EXISTS forum_upvotes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, reply_id)
);

-- Step 6: Create forum_tags table
CREATE TABLE IF NOT EXISTS forum_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 7: Create forum_thread_tags junction table
CREATE TABLE IF NOT EXISTS forum_thread_tags (
    thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES forum_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (thread_id, tag_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author ON forum_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created ON forum_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_slug ON forum_threads(slug);

CREATE INDEX IF NOT EXISTS idx_forum_replies_thread ON forum_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_parent ON forum_replies(parent_id);

CREATE INDEX IF NOT EXISTS idx_forum_upvotes_reply ON forum_upvotes(reply_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at on forum_threads
CREATE OR REPLACE FUNCTION update_forum_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS forum_threads_updated_at ON forum_threads;
CREATE TRIGGER forum_threads_updated_at
    BEFORE UPDATE ON forum_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_thread_updated_at();

-- Trigger to update updated_at on forum_replies
DROP TRIGGER IF EXISTS forum_replies_updated_at ON forum_replies;
CREATE TRIGGER forum_replies_updated_at
    BEFORE UPDATE ON forum_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_thread_updated_at();

-- Trigger to update reply_count and last_reply_at on thread
CREATE OR REPLACE FUNCTION update_thread_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_threads
        SET reply_count = reply_count + 1,
            last_reply_at = NOW()
        WHERE id = NEW.thread_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_threads
        SET reply_count = GREATEST(0, reply_count - 1)
        WHERE id = OLD.thread_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS forum_reply_stats ON forum_replies;
CREATE TRIGGER forum_reply_stats
    AFTER INSERT OR DELETE ON forum_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_reply_stats();

-- Trigger to update upvote_count on reply
CREATE OR REPLACE FUNCTION update_reply_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_replies
        SET upvote_count = upvote_count + 1
        WHERE id = NEW.reply_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_replies
        SET upvote_count = GREATEST(0, upvote_count - 1)
        WHERE id = OLD.reply_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS forum_upvote_count ON forum_upvotes;
CREATE TRIGGER forum_upvote_count
    AFTER INSERT OR DELETE ON forum_upvotes
    FOR EACH ROW
    EXECUTE FUNCTION update_reply_upvote_count();

-- Trigger to set is_expert_answer based on author role
CREATE OR REPLACE FUNCTION set_expert_answer_flag()
RETURNS TRIGGER AS $$
DECLARE
    author_role TEXT;
BEGIN
    SELECT role INTO author_role
    FROM user_profiles
    WHERE id = NEW.author_id;
    
    IF author_role = 'expert' THEN
        NEW.is_expert_answer = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS forum_set_expert_answer ON forum_replies;
CREATE TRIGGER forum_set_expert_answer
    BEFORE INSERT ON forum_replies
    FOR EACH ROW
    EXECUTE FUNCTION set_expert_answer_flag();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_thread_tags ENABLE ROW LEVEL SECURITY;

-- Categories: Anyone authenticated can read
CREATE POLICY "forum_categories_select" ON forum_categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Categories: Only admin can manage
CREATE POLICY "forum_categories_admin_all" ON forum_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Threads: Authenticated users can read all threads
CREATE POLICY "forum_threads_select" ON forum_threads
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Threads: Users can insert their own threads
CREATE POLICY "forum_threads_insert" ON forum_threads
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Threads: Users can update their own threads
CREATE POLICY "forum_threads_update" ON forum_threads
    FOR UPDATE USING (auth.uid() = author_id);

-- Threads: Users can delete their own threads, admin can delete any
CREATE POLICY "forum_threads_delete" ON forum_threads
    FOR DELETE USING (
        auth.uid() = author_id OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Replies: Authenticated users can read all replies
CREATE POLICY "forum_replies_select" ON forum_replies
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Replies: Users can insert their own replies
CREATE POLICY "forum_replies_insert" ON forum_replies
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Replies: Users can update their own replies
CREATE POLICY "forum_replies_update" ON forum_replies
    FOR UPDATE USING (auth.uid() = author_id);

-- Replies: Users can delete their own replies, admin can delete any
CREATE POLICY "forum_replies_delete" ON forum_replies
    FOR DELETE USING (
        auth.uid() = author_id OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Upvotes: Authenticated users can read all upvotes
CREATE POLICY "forum_upvotes_select" ON forum_upvotes
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Upvotes: Users can manage their own upvotes
CREATE POLICY "forum_upvotes_insert" ON forum_upvotes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "forum_upvotes_delete" ON forum_upvotes
    FOR DELETE USING (auth.uid() = user_id);

-- Tags: Anyone authenticated can read
CREATE POLICY "forum_tags_select" ON forum_tags
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Tags: Admin can manage
CREATE POLICY "forum_tags_admin_all" ON forum_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Thread Tags: Anyone authenticated can read
CREATE POLICY "forum_thread_tags_select" ON forum_thread_tags
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Thread Tags: Thread author can manage
CREATE POLICY "forum_thread_tags_manage" ON forum_thread_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM forum_threads
            WHERE id = thread_id AND author_id = auth.uid()
        )
    );

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'forum-attachments',
    'forum-attachments',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "forum_attachments_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'forum-attachments');

CREATE POLICY "forum_attachments_auth_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'forum-attachments' AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "forum_attachments_owner_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'forum-attachments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default forum categories
INSERT INTO forum_categories (name, slug, description, icon, color, sort_order)
VALUES
    ('Tanya Jawab Umum', 'tanya-jawab', 'Pertanyaan umum seputar pertanian', 'HelpCircle', '#6366f1', 1),
    ('Budidaya Tanaman', 'budidaya', 'Diskusi teknik budidaya tanaman', 'Leaf', '#22c55e', 2),
    ('Hama & Penyakit', 'hama-penyakit', 'Konsultasi hama dan penyakit tanaman', 'Bug', '#ef4444', 3),
    ('Teknologi Pertanian', 'teknologi', 'Diskusi teknologi dan inovasi pertanian', 'Cpu', '#3b82f6', 4),
    ('Pemasaran', 'pemasaran', 'Tips pemasaran hasil panen', 'ShoppingBag', '#f59e0b', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert some default tags
INSERT INTO forum_tags (name, slug)
VALUES
    ('Pemula', 'pemula'),
    ('Tips', 'tips'),
    ('Solusi', 'solusi'),
    ('Diskusi', 'diskusi'),
    ('Cabai', 'cabai'),
    ('Tomat', 'tomat'),
    ('Bawang', 'bawang'),
    ('Organik', 'organik'),
    ('Pupuk', 'pupuk'),
    ('Irigasi', 'irigasi')
ON CONFLICT (slug) DO NOTHING;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Forum feature migration complete!' as status;
