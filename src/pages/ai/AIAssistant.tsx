import { useState } from "react";
import { Link } from "react-router-dom";
import { useAIChat } from "@/hooks/useAIChat";
import { useAuth } from "@/contexts/auth-context";
import { ChatInterface } from "@/components/ai/ChatInterface";
import { ConversationList } from "@/components/ai/ConversationList";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Leaf, Menu, History, LogIn, ArrowLeft } from "lucide-react";

export default function AIAssistant() {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { messages, isLoading, error, conversationId, conversations, sendMessage, loadConversation, createNewConversation, deleteConversation, renameConversation } = useAIChat();

    const handleSelectConversation = (id: string) => {
        loadConversation(id);
        setSidebarOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-3">
                    {/* Mobile sidebar toggle */}
                    {user && (
                        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <History className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-72 p-0">
                                <div className="p-4 border-b">
                                    <h2 className="font-semibold">Riwayat Chat</h2>
                                </div>
                                <ConversationList
                                    conversations={conversations}
                                    currentConversationId={conversationId}
                                    onSelectConversation={handleSelectConversation}
                                    onNewConversation={() => {
                                        createNewConversation();
                                        setSidebarOpen(false);
                                    }}
                                    onDeleteConversation={deleteConversation}
                                    onRenameConversation={renameConversation}
                                />
                            </SheetContent>
                        </Sheet>
                    )}

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <Leaf className="h-6 w-6 text-primary" />
                        <span className="font-bold hidden sm:inline">DigiFarm</span>
                    </Link>
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                        AI Assistant
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    {/* Back to landing */}
                    <Link to="/">
                        <Button variant="ghost" size="sm" className="gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Kembali</span>
                        </Button>
                    </Link>

                    {/* Auth status */}
                    {user ? (
                        <Link to="/dashboard">
                            <Button variant="outline" size="sm">
                                Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <Link to="/login">
                            <Button size="sm" className="gap-1">
                                <LogIn className="h-4 w-4" />
                                Masuk
                            </Button>
                        </Link>
                    )}
                </div>
            </header>

            {/* Guest mode notice */}
            {!user && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900 px-4 py-2 text-center">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        Mode tamu - Riwayat chat tidak disimpan.{" "}
                        <Link to="/login" className="font-medium underline">
                            Masuk
                        </Link>{" "}
                        untuk menyimpan percakapan.
                    </p>
                </div>
            )}

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar */}
                {user && (
                    <aside className="hidden md:flex w-64 border-r flex-col">
                        <ConversationList
                            conversations={conversations}
                            currentConversationId={conversationId}
                            onSelectConversation={handleSelectConversation}
                            onNewConversation={createNewConversation}
                            onDeleteConversation={deleteConversation}
                            onRenameConversation={renameConversation}
                        />
                    </aside>
                )}

                {/* Chat Area */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    <ChatInterface messages={messages} isLoading={isLoading} error={error} onSendMessage={sendMessage} />
                </main>
            </div>
        </div>
    );
}
