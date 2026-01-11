import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryCard, ThreadList, ForumSidebar } from "@/components/forum";
import { useForumCategories, useForumThreads, useForumStats } from "@/hooks/useForum";
import { ForumFilters } from "@/types/forum";
import { Plus, MessageSquare, TrendingUp, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function ForumHome() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [filters, setFilters] = useState<ForumFilters>({ sort_by: "recent", limit: 10 });
    const [searchQuery, setSearchQuery] = useState("");

    const { data: categories, isLoading: categoriesLoading } = useForumCategories();
    const { data: stats } = useForumStats();
    const { data: recentThreads, isLoading: threadsLoading } = useForumThreads({
        ...filters,
        search: searchQuery || undefined,
    });

    const { data: popularThreads } = useForumThreads({ sort_by: "popular", limit: 5 });
    const { data: unansweredThreads } = useForumThreads({ sort_by: "unanswered", limit: 5 });

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    return (
        <>
            <SEO
                title="Forum Diskusi Pertanian"
                description="Tanya jawab dan diskusi seputar pertanian dengan sesama petani dan ahli. Dapatkan solusi untuk masalah pertanian Anda."
                keywords="forum pertanian, diskusi petani, tanya jawab pertanian, komunitas petani"
                url="/forum"
            />
            <RoleBasedLayout title="Forum Diskusi">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                                <MessageSquare className="w-7 h-7 text-primary" />
                                Forum Diskusi
                            </h1>
                            <p className="text-muted-foreground mt-1">Tanya jawab dan diskusi seputar pertanian</p>
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
                        <div className="lg:col-span-3 space-y-6">
                            {/* Categories */}
                            <div>
                                <h2 className="text-lg font-semibold mb-4">Kategori</h2>
                                {categoriesLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {categories?.map((category) => {
                                            const count = stats?.categoryStats?.find((c) => c.category_id === category.id)?.thread_count || 0;
                                            return <CategoryCard key={category.id} category={category} threadCount={count} />;
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Threads Tabs */}
                            <div>
                                <Tabs defaultValue="recent" className="w-full">
                                    <TabsList className="mb-4">
                                        <TabsTrigger value="recent" className="gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            Terbaru
                                        </TabsTrigger>
                                        <TabsTrigger value="popular" className="gap-2">
                                            <TrendingUp className="w-4 h-4" />
                                            Populer
                                        </TabsTrigger>
                                        <TabsTrigger value="unanswered" className="gap-2">
                                            <HelpCircle className="w-4 h-4" />
                                            Belum Terjawab
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="recent">
                                        <ThreadList threads={recentThreads || []} isLoading={threadsLoading} emptyMessage="Belum ada diskusi. Jadilah yang pertama!" />
                                    </TabsContent>

                                    <TabsContent value="popular">
                                        <ThreadList threads={popularThreads || []} isLoading={threadsLoading} emptyMessage="Belum ada diskusi populer" />
                                    </TabsContent>

                                    <TabsContent value="unanswered">
                                        <ThreadList threads={unansweredThreads || []} isLoading={threadsLoading} emptyMessage="Semua diskusi sudah terjawab!" />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="hidden lg:block">
                            <ForumSidebar onSearch={handleSearch} />
                        </div>
                    </div>
                </div>
            </RoleBasedLayout>
        </>
    );
}
