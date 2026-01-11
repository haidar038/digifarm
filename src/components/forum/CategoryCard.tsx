import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ForumCategory } from "@/types/forum";
import { HelpCircle, Leaf, Bug, Cpu, ShoppingBag, MessageSquare } from "lucide-react";

interface CategoryCardProps {
    category: ForumCategory;
    threadCount?: number;
}

const iconMap: Record<string, React.ElementType> = {
    HelpCircle,
    Leaf,
    Bug,
    Cpu,
    ShoppingBag,
    MessageSquare,
};

export function CategoryCard({ category, threadCount = 0 }: CategoryCardProps) {
    const IconComponent = iconMap[category.icon || "MessageSquare"] || MessageSquare;

    return (
        <Link to={`/forum/category/${category.slug}`}>
            <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/50 group cursor-pointer h-full">
                <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: `${category.color}20` }}>
                            <IconComponent className="w-6 h-6" style={{ color: category.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{category.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {threadCount} {threadCount === 1 ? "diskusi" : "diskusi"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
