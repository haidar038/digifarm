import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { SEO, ForumThreadStructuredData } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ReplyList, ReplyEditor, ExpertBadge } from "@/components/forum";
import { useForumThread, useThreadReplies, useMarkAsSolved, useDeleteThread } from "@/hooks/useForum";
import { formatFullDate, getThreadStatusBadge, truncateContent } from "@/lib/forum-utils";
import { ArrowLeft, Eye, MessageSquare, CheckCircle, Clock, MoreHorizontal, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ForumThread() {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: thread, isLoading: threadLoading } = useForumThread(slug || "");
    const { data: replies, isLoading: repliesLoading, refetch: refetchReplies } = useThreadReplies(thread?.id || "");
    const markAsSolved = useMarkAsSolved();
    const deleteThread = useDeleteThread();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const isAuthor = user?.id === thread?.author_id;
    const statusBadge = thread ? getThreadStatusBadge(thread.is_solved) : null;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleToggleSolved = () => {
        if (!thread) return;
        markAsSolved.mutate({ threadId: thread.id, isSolved: !thread.is_solved });
    };

    const handleDelete = () => {
        if (!thread) return;
        deleteThread.mutate(thread.id, {
            onSuccess: () => {
                setShowDeleteDialog(false);
                navigate("/forum");
            },
        });
    };

    if (threadLoading) {
        return (
            <RoleBasedLayout title="Forum">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </RoleBasedLayout>
        );
    }

    if (!thread) {
        return (
            <RoleBasedLayout title="Forum">
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-2">Diskusi Tidak Ditemukan</h2>
                    <p className="text-muted-foreground mb-4">Diskusi yang Anda cari tidak ada atau sudah dihapus.</p>
                    <Button asChild>
                        <Link to="/forum">Kembali ke Forum</Link>
                    </Button>
                </div>
            </RoleBasedLayout>
        );
    }

    return (
        <>
            {/* SEO Meta Tags */}
            <SEO title={thread.title} description={truncateContent(thread.content, 160)} url={`/forum/thread/${thread.slug}`} />
            <ForumThreadStructuredData title={thread.title} content={thread.content} url={`/forum/thread/${thread.slug}`} authorName={thread.author?.full_name || "Anonim"} publishedTime={thread.created_at} replyCount={thread.reply_count} />

            <RoleBasedLayout title={thread.title}>
                <div className="space-y-6">
                    {/* Back Button */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/forum">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Kembali ke Forum
                            </Link>
                        </Button>
                    </div>

                    {/* Thread Header */}
                    <Card>
                        <CardContent className="p-6">
                            {/* Status & Category */}
                            <div className="flex items-center gap-2 mb-4">
                                {statusBadge && (
                                    <Badge className={statusBadge.className}>
                                        {thread.is_solved && <CheckCircle className="w-3 h-3 mr-1" />}
                                        {statusBadge.text}
                                    </Badge>
                                )}
                                {thread.category && <Badge variant="outline">{thread.category.name}</Badge>}
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl md:text-3xl font-bold mb-4">{thread.title}</h1>

                            {/* Author & Meta */}
                            <div className="flex items-center gap-4 pb-4 border-b">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/10 text-primary">{thread.author?.full_name ? getInitials(thread.author.full_name) : "?"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{thread.author?.full_name || "Anonim"}</span>
                                        {thread.author?.role === "expert" && <ExpertBadge showIcon={false} />}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatFullDate(thread.created_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3.5 h-3.5" />
                                            {thread.view_count} dilihat
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            {thread.reply_count} balasan
                                        </span>
                                    </div>
                                </div>

                                {/* Author Actions */}
                                {isAuthor && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={handleToggleSolved}>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                {thread.is_solved ? "Tandai Belum Terjawab" : "Tandai Terjawab"}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)}>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Hapus Diskusi
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            {/* Content */}
                            <div className="prose prose-sm dark:prose-invert max-w-none py-4" dangerouslySetInnerHTML={{ __html: thread.content }} />

                            {/* Images */}
                            {thread.images && thread.images.length > 0 && (
                                <div className="flex flex-wrap gap-3 pt-4 border-t">
                                    {thread.images.map((image, index) => (
                                        <img key={index} src={image} alt={`Attachment ${index + 1}`} className="w-32 h-32 object-cover rounded-lg border" />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Replies */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Balasan ({thread.reply_count})
                        </h2>

                        <ReplyList replies={replies || []} threadId={thread.id} threadAuthorId={thread.author_id} threadIsSolved={thread.is_solved} isLoading={repliesLoading} onReplySubmit={() => refetchReplies()} />
                    </div>

                    {/* Reply Editor */}
                    {user && (
                        <div className="pt-4">
                            <Separator className="mb-6" />
                            <h3 className="font-medium mb-3">Tulis Balasan</h3>
                            <ReplyEditor threadId={thread.id} onSuccess={() => refetchReplies()} />
                        </div>
                    )}

                    {!user && (
                        <Card className="bg-muted/30">
                            <CardContent className="p-6 text-center">
                                <p className="text-muted-foreground mb-3">Silakan login untuk memberikan balasan</p>
                                <Button asChild>
                                    <Link to="/login">Login</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </RoleBasedLayout>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Diskusi?</AlertDialogTitle>
                        <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Diskusi beserta semua balasan akan dihapus secara permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteThread.isPending}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleteThread.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleteThread.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hapus
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
