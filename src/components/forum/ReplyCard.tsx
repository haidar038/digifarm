import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ForumReply } from "@/types/forum";
import { formatForumDate } from "@/lib/forum-utils";
import { UpvoteButton } from "./UpvoteButton";
import { ExpertBadge } from "./ExpertBadge";
import { ReplyEditor } from "./ReplyEditor";
import { CheckCircle, Reply, MoreHorizontal, Award, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAcceptAnswer, useDeleteReply } from "@/hooks/useForum";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ReplyCardProps {
    reply: ForumReply;
    threadId: string;
    threadAuthorId: string;
    threadIsSolved: boolean; // Bug Fix #4: Track if thread already has accepted answer
    isNested?: boolean;
    onReplySubmit?: () => void;
}

export function ReplyCard({ reply, threadId, threadAuthorId, threadIsSolved, isNested = false, onReplySubmit }: ReplyCardProps) {
    const { user } = useAuth();
    const [showReplyEditor, setShowReplyEditor] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const acceptAnswer = useAcceptAnswer();
    const deleteReply = useDeleteReply();

    const isThreadAuthor = user?.id === threadAuthorId;
    const isReplyAuthor = user?.id === reply.author_id;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleAcceptAnswer = () => {
        acceptAnswer.mutate({ replyId: reply.id, threadId });
    };

    const handleDelete = () => {
        deleteReply.mutate(
            { replyId: reply.id, threadId },
            {
                onSuccess: () => {
                    setShowDeleteDialog(false);
                    onReplySubmit?.();
                },
            }
        );
    };

    // Bug Fix #4: Determine if accept button should be shown/enabled
    // Show accept button only if:
    // 1. Current user is thread author
    // 2. This reply is NOT already accepted
    // 3. Thread is not already solved OR this is the accepted answer
    const canAcceptAnswer = isThreadAuthor && !reply.is_accepted_answer && !threadIsSolved;

    return (
        <>
            <div className={cn("group", isNested && "ml-8 md:ml-12 mt-3")}>
                <div
                    className={cn(
                        "p-4 rounded-lg border bg-card",
                        reply.is_accepted_answer && "border-green-500 bg-green-50/50 dark:bg-green-900/10",
                        reply.is_expert_answer && !reply.is_accepted_answer && "border-purple-300 dark:border-purple-700"
                    )}
                >
                    {/* Accepted Answer Badge */}
                    {reply.is_accepted_answer && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium mb-3 pb-3 border-b border-green-200 dark:border-green-800">
                            <CheckCircle className="w-4 h-4" />
                            <span>Jawaban Diterima</span>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={cn("text-xs", reply.author?.role === "expert" ? "bg-purple-100 text-purple-800" : "bg-primary/10 text-primary")}>
                                {reply.author?.full_name ? getInitials(reply.author.full_name) : "?"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            {/* Author Info */}
                            <div className="flex items-center gap-2 flex-wrap text-sm">
                                <span className="font-medium">{reply.author?.full_name || "Anonim"}</span>
                                {reply.author?.role === "expert" && <ExpertBadge showIcon={false} className="text-[10px] py-0 px-1.5 h-4" />}
                                {reply.is_expert_answer && !reply.is_accepted_answer && (
                                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 bg-purple-50 text-purple-700">
                                        <Award className="w-3 h-3 mr-0.5" />
                                        Expert Answer
                                    </Badge>
                                )}
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">{formatForumDate(reply.created_at)}</span>
                            </div>

                            {/* Content */}
                            <div className="mt-2 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: reply.content }} />

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                <UpvoteButton replyId={reply.id} upvoteCount={reply.upvote_count} hasUpvoted={reply.has_upvoted || false} authorId={reply.author_id} />

                                {!isNested && user && (
                                    <Button variant="ghost" size="sm" className="gap-1.5 h-8" onClick={() => setShowReplyEditor(!showReplyEditor)}>
                                        <Reply className="w-4 h-4" />
                                        <span>Balas</span>
                                    </Button>
                                )}

                                {/* Accept Answer - Bug Fix #4: Only show if allowed */}
                                {canAcceptAnswer && (
                                    <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleAcceptAnswer} disabled={acceptAnswer.isPending}>
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Terima Jawaban</span>
                                    </Button>
                                )}

                                {/* More Options - Show for reply author */}
                                {isReplyAuthor && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)}>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reply Editor */}
                {showReplyEditor && (
                    <div className="mt-3 ml-11">
                        <ReplyEditor
                            threadId={threadId}
                            parentId={reply.id}
                            onCancel={() => setShowReplyEditor(false)}
                            onSuccess={() => {
                                setShowReplyEditor(false);
                                onReplySubmit?.();
                            }}
                        />
                    </div>
                )}

                {/* Nested Replies */}
                {reply.children && reply.children.length > 0 && (
                    <div className="space-y-3 mt-3">
                        {reply.children.map((childReply) => (
                            <ReplyCard key={childReply.id} reply={childReply} threadId={threadId} threadAuthorId={threadAuthorId} threadIsSolved={threadIsSolved} isNested onReplySubmit={onReplySubmit} />
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Balasan?</AlertDialogTitle>
                        <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Balasan Anda akan dihapus secara permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteReply.isPending}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleteReply.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleteReply.isPending ? (
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
