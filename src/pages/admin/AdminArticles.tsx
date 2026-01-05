import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminArticles, useArticleCategories, useDeleteArticle, useUpdateArticle } from "@/hooks/useArticles";
import { Article, ArticleStatus } from "@/types/article";
import { formatArticleDate, getStatusColor, getStatusLabel } from "@/lib/article-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Eye, FileText, CheckCircle, Archive, Loader2, Newspaper, FileEdit, Clock } from "lucide-react";

export default function AdminArticles() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all");
    const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
    const [deleteArticle, setDeleteArticle] = useState<Article | null>(null);

    const { data: articles = [], isLoading } = useAdminArticles({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        category_id: categoryFilter !== "all" ? categoryFilter : undefined,
    });

    const { data: categories = [] } = useArticleCategories();
    const deleteArticleMutation = useDeleteArticle();
    const updateArticleMutation = useUpdateArticle();

    const handleDelete = async () => {
        if (deleteArticle) {
            await deleteArticleMutation.mutateAsync(deleteArticle.id);
            setDeleteArticle(null);
        }
    };

    const handleStatusChange = async (article: Article, newStatus: ArticleStatus) => {
        await updateArticleMutation.mutateAsync({
            id: article.id,
            formData: { status: newStatus },
        });
    };

    // Stats
    const stats = {
        total: articles.length,
        published: articles.filter((a) => a.status === "published").length,
        draft: articles.filter((a) => a.status === "draft").length,
        archived: articles.filter((a) => a.status === "archived").length,
    };

    return (
        <AdminLayout title="Manajemen Artikel" description="Kelola artikel dan konten edukasi pertanian">
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Newspaper className="h-4 w-4" />
                                Total Artikel
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats.total}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Dipublikasi
                            </CardDescription>
                            <CardTitle className="text-3xl text-green-600">{stats.published}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <FileEdit className="h-4 w-4 text-yellow-600" />
                                Draft
                            </CardDescription>
                            <CardTitle className="text-3xl text-yellow-600">{stats.draft}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Archive className="h-4 w-4 text-gray-600" />
                                Diarsipkan
                            </CardDescription>
                            <CardTitle className="text-3xl text-gray-600">{stats.archived}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Table Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Daftar Artikel
                            </CardTitle>
                            <CardDescription>{articles.length} artikel dalam database</CardDescription>
                        </div>
                        <Link to="/admin/articles/new">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Tambah Artikel
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Cari judul artikel..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                            </div>
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ArticleStatus | "all")}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="published">Dipublikasi</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="archived">Diarsipkan</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Table */}
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : articles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <span className="text-5xl mb-4">📰</span>
                                <p className="text-muted-foreground">Tidak ada artikel ditemukan</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Judul</TableHead>
                                            <TableHead className="hidden md:table-cell">Kategori</TableHead>
                                            <TableHead className="hidden sm:table-cell">Status</TableHead>
                                            <TableHead className="hidden lg:table-cell">Views</TableHead>
                                            <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                                            <TableHead className="w-[70px]">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {articles.map((article) => (
                                            <TableRow key={article.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {article.cover_image ? (
                                                            <img src={article.cover_image} alt="" className="h-10 w-16 object-cover rounded" />
                                                        ) : (
                                                            <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium line-clamp-1">{article.title}</p>
                                                            <p className="text-xs text-muted-foreground line-clamp-1">{article.author?.full_name || "Unknown"}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">{article.category ? <Badge variant="outline">{article.category.name}</Badge> : <span className="text-muted-foreground text-sm">-</span>}</TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <Badge className={getStatusColor(article.status)}>{getStatusLabel(article.status)}</Badge>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Eye className="h-3 w-3" />
                                                        <span>{article.view_count}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{formatArticleDate(article.created_at)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {article.status === "published" && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link to={`/articles/${article.slug}`} target="_blank">
                                                                        <Eye className="h-4 w-4 mr-2" />
                                                                        Lihat
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem asChild>
                                                                <Link to={`/admin/articles/${article.id}/edit`}>
                                                                    <Pencil className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {article.status !== "published" && (
                                                                <DropdownMenuItem onClick={() => handleStatusChange(article, "published")}>
                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                    Publikasi
                                                                </DropdownMenuItem>
                                                            )}
                                                            {article.status === "published" && (
                                                                <DropdownMenuItem onClick={() => handleStatusChange(article, "draft")}>
                                                                    <FileEdit className="h-4 w-4 mr-2" />
                                                                    Jadikan Draft
                                                                </DropdownMenuItem>
                                                            )}
                                                            {article.status !== "archived" && (
                                                                <DropdownMenuItem onClick={() => handleStatusChange(article, "archived")}>
                                                                    <Archive className="h-4 w-4 mr-2" />
                                                                    Arsipkan
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteArticle(article)}>
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Hapus
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteArticle} onOpenChange={() => setDeleteArticle(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Artikel?</AlertDialogTitle>
                        <AlertDialogDescription>Apakah Anda yakin ingin menghapus artikel "{deleteArticle?.title}"? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleteArticleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
