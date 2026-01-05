import slugify from "slugify";

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
    return slugify(title, {
        lower: true,
        strict: true,
        locale: "id",
    });
}

/**
 * Format article date for display
 */
export function formatArticleDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

/**
 * Estimate reading time based on word count
 * Average reading speed: ~200 words per minute
 */
export function estimateReadTime(content: string): number {
    // Strip HTML tags for accurate word count
    const text = content.replace(/<[^>]*>/g, "");
    const wordCount = text.trim().split(/\s+/).length;
    const readTimeMinutes = Math.ceil(wordCount / 200);
    return Math.max(1, readTimeMinutes);
}

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
}

/**
 * Strip HTML tags from content
 */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Generate excerpt from content if not provided
 */
export function generateExcerpt(content: string, maxLength: number = 160): string {
    const plainText = stripHtml(content);
    return truncateText(plainText, maxLength);
}

/**
 * Get status badge color based on article status
 */
export function getStatusColor(status: string): string {
    switch (status) {
        case "published":
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        case "draft":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
        case "archived":
            return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
}

/**
 * Get status label in Indonesian
 */
export function getStatusLabel(status: string): string {
    switch (status) {
        case "published":
            return "Dipublikasi";
        case "draft":
            return "Draft";
        case "archived":
            return "Diarsipkan";
        default:
            return status;
    }
}

/**
 * Default categories based on specification
 */
export const DEFAULT_CATEGORIES = [
    { name: "Budidaya Tanaman", slug: "budidaya", description: "Tips dan panduan budidaya" },
    { name: "Pengendalian Hama", slug: "hama-penyakit", description: "Cara mengatasi hama dan penyakit" },
    { name: "Teknologi Pertanian", slug: "teknologi", description: "Inovasi dan teknologi terbaru" },
    { name: "Pemasaran Hasil Panen", slug: "pemasaran", description: "Tips menjual hasil panen" },
    { name: "Cuaca & Iklim", slug: "cuaca", description: "Info cuaca dan pengaruhnya" },
    { name: "Tips & Trik", slug: "tips", description: "Tips praktis untuk petani" },
] as const;
