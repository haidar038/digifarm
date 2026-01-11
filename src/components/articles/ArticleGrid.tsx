import { Article } from "@/types/article";
import { ArticleCard } from "./ArticleCard";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search } from "lucide-react";

interface ArticleGridProps {
    articles: Article[];
    isLoading?: boolean;
    emptyMessage?: string;
}

/**
 * Skeleton loader for article cards
 */
function ArticleCardSkeleton() {
    return (
        <Card className="h-full overflow-hidden">
            {/* Cover image skeleton */}
            <div className="aspect-video overflow-hidden">
                <Skeleton className="w-full h-full" />
            </div>

            <CardContent className="p-4 space-y-3">
                {/* Category badge skeleton */}
                <Skeleton className="h-5 w-16" />

                {/* Title skeleton */}
                <Skeleton className="h-6 w-full" />

                {/* Excerpt skeleton */}
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12 ml-auto" />
            </CardFooter>
        </Card>
    );
}

export function ArticleGrid({ articles, isLoading, emptyMessage = "Tidak ada artikel ditemukan" }: ArticleGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ArticleCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">Tidak Ada Artikel</h3>
                <p className="text-muted-foreground text-sm max-w-xs">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
            ))}
        </div>
    );
}
