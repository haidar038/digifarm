import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Article, ArticleCategory, ArticleTag, ArticleFilters, ArticleFormData } from "@/types/article";
import { generateSlug } from "@/lib/article-utils";
import { toast } from "@/hooks/use-toast";

// =====================================================
// Query Keys
// =====================================================

export const articleKeys = {
    all: ["articles"] as const,
    lists: () => [...articleKeys.all, "list"] as const,
    list: (filters: ArticleFilters) => [...articleKeys.lists(), filters] as const,
    details: () => [...articleKeys.all, "detail"] as const,
    detail: (slug: string) => [...articleKeys.details(), slug] as const,
    categories: () => [...articleKeys.all, "categories"] as const,
    tags: () => [...articleKeys.all, "tags"] as const,
};

// =====================================================
// Fetch Articles (Public - Published Only)
// =====================================================

export function usePublicArticles(filters: ArticleFilters = {}) {
    return useQuery({
        queryKey: articleKeys.list({ ...filters, status: "published" }),
        queryFn: async () => {
            let query = supabase
                .from("articles")
                .select(
                    `
                    *,
                    category:article_categories(id, name, slug, description, icon, created_at)
                `
                )
                .eq("status", "published")
                .order("published_at", { ascending: false });

            if (filters.category_id) {
                query = query.eq("category_id", filters.category_id);
            }

            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
            }

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as unknown as Article[];
        },
    });
}

// =====================================================
// Fetch Single Article by Slug (Public)
// =====================================================

export function useArticle(slug: string) {
    return useQuery({
        queryKey: articleKeys.detail(slug),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("articles")
                .select(
                    `
                    *,
                    category:article_categories(id, name, slug, icon, description, created_at)
                `
                )
                .eq("slug", slug)
                .eq("status", "published")
                .single();

            if (error) throw error;

            // Increment view count
            await supabase
                .from("articles")
                .update({ view_count: (data.view_count || 0) + 1 })
                .eq("id", data.id);

            return data as unknown as Article;
        },
        enabled: !!slug,
    });
}

// =====================================================
// Fetch All Articles (Admin - All Statuses)
// =====================================================

export function useAdminArticles(filters: ArticleFilters = {}) {
    return useQuery({
        queryKey: articleKeys.list(filters),
        queryFn: async () => {
            let query = supabase
                .from("articles")
                .select(
                    `
                    *,
                    category:article_categories(id, name, slug, description, icon, created_at)
                `
                )
                .order("created_at", { ascending: false });

            if (filters.status && filters.status !== "all") {
                query = query.eq("status", filters.status);
            }

            if (filters.category_id) {
                query = query.eq("category_id", filters.category_id);
            }

            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as unknown as Article[];
        },
    });
}

// =====================================================
// Fetch Single Article by ID (Admin)
// =====================================================

export function useAdminArticle(id: string) {
    return useQuery({
        queryKey: ["articles", "admin", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("articles")
                .select(
                    `
                    *,
                    category:article_categories(id, name, slug, icon, description, created_at)
                `
                )
                .eq("id", id)
                .single();

            if (error) throw error;
            return data as unknown as Article;
        },
        enabled: !!id,
    });
}

// =====================================================
// Fetch Categories
// =====================================================

export function useArticleCategories() {
    return useQuery({
        queryKey: articleKeys.categories(),
        queryFn: async () => {
            const { data, error } = await supabase.from("article_categories").select("*").order("name");

            if (error) throw error;
            return data as ArticleCategory[];
        },
    });
}

// =====================================================
// Fetch Tags
// =====================================================

export function useArticleTags() {
    return useQuery({
        queryKey: articleKeys.tags(),
        queryFn: async () => {
            const { data, error } = await supabase.from("article_tags").select("*").order("name");

            if (error) {
                console.error("Error fetching tags:", error);
                throw error;
            }
            return data as ArticleTag[];
        },
    });
}

// =====================================================
// Fetch Tags for Specific Article
// =====================================================

export function useArticleTagsByArticleId(articleId: string) {
    return useQuery({
        queryKey: ["articles", "tags", articleId],
        queryFn: async () => {
            const { data, error } = await supabase.from("article_tag_relations").select("tag_id").eq("article_id", articleId);

            if (error) throw error;
            return data.map((r) => r.tag_id);
        },
        enabled: !!articleId,
    });
}

// =====================================================
// Create Article
// =====================================================

export function useCreateArticle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: ArticleFormData) => {
            const slug = generateSlug(formData.title);

            // Get current user
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error("User tidak terautentikasi");

            const { data, error } = await supabase
                .from("articles")
                .insert({
                    title: formData.title,
                    slug,
                    excerpt: formData.excerpt || null,
                    content: formData.content,
                    cover_image: formData.cover_image,
                    category_id: formData.category_id,
                    author_id: user.id,
                    status: formData.status,
                    published_at: formData.status === "published" ? new Date().toISOString() : null,
                })
                .select()
                .single();

            if (error) throw error;

            // Save tag relations if any
            if (formData.tag_ids && formData.tag_ids.length > 0) {
                const tagRelations = formData.tag_ids.map((tagId) => ({
                    article_id: data.id,
                    tag_id: tagId,
                }));

                const { error: tagError } = await supabase.from("article_tag_relations").insert(tagRelations);

                if (tagError) {
                    console.error("Failed to save tags:", tagError);
                }
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: articleKeys.all });
            toast({
                title: "Artikel berhasil dibuat",
                description: "Artikel baru telah ditambahkan",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Gagal membuat artikel",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}

// =====================================================
// Update Article
// =====================================================

export function useUpdateArticle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, formData }: { id: string; formData: Partial<ArticleFormData> }) => {
            // Remove tag_ids from article update (it's handled separately)
            const { tag_ids, ...articleData } = formData;

            const updateData: Record<string, unknown> = {
                ...articleData,
                updated_at: new Date().toISOString(),
            };

            // Update slug if title changed
            if (formData.title) {
                updateData.slug = generateSlug(formData.title);
            }

            // Set published_at if status changed to published
            if (formData.status === "published") {
                const { data: existing } = await supabase.from("articles").select("published_at").eq("id", id).single();

                if (!existing?.published_at) {
                    updateData.published_at = new Date().toISOString();
                }
            }

            const { data, error } = await supabase.from("articles").update(updateData).eq("id", id).select().single();

            if (error) throw error;

            // Sync tag relations if tag_ids provided
            if (tag_ids !== undefined) {
                // Delete existing tag relations
                await supabase.from("article_tag_relations").delete().eq("article_id", id);

                // Insert new tag relations
                if (tag_ids.length > 0) {
                    const tagRelations = tag_ids.map((tagId) => ({
                        article_id: id,
                        tag_id: tagId,
                    }));

                    const { error: tagError } = await supabase.from("article_tag_relations").insert(tagRelations);

                    if (tagError) {
                        console.error("Failed to save tags:", tagError);
                    }
                }
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: articleKeys.all });
            toast({
                title: "Artikel berhasil diperbarui",
                description: "Perubahan telah disimpan",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Gagal memperbarui artikel",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}

// =====================================================
// Delete Article
// =====================================================

export function useDeleteArticle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("articles").delete().eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: articleKeys.all });
            toast({
                title: "Artikel berhasil dihapus",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Gagal menghapus artikel",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}
