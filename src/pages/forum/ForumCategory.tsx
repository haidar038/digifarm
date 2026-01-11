import { Link, useParams } from "react-router-dom";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThreadList, ForumSidebar } from "@/components/forum";
import { useForumCategories, useForumThreads } from "@/hooks/useForum";
import { ArrowLeft, Plus, MessageSquare, HelpCircle, Leaf, Bug, Cpu, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const iconMap: Record<string, React.ElementType> = {
    HelpCircle,
    Leaf,
    Bug,
    Cpu,
    ShoppingBag,
    MessageSquare,
};

export default function ForumCategory() {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useAuth();

    const { data: categories } = useForumCategories();
    const category = categories?.find((c) => c.slug === slug);

    const { data: threads, isLoading } = useForumThreads({
        category_id: category?.id,
        sort_by: "recent",
    });

    const IconComponent = iconMap[category?.icon || "MessageSquare"] || MessageSquare;

    return (
        <>
            <SEO title={category?.name ? `${category.name} - Forum` : "Forum"} description={category?.description || "Diskusi seputar pertanian di DigiFarm RINDANG"} url={`/forum/category/${slug}`} />
            <RoleBasedLayout title={category?.name || "Forum"}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link to="/forum">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                            </Button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${category?.color || "#6366f1"}20` }}>
                                        <IconComponent className="w-5 h-5" style={{ color: category?.color || "#6366f1" }} />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold">{category?.name || "Kategori"}</h1>
                                        <p className="text-muted-foreground text-sm">{category?.description}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {user && (
                            <Button asChild>
                                <Link to="/forum/new">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Buat Diskusi
                                </Link>
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Diskusi</h2>
                                <Badge variant="secondary">{threads?.length || 0} diskusi</Badge>
                            </div>
                            <ThreadList threads={threads || []} isLoading={isLoading} showCategory={false} emptyMessage={`Belum ada diskusi di kategori ${category?.name || "ini"}`} />
                        </div>

                        {/* Sidebar */}
                        <div className="hidden lg:block">
                            <ForumSidebar currentCategory={slug} />
                        </div>
                    </div>
                </div>
            </RoleBasedLayout>
        </>
    );
}
