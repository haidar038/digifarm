import { ForumReply } from "@/types/forum";
import { ReplyCard } from "./ReplyCard";
import { MessageSquare } from "lucide-react";

interface ReplyListProps {
    replies: ForumReply[];
    threadId: string;
    threadAuthorId: string;
    threadIsSolved: boolean; // Added for accept answer logic
    isLoading?: boolean;
    onReplySubmit?: () => void;
}

export function ReplyList({ replies, threadId, threadAuthorId, threadIsSolved, isLoading = false, onReplySubmit }: ReplyListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                            <div className="flex-1">
                                <div className="h-4 bg-muted rounded w-32 mb-2" />
                                <div className="h-20 bg-muted rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (replies.length === 0) {
        return (
            <div className="text-center py-12 px-4 border rounded-lg bg-muted/30">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">Belum Ada Balasan</h3>
                <p className="text-sm text-muted-foreground">Jadilah yang pertama memberikan jawaban!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {replies.map((reply) => (
                <ReplyCard key={reply.id} reply={reply} threadId={threadId} threadAuthorId={threadAuthorId} threadIsSolved={threadIsSolved} onReplySubmit={onReplySubmit} />
            ))}
        </div>
    );
}
