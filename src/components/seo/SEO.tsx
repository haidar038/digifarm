import { Helmet } from "react-helmet-async";

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: "website" | "article" | "profile";
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    noIndex?: boolean;
    children?: React.ReactNode;
}

const SITE_NAME = "DigiFarm RINDANG";
const DEFAULT_DESCRIPTION = "Platform pertanian digital untuk mengelola lahan, produksi, dan informasi pertanian terkini.";
const DEFAULT_IMAGE = "/favicon/web-app-manifest-512x512.png";
const SITE_URL = "https://rindang.net";

/**
 * Reusable SEO component for dynamic meta tags
 *
 * @example
 * // Basic usage
 * <SEO title="Artikel Pertanian" description="Kumpulan artikel..." />
 *
 * @example
 * // Article with structured data
 * <SEO
 *   title={article.title}
 *   description={article.excerpt}
 *   image={article.cover_image}
 *   type="article"
 *   publishedTime={article.created_at}
 *   author={article.author}
 * />
 */
export function SEO({ title, description = DEFAULT_DESCRIPTION, keywords, image = DEFAULT_IMAGE, url, type = "website", publishedTime, modifiedTime, author, section, noIndex = false, children }: SEOProps) {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
    const fullImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

    // Truncate description to 160 characters for SEO
    const truncatedDescription = description.length > 160 ? `${description.slice(0, 157)}...` : description;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={truncatedDescription} />
            {keywords && <meta name="keywords" content={keywords} />}
            {noIndex && <meta name="robots" content="noindex,nofollow" />}

            {/* Canonical URL */}
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph Tags */}
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={truncatedDescription} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:type" content={type} />
            <meta property="og:locale" content="id_ID" />

            {/* Article-specific Open Graph Tags */}
            {type === "article" && publishedTime && <meta property="article:published_time" content={publishedTime} />}
            {type === "article" && modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
            {type === "article" && author && <meta property="article:author" content={author} />}
            {type === "article" && section && <meta property="article:section" content={section} />}

            {/* Twitter Card Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={truncatedDescription} />
            <meta name="twitter:image" content={fullImage} />

            {/* Additional head elements */}
            {children}
        </Helmet>
    );
}

/**
 * Generate Article structured data (JSON-LD)
 */
export function ArticleStructuredData({
    title,
    description,
    image,
    url,
    publishedTime,
    modifiedTime,
    authorName,
}: {
    title: string;
    description: string;
    image?: string;
    url: string;
    publishedTime: string;
    modifiedTime?: string;
    authorName: string;
}) {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: description,
        image: image,
        url: `${SITE_URL}${url}`,
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        author: {
            "@type": "Person",
            name: authorName,
        },
        publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/favicon/web-app-manifest-512x512.png`,
            },
        },
    };

    return (
        <Helmet>
            <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Helmet>
    );
}

/**
 * Generate DiscussionForumPosting structured data (JSON-LD)
 */
export function ForumThreadStructuredData({ title, content, url, authorName, publishedTime, replyCount }: { title: string; content: string; url: string; authorName: string; publishedTime: string; replyCount: number }) {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        headline: title,
        text: content.slice(0, 500),
        url: `${SITE_URL}${url}`,
        datePublished: publishedTime,
        author: {
            "@type": "Person",
            name: authorName,
        },
        interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/CommentAction",
            userInteractionCount: replyCount,
        },
    };

    return (
        <Helmet>
            <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Helmet>
    );
}
