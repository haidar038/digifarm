import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useForumThreads, useForumCategories, useDeleteThread } from "@/hooks/useForum";
import { ForumThread } from "@/types/forum";
import { formatForumDate, getThreadStatusBadge } from "@/lib/forum-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, MoreHorizontal, Trash2, Eye, MessageSquare, CheckCircle, Clock, Loader2, Users, HelpCircle, ExternalLink } from "lucide-react";

export default function AdminForumManagement() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "unsolved">("all");
    const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
    const [deleteThread, setDeleteThread] = useState<ForumThread | null>(null);

    const { data: threads = [], isLoading } = useForumThreads({
        search: search || undefined,
        is_solved: statusFilter === "solved" ? true : statusFilter === "unsolved" ? false : undefined,
        category_id: categoryFilter !== "all" ? categoryFilter : undefined,
    });

    const { data: categories = [] } = useForumCategories();
    const deleteThreadMutation = useDeleteThread();

    const handleDelete = async () => {
        if (deleteThread) {
            await deleteThreadMutation.mutateAsync(deleteThread.id);
            setDeleteThread(null);
        }
    };

    // Stats
    const stats = {
        total: threads.length,
        solved: threads.filter((t) => t.is_solved).length,
        unsolved: threads.filter((t) => !t.is_solved).length,
        totalReplies: threads.reduce((sum, t) => sum + (t.reply_count || 0), 0),
    };

    return (
        <AdminLayout title="Manajemen Forum" description="Kelola diskusi dan thread forum">
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Total Thread
                            </CardDescription>
                            <CardTitle className="text-3xl">{stats.total}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Terjawab
                            </CardDescription>
                            <CardTitle className="text-3xl text-green-600">{stats.solved}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-yellow-600" />
                                Belum Terjawab
                            </CardDescription>
                            <CardTitle className="text-3xl text-yellow-600">{stats.unsolved}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                Total Balasan
                            </CardDescription>
                            <CardTitle className="text-3xl text-blue-600">{stats.totalReplies}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Table Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Daftar Thread
                            </CardTitle>
                            <CardDescription>{threads.length} thread dalam database</CardDescription>
                        </div>
                        <Link to="/forum" target="_blank">
                            <Button variant="outline" className="gap-2">
                                <ExternalLink className="h-4 w-4" />
                                Buka Forum
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Cari judul thread..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                            </div>
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "solved" | "unsolved")}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="solved">Terjawab</SelectItem>
                                    <SelectItem value="unsolved">Belum Terjawab</SelectItem>
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
                        ) : threads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <span className="text-5xl mb-4">💬</span>
                                <p className="text-muted-foreground">Tidak ada thread ditemukan</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Judul</TableHead>
                                            <TableHead className="hidden md:table-cell">Kategori</TableHead>
                                            <TableHead className="hidden sm:table-cell">Status</TableHead>
                                            <TableHead className="hidden lg:table-cell">Balasan</TableHead>
                                            <TableHead className="hidden lg:table-cell">Views</TableHead>
                                            <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                                            <TableHead className="w-[70px]">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {threads.map((thread) => {
                                            const statusBadge = getThreadStatusBadge(thread.is_solved);
                                            return (
                                                <TableRow key={thread.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium line-clamp-1">{thread.title}</p>
                                                            <p className="text-xs text-muted-foreground line-clamp-1">{thread.author?.full_name || "Anonim"}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {thread.category ? <Badge variant="outline">{thread.category.name}</Badge> : <span className="text-muted-foreground text-sm">-</span>}
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <Badge className={statusBadge.className}>{statusBadge.text}</Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <MessageSquare className="h-3 w-3" />
                                                            <span>{thread.reply_count || 0}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <Eye className="h-3 w-3" />
                                                            <span>{thread.view_count || 0}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{formatForumDate(thread.created_at)}</span>
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
                                                                <DropdownMenuItem asChild>
                                                                    <Link to={`/forum/thread/${thread.slug}`} target="_blank">
                                                                        <Eye className="h-4 w-4 mr-2" />
                                                                        Lihat Detail
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteThread(thread)}>
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Hapus
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteThread} onOpenChange={() => setDeleteThread(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Thread?</AlertDialogTitle>
                        <AlertDialogDescription>Apakah Anda yakin ingin menghapus thread "{deleteThread?.title}"? Semua balasan terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleteThreadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
