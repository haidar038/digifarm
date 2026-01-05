// =====================================================
// Article Types
// =====================================================

export type ArticleStatus = "draft" | "published" | "archived";

export interface ArticleCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    created_at: string;
}

export interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    cover_image: string | null;
    category_id: string | null;
    author_id: string | null;
    status: ArticleStatus;
    published_at: string | null;
    view_count: number;
    created_at: string;
    updated_at: string;
    // Relations (when joined)
    category?: ArticleCategory;
    author?: {
        full_name: string;
    };
    tags?: ArticleTag[];
}

export interface ArticleTag {
    id: string;
    name: string;
    slug: string;
}

export interface ArticleTagRelation {
    article_id: string;
    tag_id: string;
}

// =====================================================
// Form Types
// =====================================================

export interface ArticleFormData {
    title: string;
    excerpt: string;
    content: string;
    cover_image: string | null;
    category_id: string | null;
    status: ArticleStatus;
    tag_ids: string[];
}

// =====================================================
// Filter Types
// =====================================================

export interface ArticleFilters {
    search?: string;
    category_id?: string;
    status?: ArticleStatus | "all";
    limit?: number;
    offset?: number;
}
