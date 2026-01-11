import { useState, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleUpvote } from "@/hooks/useForum";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UpvoteButtonProps {
    replyId: string;
    upvoteCount: number;
    hasUpvoted: boolean;
    authorId: string; // For self-like prevention
    className?: string;
}

export function UpvoteButton({ replyId, upvoteCount, hasUpvoted, authorId, className }: UpvoteButtonProps) {
    const { user } = useAuth();
    const toggleUpvote = useToggleUpvote();

    // Local state for optimistic updates
    const [optimisticUpvoted, setOptimisticUpvoted] = useState(hasUpvoted);
    const [optimisticCount, setOptimisticCount] = useState(upvoteCount);

    // Bug Fix #1: Sync local state with props when they change (after refetch)
    useEffect(() => {
        setOptimisticUpvoted(hasUpvoted);
        setOptimisticCount(upvoteCount);
    }, [hasUpvoted, upvoteCount]);

    const handleClick = () => {
        if (!user) {
            toast({
                variant: "destructive",
                title: "Login diperlukan",
                description: "Silakan login untuk memberikan like.",
            });
            return;
        }

        // Bug Fix #5: Prevent self-like
        if (user.id === authorId) {
            toast({
                variant: "destructive",
                title: "Tidak dapat like",
                description: "Anda tidak dapat memberikan like pada jawaban sendiri.",
            });
            return;
        }

        // Optimistic update
        const newUpvoted = !optimisticUpvoted;
        const newCount = newUpvoted ? optimisticCount + 1 : optimisticCount - 1;

        setOptimisticUpvoted(newUpvoted);
        setOptimisticCount(newCount);

        toggleUpvote.mutate(
            { replyId, hasUpvoted: optimisticUpvoted },
            {
                onError: () => {
                    // Revert on error
                    setOptimisticUpvoted(hasUpvoted);
                    setOptimisticCount(upvoteCount);
                },
            }
        );
    };

    const isOwnReply = user?.id === authorId;

    return (
        <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1.5 h-8", optimisticUpvoted && "text-primary bg-primary/10 hover:bg-primary/20", isOwnReply && "opacity-50 cursor-not-allowed", className)}
            onClick={handleClick}
            disabled={!user || toggleUpvote.isPending}
            title={isOwnReply ? "Tidak dapat like jawaban sendiri" : "Like"}
        >
            <ThumbsUp className={cn("w-4 h-4", optimisticUpvoted && "fill-current")} />
            <span>{optimisticCount}</span>
        </Button>
    );
}
