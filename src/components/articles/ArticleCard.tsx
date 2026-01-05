import { Link } from "react-router-dom";
import { Article } from "@/types/article";
import { formatArticleDate, estimateReadTime } from "@/lib/article-utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, User } from "lucide-react";

interface ArticleCardProps {
    article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
    const readTime = estimateReadTime(article.content);

    return (
        <Link to={`/articles/${article.slug}`}>
            <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                {/* Cover Image */}
                <div className="aspect-video overflow-hidden bg-muted">
                    {article.cover_image ? (
                        <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <span className="text-4xl">📰</span>
                        </div>
                    )}
                </div>

                <CardContent className="p-4 space-y-3">
                    {/* Category Badge */}
                    {article.category && (
                        <Badge variant="secondary" className="text-xs">
                            {article.category.name}
                        </Badge>
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">{article.title}</h3>

                    {/* Excerpt */}
                    {article.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>}
                </CardContent>

                <CardFooter className="p-4 pt-0 flex items-center gap-4 text-xs text-muted-foreground">
                    {/* Author */}
                    {article.author && (
                        <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{article.author.full_name}</span>
                        </div>
                    )}

                    {/* Read Time */}
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{readTime} menit baca</span>
                    </div>

                    {/* Views */}
                    <div className="flex items-center gap-1 ml-auto">
                        <Eye className="h-3 w-3" />
                        <span>{article.view_count}</span>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}
