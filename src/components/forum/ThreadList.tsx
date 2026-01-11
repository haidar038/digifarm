import { ForumThread } from "@/types/forum";
import { ThreadCard } from "./ThreadCard";
import { MessageSquare } from "lucide-react";

interface ThreadListProps {
    threads: ForumThread[];
    isLoading?: boolean;
    showCategory?: boolean;
    emptyMessage?: string;
}

export function ThreadList({ threads, isLoading = false, showCategory = true, emptyMessage = "Belum ada diskusi" }: ThreadListProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="bg-muted rounded-lg h-32" />
                    </div>
                ))}
            </div>
        );
    }

    if (threads.length === 0) {
        return (
            <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1">Tidak Ada Diskusi</h3>
                <p className="text-muted-foreground text-sm">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} showCategory={showCategory} />
            ))}
        </div>
    );
}
