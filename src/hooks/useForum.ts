import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ForumCategory, ForumThread, ForumReply, ForumTag, ForumFilters, ThreadFormData, ReplyFormData } from "@/types/forum";
import { toast } from "@/hooks/use-toast";
import { generateThreadSlug, buildReplyTree } from "@/lib/forum-utils";
import { useAuth } from "@/contexts/auth-context";

// =====================================================
// Query Keys
// =====================================================

export const forumKeys = {
    all: ["forum"] as const,
    categories: () => [...forumKeys.all, "categories"] as const,
    threads: () => [...forumKeys.all, "threads"] as const,
    threadList: (filters: ForumFilters) => [...forumKeys.threads(), filters] as const,
    threadDetails: () => [...forumKeys.all, "thread"] as const,
    threadDetail: (slug: string) => [...forumKeys.threadDetails(), slug] as const,
    replies: (threadId: string) => [...forumKeys.all, "replies", threadId] as const,
    tags: () => [...forumKeys.all, "tags"] as const,
    userThreads: (userId: string) => [...forumKeys.threads(), "user", userId] as const,
    userUpvotes: (userId: string) => [...forumKeys.all, "upvotes", userId] as const,
};

// =====================================================
// Fetch Forum Categories
// =====================================================

export function useForumCategories() {
    return useQuery({
        queryKey: forumKeys.categories(),
        queryFn: async (): Promise<ForumCategory[]> => {
            const { data, error } = await supabase.from("forum_categories").select("*").order("sort_order", { ascending: true });

            if (error) throw error;
            return data || [];
        },
    });
}

// =====================================================
// Forum Stats (for sidebar)
// =====================================================

export interface ForumStats {
    totalThreads: number;
    totalReplies: number;
    solvedCount: number;
    categoryStats: { category_id: string; thread_count: number }[];
}

export function useForumStats() {
    return useQuery({
        queryKey: [...forumKeys.all, "stats"],
        queryFn: async (): Promise<ForumStats> => {
            // Fetch thread counts
            const { count: totalThreads } = await supabase.from("forum_threads").select("*", { count: "exact", head: true });

            // Fetch reply count
            const { count: totalReplies } = await supabase.from("forum_replies").select("*", { count: "exact", head: true });

            // Fetch solved count
            const { count: solvedCount } = await supabase.from("forum_threads").select("*", { count: "exact", head: true }).eq("is_solved", true);

            // Fetch category stats
            const { data: threads } = await supabase.from("forum_threads").select("category_id");
            const categoryStats: { category_id: string; thread_count: number }[] = [];
            if (threads) {
                const countMap = new Map<string, number>();
                threads.forEach((t) => {
                    if (t.category_id) {
                        countMap.set(t.category_id, (countMap.get(t.category_id) || 0) + 1);
                    }
                });
                countMap.forEach((count, category_id) => {
                    categoryStats.push({ category_id, thread_count: count });
                });
            }

            return {
                totalThreads: totalThreads || 0,
                totalReplies: totalReplies || 0,
                solvedCount: solvedCount || 0,
                categoryStats,
            };
        },
        staleTime: 1000 * 60, // 1 minute cache
    });
}

// =====================================================
// Fetch Forum Threads (with filters)
// =====================================================

export function useForumThreads(filters: ForumFilters = {}) {
    return useQuery({
        queryKey: forumKeys.threadList(filters),
        queryFn: async (): Promise<ForumThread[]> => {
            let query = supabase.from("forum_threads").select(
                `
                    *,
                    category:forum_categories(*)
                `
            );

            // Apply filters
            if (filters.category_id) {
                query = query.eq("category_id", filters.category_id);
            }

            if (filters.author_id) {
                query = query.eq("author_id", filters.author_id);
            }

            if (filters.is_solved !== undefined) {
                query = query.eq("is_solved", filters.is_solved);
            }

            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
            }

            // Apply sorting
            switch (filters.sort_by) {
                case "popular":
                    query = query.order("view_count", { ascending: false });
                    break;
                case "unanswered":
                    query = query.eq("is_solved", false).order("created_at", { ascending: false });
                    break;
                case "recent":
                default:
                    query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
            }

            // Apply pagination
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (!data || data.length === 0) return [];

            // Fetch author info separately
            const authorIds = [...new Set(data.map((t) => t.author_id).filter(Boolean))];
            const { data: authors } = await supabase.from("user_profiles").select("id, full_name, role").in("id", authorIds);

            const authorMap = new Map(authors?.map((a) => [a.id, a]) || []);

            // Merge author info
            const threadsWithAuthors = data.map((thread) => ({
                ...thread,
                author: authorMap.get(thread.author_id) || null,
            }));

            return threadsWithAuthors as unknown as ForumThread[];
        },
    });
}

// =====================================================
// Fetch Single Thread by Slug
// =====================================================

