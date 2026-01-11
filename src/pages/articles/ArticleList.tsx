import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { usePublicArticles, useArticleCategories } from "@/hooks/useArticles";
import { ArticleGrid, ArticleCategories, ArticleSearch } from "@/components/articles";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, ArrowLeft, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ArticleList() {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { data: articles = [], isLoading: articlesLoading } = usePublicArticles({
        category_id: selectedCategoryId || undefined,
        search: searchQuery || undefined,
    });

    const { data: categories = [], isLoading: categoriesLoading } = useArticleCategories();

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleSelectCategory = useCallback((categoryId: string | null) => {
        setSelectedCategoryId(categoryId);
        setSidebarOpen(false);
    }, []);

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

    return (
        <>
            <SEO
                title="Artikel Pertanian"
                description="Kumpulan artikel dan tips seputar pertanian, budidaya tanaman, pengendalian hama, dan teknik bertani modern."
                keywords="artikel pertanian, tips pertanian, budidaya tanaman, hama tanaman, teknik bertani"
                url="/articles"
            />
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-16 items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <Link to="/">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2">
                                <Newspaper className="h-6 w-6 text-primary" />
                                <h1 className="text-xl font-bold">Artikel</h1>
                            </div>
                        </div>

                        {/* Mobile Category Toggle */}
                        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                            <SheetTrigger asChild className="lg:hidden">
                                <Button variant="outline" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[280px] p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold">Kategori</h2>
                                </div>
                                <ArticleCategories categories={categories} selectedCategoryId={selectedCategoryId} onSelectCategory={handleSelectCategory} isLoading={categoriesLoading} />
                            </SheetContent>
                        </Sheet>
                    </div>
                </header>

                {/* Main Content */}
                <div className="container px-4 py-8">
                    <div className="flex gap-8">
                        {/* Sidebar - Desktop */}
                        <aside className="hidden lg:block w-64 shrink-0">
                            <Card className="sticky top-24">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base">Kategori</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ArticleCategories categories={categories} selectedCategoryId={selectedCategoryId} onSelectCategory={handleSelectCategory} isLoading={categoriesLoading} />
                                </CardContent>
                            </Card>
                        </aside>

                        {/* Articles */}
                        <main className="flex-1 space-y-6">
                            {/* Search & Filter Info */}
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                <div className="w-full sm:w-80">
                                    <ArticleSearch onSearch={handleSearch} />
                                </div>
                                {selectedCategory && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Kategori:</span>
                                        <Button variant="secondary" size="sm" onClick={() => setSelectedCategoryId(null)} className="gap-1">
                                            {selectedCategory.name}
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Result Count */}
                            <p className="text-sm text-muted-foreground">{articlesLoading ? "Memuat..." : `${articles.length} artikel ditemukan`}</p>

                            {/* Article Grid */}
                            <ArticleGrid
                                articles={articles}
                                isLoading={articlesLoading}
                                emptyMessage={searchQuery ? `Tidak ada artikel dengan kata kunci "${searchQuery}"` : selectedCategory ? `Tidak ada artikel dalam kategori "${selectedCategory.name}"` : "Belum ada artikel yang dipublikasi"}
                            />
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}
