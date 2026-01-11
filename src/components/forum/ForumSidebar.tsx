import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForumCategories, useForumStats } from "@/hooks/useForum";
import { Search, MessageSquare, HelpCircle, Leaf, Bug, Cpu, ShoppingBag, Loader2 } from "lucide-react";
import { useState } from "react";

interface ForumSidebarProps {
    currentCategory?: string;
    onSearch?: (query: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
    HelpCircle,
    Leaf,
    Bug,
    Cpu,
    ShoppingBag,
    MessageSquare,
};

export function ForumSidebar({ currentCategory, onSearch }: ForumSidebarProps) {
    const { data: categories, isLoading: categoriesLoading } = useForumCategories();
    const { data: stats, isLoading: statsLoading } = useForumStats();
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(searchQuery);
    };

    // Get thread count for a category
    const getCategoryThreadCount = (categoryId: string) => {
        if (!stats?.categoryStats) return 0;
        const found = stats.categoryStats.find((c) => c.category_id === categoryId);
        return found?.thread_count || 0;
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Cari diskusi..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <Button type="submit" size="icon" variant="secondary">
                            <Search className="w-4 h-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Categories */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Kategori</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {categoriesLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-9 bg-muted rounded animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <Link to="/forum">
                                <Button variant={!currentCategory ? "secondary" : "ghost"} className="w-full justify-start h-9" size="sm">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Semua Diskusi
                                    <Badge variant="outline" className="ml-auto text-xs">
                                        {stats?.totalThreads || 0}
                                    </Badge>
                                </Button>
                            </Link>

                            {categories?.map((category) => {
                                const IconComponent = iconMap[category.icon || "MessageSquare"] || MessageSquare;
                                const isActive = currentCategory === category.slug;
                                const threadCount = getCategoryThreadCount(category.id);

                                return (
                                    <Link key={category.id} to={`/forum/category/${category.slug}`}>
                                        <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start h-9" size="sm">
                                            <IconComponent className="w-4 h-4 mr-2" style={{ color: category.color }} />
                                            <span className="truncate">{category.name}</span>
                                            {threadCount > 0 && (
                                                <Badge variant="outline" className="ml-auto text-xs">
                                                    {threadCount}
                                                </Badge>
                                            )}
                                        </Button>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Info Forum</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {statsLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Diskusi</span>
                                <Badge variant="secondary">{stats?.totalThreads || 0}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Balasan</span>
                                <Badge variant="secondary">{stats?.totalReplies || 0}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Terjawab</span>
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    {stats?.solvedCount || 0}
                                </Badge>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Panduan Forum</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• Gunakan judul yang jelas dan deskriptif</li>
                        <li>• Berikan detail lengkap tentang masalah</li>
                        <li>• Tandai jawaban yang membantu sebagai solusi</li>
                        <li>• Hormati sesama pengguna</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