export function useForumThread(slug: string) {
    return useQuery({
        queryKey: forumKeys.threadDetail(slug),
        queryFn: async (): Promise<ForumThread | null> => {
            const { data, error } = await supabase
                .from("forum_threads")
                .select(
                    `
                    *,
                    category:forum_categories(*)
                `
                )
                .eq("slug", slug)
                .single();

            if (error) {
                if (error.code === "PGRST116") return null;
                throw error;
            }

            // Fetch author info
            let author = null;
            if (data?.author_id) {
                const { data: authorData } = await supabase.from("user_profiles").select("id, full_name, role").eq("id", data.author_id).single();
                author = authorData;
            }

            // Bug Fix #6: Session-based view tracking
            // Only increment view once per session per thread
            if (data) {
                const viewedKey = `forum_viewed_${data.id}`;
                const hasViewed = sessionStorage.getItem(viewedKey);

                if (!hasViewed) {
                    sessionStorage.setItem(viewedKey, "true");
                    supabase
                        .from("forum_threads")
                        .update({ view_count: (data.view_count || 0) + 1 })
                        .eq("id", data.id)
                        .then(() => {});
                }
            }

            return { ...data, author } as unknown as ForumThread;
        },
        enabled: !!slug,
    });
}

// =====================================================
// Fetch Thread Replies
// =====================================================

export function useThreadReplies(threadId: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: forumKeys.replies(threadId),
        queryFn: async (): Promise<ForumReply[]> => {
            // Fetch replies
            const { data: replies, error } = await supabase
                .from("forum_replies")
                .select("*")
                .eq("thread_id", threadId)
                .order("is_accepted_answer", { ascending: false })
                .order("upvote_count", { ascending: false })
                .order("created_at", { ascending: true });

            if (error) throw error;
            if (!replies || replies.length === 0) return [];

            // Fetch author info for all replies
            const authorIds = [...new Set(replies.map((r) => r.author_id).filter(Boolean))];
            const { data: authors } = await supabase.from("user_profiles").select("id, full_name, role").in("id", authorIds);

            const authorMap = new Map(authors?.map((a) => [a.id, a]) || []);

            // Fetch user's upvotes if authenticated
            let userUpvotes: string[] = [];
            if (user) {
                const { data: upvotes } = await supabase.from("forum_upvotes").select("reply_id").eq("user_id", user.id);
                userUpvotes = upvotes?.map((u) => u.reply_id) || [];
            }

            // Add author and has_upvoted flag
            const repliesWithData = replies.map((reply) => ({
                ...reply,
                author: authorMap.get(reply.author_id) || null,
                has_upvoted: userUpvotes.includes(reply.id),
            }));

            // Build nested tree
            return buildReplyTree(repliesWithData as unknown as ForumReply[]);
        },
        enabled: !!threadId,
    });
}

// =====================================================
// Fetch User's Threads
// =====================================================

export function useUserThreads() {
    const { user } = useAuth();

    return useQuery({
        queryKey: forumKeys.userThreads(user?.id || ""),
        queryFn: async (): Promise<ForumThread[]> => {
            if (!user) return [];

            const { data, error } = await supabase
                .from("forum_threads")
                .select(
                    `
                    *,
                    category:forum_categories(*)
                `
                )
                .eq("author_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data as unknown as ForumThread[]) || [];
        },
        enabled: !!user,
    });
}

// =====================================================
// Fetch Forum Tags
// =====================================================

export function useForumTags() {
    return useQuery({
        queryKey: forumKeys.tags(),
        queryFn: async (): Promise<ForumTag[]> => {
            const { data, error } = await supabase.from("forum_tags").select("*").order("name", { ascending: true });

            if (error) throw error;
            return data || [];
        },
    });
}

// =====================================================
// Create Thread
// =====================================================

export function useCreateThread() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (formData: ThreadFormData): Promise<ForumThread> => {
            if (!user) throw new Error("User not authenticated");

            const slug = generateThreadSlug(formData.title);

            // Insert thread
            const { data: thread, error: threadError } = await supabase
                .from("forum_threads")
                .insert({
                    title: formData.title,
                    slug,
                    content: formData.content,
                    category_id: formData.category_id,
                    images: formData.images || [],
                    author_id: user.id,
                })
                .select()
                .single();

            if (threadError) throw threadError;

            // Insert tags if any
            if (formData.tag_ids.length > 0) {
                const tagRelations = formData.tag_ids.map((tag_id) => ({
                    thread_id: thread.id,
                    tag_id,
                }));

                const { error: tagError } = await supabase.from("forum_thread_tags").insert(tagRelations);

                if (tagError) console.error("Error adding tags:", tagError);
            }

            return thread as ForumThread;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: forumKeys.threads() });
            toast({
                title: "Berhasil",
                description: "Thread berhasil dibuat!",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Gagal membuat thread",
                description: error.message,
            });
        },
    });
}

