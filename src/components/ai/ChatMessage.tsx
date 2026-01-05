import { memo } from "react";
import { cn } from "@/lib/utils";
import { Bot, User, ImageIcon } from "lucide-react";
import type { AIMessage } from "@/types/ai";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
    message: AIMessage;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === "user";

    return (
        <div className={cn("flex gap-3 p-4 rounded-lg", isUser ? "bg-muted/50" : "bg-primary/5")}>
            {/* Avatar */}
            <div className={cn("flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center", isUser ? "bg-primary text-primary-foreground" : "bg-green-600 text-white")}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2 overflow-hidden">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{isUser ? "Anda" : "DigiFarm Assistant"}</span>
                    <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>

                {/* Image indicator for user messages */}
                {isUser && message.image_url && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ImageIcon className="h-3 w-3" />
                        <span>Gambar terlampir</span>
                    </div>
                )}

                {/* Message content */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                        components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>,
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
});
