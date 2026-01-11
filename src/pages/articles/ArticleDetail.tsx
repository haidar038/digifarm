import { Link, useParams } from "react-router-dom";
import { useArticle, usePublicArticles } from "@/hooks/useArticles";
import { ArticleContent, ArticleCard } from "@/components/articles";
import { SEO, ArticleStructuredData } from "@/components/seo";
import { formatArticleDate, estimateReadTime } from "@/lib/article-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, Eye, User, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ArticleDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { data: article, isLoading, error } = useArticle(slug || "");

    // Fetch related articles from same category
    const { data: relatedArticles = [] } = usePublicArticles({
        category_id: article?.category_id || undefined,
        limit: 3,
    });

    // Filter out current article from related
    const filteredRelated = relatedArticles.filter((a) => a.id !== article?.id).slice(0, 3);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article?.title,
                    text: article?.excerpt || "",
                    url: window.location.href,
                });
            } catch {
                // User cancelled or share failed
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(window.location.href);
            toast({
                title: "Link disalin",
                description: "Link artikel telah disalin ke clipboard",
            });
        }
    };

    if (isLoading) {
        return <ArticleDetailSkeleton />;
    }

    if (error || !article) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <span className="text-6xl">📰</span>
                    <h1 className="text-2xl font-bold">Artikel Tidak Ditemukan</h1>
                    <p className="text-muted-foreground">Artikel yang Anda cari tidak tersedia</p>
                    <Link to="/articles">
                        <Button>Kembali ke Daftar Artikel</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const readTime = estimateReadTime(article.content);

    return (
        <>
            {/* SEO Meta Tags */}
            <SEO
                title={article.title}
                description={article.excerpt || `Baca artikel ${article.title} di DigiFarm RINDANG`}
                image={article.cover_image}
                url={`/articles/${article.slug}`}
                type="article"
                publishedTime={article.published_at || article.created_at}
                modifiedTime={article.updated_at}
                author={article.author?.full_name}
                section={article.category?.name}
            />
            <ArticleStructuredData
                title={article.title}
                description={article.excerpt || article.title}
                image={article.cover_image}
                url={`/articles/${article.slug}`}
                publishedTime={article.published_at || article.created_at}
                modifiedTime={article.updated_at}
                authorName={article.author?.full_name || "DigiFarm RINDANG"}
            />

            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-16 items-center justify-between px-4">
                        <Link to="/articles">
                            <Button variant="ghost" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Kembali ke Artikel</span>
                            </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={handleShare}>
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                {/* Cover Image */}
                {article.cover_image && (
                    <div className="w-full h-64 md:h-96 overflow-hidden bg-muted">
                        <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Article Content */}
                <article className="container max-w-4xl px-4 py-8">
                    {/* Meta */}
                    <div className="space-y-4 mb-8">
                        {/* Category */}
                        {article.category && (
                            <Link to={`/articles?category=${article.category.id}`}>
                                <Badge variant="secondary" className="hover:bg-secondary/80">
                                    {article.category.name}
                                </Badge>
                            </Link>
                        )}

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{article.title}</h1>

                        {/* Excerpt */}
                        {article.excerpt && <p className="text-xl text-muted-foreground leading-relaxed">{article.excerpt}</p>}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {article.author && (
                                <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span>{article.author.full_name}</span>
                                </div>
                            )}
                            {article.published_at && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatArticleDate(article.published_at)}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{readTime} menit baca</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{article.view_count} views</span>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-8" />

                    {/* Content */}
                    <ArticleContent content={article.content} />

                    {/* Related Articles */}
                    {filteredRelated.length > 0 && (
                        <>
                            <Separator className="my-12" />
                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold">Artikel Terkait</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {filteredRelated.map((relatedArticle) => (
                                        <ArticleCard key={relatedArticle.id} article={relatedArticle} />
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </article>
            </div>
        </>
    );
}

function ArticleDetailSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
                <div className="container flex h-16 items-center px-4">
                    <Skeleton className="h-10 w-32" />
                </div>
            </header>
            <Skeleton className="w-full h-64 md:h-96" />
            <div className="container max-w-4xl px-4 py-8 space-y-6">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Separator />
                <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>
        </div>
    );
}
