import { Article } from "@/types/article";
import { ArticleCard } from "./ArticleCard";
import { Loader2 } from "lucide-react";

interface ArticleGridProps {
    articles: Article[];
    isLoading?: boolean;
    emptyMessage?: string;
}

export function ArticleGrid({ articles, isLoading, emptyMessage = "Tidak ada artikel ditemukan" }: ArticleGridProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-5xl mb-4">📰</span>
                <p className="text-muted-foreground">{emptyMessage}</p>
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
