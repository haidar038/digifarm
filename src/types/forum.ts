// =====================================================
// Forum Types
// =====================================================

export interface ForumCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    color: string;
    sort_order: number;
    created_at: string;
    // Computed fields (from count queries)
    thread_count?: number;
}

export interface ForumThread {
    id: string;
    title: string;
    slug: string;
    content: string;
    images: string[];
    category_id: string | null;
    author_id: string;
    is_solved: boolean;
    is_pinned: boolean;
    view_count: number;
    reply_count: number;
    last_reply_at: string | null;
    created_at: string;
    updated_at: string;
    // Relations (when joined)
    category?: ForumCategory;
    author?: {
        id: string;
        full_name: string;
        role: string;
    };
    tags?: ForumTag[];
}

export interface ForumReply {
    id: string;
    thread_id: string;
    parent_id: string | null;
    author_id: string;
    content: string;
    is_expert_answer: boolean;
    is_accepted_answer: boolean;
    upvote_count: number;
    created_at: string;
    updated_at: string;
    // Relations (when joined)
    author?: {
        id: string;
        full_name: string;
        role: string;
    };
    // For nested replies
    children?: ForumReply[];
    // User-specific data
    has_upvoted?: boolean;
}

export interface ForumUpvote {
    user_id: string;
    reply_id: string;
    created_at: string;
}

export interface ForumTag {
    id: string;
    name: string;
    slug: string;
}

export interface ForumThreadTag {
    thread_id: string;
    tag_id: string;
}

// =====================================================
// Form Types
// =====================================================

export interface ThreadFormData {
    title: string;
    content: string;
    category_id: string | null;
    images: string[];
    tag_ids: string[];
}

export interface ReplyFormData {
    content: string;
    parent_id?: string | null;
}

// =====================================================
// Filter Types
// =====================================================

export interface ForumFilters {
    category_id?: string;
    search?: string;
    is_solved?: boolean;
    author_id?: string;
    sort_by?: "recent" | "popular" | "unanswered";
    limit?: number;
    offset?: number;
}

// =====================================================
// Stats Types
// =====================================================

export interface ForumStats {
    total_threads: number;
    total_replies: number;
    total_solved: number;
    total_experts: number;
}

export interface UserForumStats {
    threads_created: number;
    replies_given: number;
    upvotes_received: number;
    accepted_answers: number;
}
