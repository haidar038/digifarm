import slugify from "slugify";

/**
 * Generate a URL-friendly slug from a title
 */
export function generateThreadSlug(title: string): string {
    const baseSlug = slugify(title, {
        lower: true,
        strict: true,
        locale: "id",
    });
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36);
    return `${baseSlug}-${timestamp}`;
}

/**
 * Format forum date for display (relative time)
 */
export function formatForumDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
        return "Baru saja";
    } else if (diffMinutes < 60) {
        return `${diffMinutes} menit yang lalu`;
    } else if (diffHours < 24) {
        return `${diffHours} jam yang lalu`;
    } else if (diffDays < 7) {
        return `${diffDays} hari yang lalu`;
    } else {
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }
}

/**
 * Format full date for thread detail
 */
export function formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Get thread status badge configuration
 */
export function getThreadStatusBadge(isSolved: boolean): { text: string; className: string } {
    if (isSolved) {
        return {
            text: "Terjawab",
            className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        };
    }
    return {
        text: "Belum Terjawab",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    };
}

/**
 * Get role badge configuration
 */
export function getRoleBadge(role: string): { text: string; className: string } | null {
    switch (role) {
        case "expert":
            return {
                text: "Expert",
                className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
            };
        case "admin":
            return {
                text: "Admin",
                className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
            };
        default:
            return null;
    }
}

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncateContent(text: string, maxLength: number = 200): string {
    // Strip HTML tags first
    const plainText = text.replace(/<[^>]*>/g, "").trim();
    if (plainText.length <= maxLength) return plainText;
    return plainText.slice(0, maxLength).trim() + "...";
}

/**
 * Default forum categories (for reference/seeding)
 */
export const DEFAULT_FORUM_CATEGORIES = [
    {
        name: "Tanya Jawab Umum",
        slug: "tanya-jawab",
        description: "Pertanyaan umum seputar pertanian",
        icon: "HelpCircle",
        color: "#6366f1",
    },
    {
        name: "Budidaya Tanaman",
        slug: "budidaya",
        description: "Diskusi teknik budidaya tanaman",
        icon: "Leaf",
        color: "#22c55e",
    },
    {
        name: "Hama & Penyakit",
        slug: "hama-penyakit",
        description: "Konsultasi hama dan penyakit tanaman",
        icon: "Bug",
        color: "#ef4444",
    },
    {
        name: "Teknologi Pertanian",
        slug: "teknologi",
        description: "Diskusi teknologi dan inovasi pertanian",
        icon: "Cpu",
        color: "#3b82f6",
    },
    {
        name: "Pemasaran",
        slug: "pemasaran",
        description: "Tips pemasaran hasil panen",
        icon: "ShoppingBag",
        color: "#f59e0b",
    },
] as const;

/**
 * Get category icon component name based on slug
 */
export function getCategoryIcon(iconName: string | null): string {
    return iconName || "MessageSquare";
}

/**
 * Build nested reply tree from flat array
 */
export function buildReplyTree<T extends { id: string; parent_id: string | null }>(replies: T[]): (T & { children: T[] })[] {
    const replyMap = new Map<string, T & { children: T[] }>();
    const rootReplies: (T & { children: T[] })[] = [];

    // First pass: create map with children array
    replies.forEach((reply) => {
        replyMap.set(reply.id, { ...reply, children: [] });
    });

    // Second pass: build tree structure
    replies.forEach((reply) => {
        const replyWithChildren = replyMap.get(reply.id)!;
        if (reply.parent_id && replyMap.has(reply.parent_id)) {
            replyMap.get(reply.parent_id)!.children.push(replyWithChildren);
        } else {
            rootReplies.push(replyWithChildren);
        }
    });

    return rootReplies;
}

/**
 * Sort options for forum threads
 */
export const THREAD_SORT_OPTIONS = [
    { value: "recent", label: "Terbaru" },
    { value: "popular", label: "Terpopuler" },
    { value: "unanswered", label: "Belum Terjawab" },
] as const;