// =====================================================
// Update Thread
// =====================================================

export function useUpdateThread() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, formData }: { id: string; formData: Partial<ThreadFormData> }) => {
            const updateData: Record<string, unknown> = {};

            if (formData.title) updateData.title = formData.title;
            if (formData.content) updateData.content = formData.content;
            if (formData.category_id !== undefined) updateData.category_id = formData.category_id;
            if (formData.images) updateData.images = formData.images;

            const { data, error } = await supabase.from("forum_threads").update(updateData).eq("id", id).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: forumKeys.threads() });
            queryClient.invalidateQueries({ queryKey: forumKeys.threadDetail(data.slug) });
            toast({
                title: "Berhasil",
                description: "Thread berhasil diperbarui!",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Gagal memperbarui thread",
                description: error.message,
            });
        },
    });
}

// =====================================================
// Delete Thread
// =====================================================

export function useDeleteThread() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("forum_threads").delete().eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: forumKeys.threads() });
            toast({
                title: "Berhasil",
                description: "Thread berhasil dihapus!",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Gagal menghapus thread",
                description: error.message,
            });
        },
    });
}

// =====================================================
// Create Reply
// =====================================================

export function useCreateReply() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ threadId, formData }: { threadId: string; formData: ReplyFormData }) => {
            if (!user) throw new Error("User not authenticated");

            const { data, error } = await supabase
                .from("forum_replies")
                .insert({
                    thread_id: threadId,
                    parent_id: formData.parent_id || null,
                    author_id: user.id,
                    content: formData.content,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: forumKeys.replies(variables.threadId) });
            queryClient.invalidateQueries({ queryKey: forumKeys.threadDetails() });
            queryClient.invalidateQueries({ queryKey: forumKeys.threads() }); // Update reply_count
            toast({
                title: "Berhasil",
                description: "Balasan berhasil dikirim!",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Gagal mengirim balasan",
                description: error.message,
            });
        },
    });
}

// =====================================================
// Delete Reply
// =====================================================

export function useDeleteReply() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ replyId, threadId }: { replyId: string; threadId: string }) => {
            const { error } = await supabase.from("forum_replies").delete().eq("id", replyId);

            if (error) throw error;
            return { threadId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: forumKeys.replies(data.threadId) });
            queryClient.invalidateQueries({ queryKey: forumKeys.threads() }); // Update reply_count
            queryClient.invalidateQueries({ queryKey: forumKeys.threadDetails() });
            toast({
                title: "Berhasil",
                description: "Balasan berhasil dihapus!",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Gagal menghapus balasan",
                description: error.message,
            });
        },
    });
}

// =====================================================
// Toggle Upvote
// =====================================================

export function useToggleUpvote() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ replyId, hasUpvoted }: { replyId: string; hasUpvoted: boolean }) => {
            if (!user) throw new Error("User not authenticated");

            if (hasUpvoted) {
                // Remove upvote
                const { error } = await supabase.from("forum_upvotes").delete().eq("user_id", user.id).eq("reply_id", replyId);

                if (error) throw error;
            } else {
                // Add upvote
                const { error } = await supabase.from("forum_upvotes").insert({
                    user_id: user.id,
                    reply_id: replyId,
                });

                if (error) throw error;
            }

            return { replyId, newState: !hasUpvoted };
        },
        onSuccess: () => {
            // Invalidate replies to update upvote counts
            queryClient.invalidateQueries({ queryKey: forumKeys.all });
        },
    });
}

// =====================================================
// Mark Thread as Solved
// =====================================================

export function useMarkAsSolved() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ threadId, isSolved }: { threadId: string; isSolved: boolean }) => {
            const { error } = await supabase.from("forum_threads").update({ is_solved: isSolved }).eq("id", threadId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: forumKeys.threads() });
            queryClient.invalidateQueries({ queryKey: forumKeys.threadDetails() });
            toast({
                title: "Berhasil",
                description: "Status thread berhasil diperbarui!",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Gagal memperbarui status",
                description: error.message,
            });
        },
    });
}

// =====================================================
// Accept Answer
// =====================================================

export function useAcceptAnswer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ replyId, threadId }: { replyId: string; threadId: string }) => {
            // First, unset any previously accepted answer
            await supabase.from("forum_replies").update({ is_accepted_answer: false }).eq("thread_id", threadId);

            // Then set the new accepted answer
            const { error } = await supabase.from("forum_replies").update({ is_accepted_answer: true }).eq("id", replyId);

            if (error) throw error;

            // Also mark thread as solved
            await supabase.from("forum_threads").update({ is_solved: true }).eq("id", threadId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: forumKeys.all });
            toast({
                title: "Berhasil",
                description: "Jawaban diterima sebagai solusi!",
            });
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Gagal menerima jawaban",
                description: error.message,
            });
        },
    });
}
