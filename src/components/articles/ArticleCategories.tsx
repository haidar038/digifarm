import { ArticleCategory } from "@/types/article";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { LayoutGrid, BookOpen, Bug, Cpu, ShoppingCart, Cloud, Lightbulb } from "lucide-react";

interface ArticleCategoriesProps {
    categories: ArticleCategory[];
    selectedCategoryId?: string | null;
    onSelectCategory: (categoryId: string | null) => void;
    isLoading?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    budidaya: BookOpen,
    "hama-penyakit": Bug,
    teknologi: Cpu,
    pemasaran: ShoppingCart,
    cuaca: Cloud,
    tips: Lightbulb,
};

export function ArticleCategories({ categories, selectedCategoryId, onSelectCategory, isLoading }: ArticleCategoriesProps) {
    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <ScrollArea className="h-auto">
            <div className="space-y-1">
                {/* All Categories */}
                <Button
                    variant={selectedCategoryId === null ? "secondary" : "ghost"}
                    className={cn("w-full justify-start gap-2", selectedCategoryId === null && "bg-primary/10 text-primary hover:bg-primary/20")}
                    onClick={() => onSelectCategory(null)}
                >
                    <LayoutGrid className="h-4 w-4" />
                    Semua Kategori
                </Button>

                {/* Category List */}
                {categories.map((category) => {
                    const Icon = CATEGORY_ICONS[category.slug] || BookOpen;
                    const isSelected = selectedCategoryId === category.id;

                    return (
                        <Button
                            key={category.id}
                            variant={isSelected ? "secondary" : "ghost"}
                            className={cn("w-full justify-start gap-2", isSelected && "bg-primary/10 text-primary hover:bg-primary/20")}
                            onClick={() => onSelectCategory(category.id)}
                        >
                            <Icon className="h-4 w-4" />
                            {category.name}
                        </Button>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
