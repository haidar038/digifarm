import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Bot, AlertCircle, Leaf } from "lucide-react";
import type { AIMessage } from "@/types/ai";

interface ChatInterfaceProps {
    messages: AIMessage[];
    isLoading: boolean;
    error: string | null;
    onSendMessage: (message: string, imageBase64?: string) => Promise<void>;
}

export function ChatInterface({ messages, isLoading, error, onSendMessage }: ChatInterfaceProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Leaf className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">DigiFarm AI Assistant</h3>
                        <p className="text-muted-foreground max-w-md mb-6">Asisten AI untuk membantu pertanian Anda. Tanyakan tentang budidaya, hama, penyakit, atau kirim foto tanaman untuk analisis.</p>
                        <div className="grid gap-2 text-sm text-left max-w-md">
                            <div className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors" onClick={() => onSendMessage("Bagaimana cara menanam cabai yang baik?")}>
                                💡 "Bagaimana cara menanam cabai yang baik?"
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors" onClick={() => onSendMessage("Apa penyebab daun tanaman menguning?")}>
                                💡 "Apa penyebab daun tanaman menguning?"
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors" onClick={() => onSendMessage("Bagaimana mengatasi hama kutu daun?")}>
                                💡 "Bagaimana mengatasi hama kutu daun?"
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <ChatMessage key={message.id} message={message} />
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex gap-3 p-4 rounded-lg bg-primary/5">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        )}

                        <div ref={scrollRef} />
                    </div>
                )}
            </ScrollArea>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive" className="mx-4 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Input Area */}
            <ChatInput onSend={onSendMessage} isLoading={isLoading} />
        </div>
    );
}
