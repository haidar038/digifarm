import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Trash2, Pencil, MoreVertical } from "lucide-react";
import type { AIConversation } from "@/types/ai";

interface ConversationListProps {
    conversations: AIConversation[];
    currentConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onNewConversation: () => void;
    onDeleteConversation: (id: string) => void;
    onRenameConversation: (id: string, newTitle: string) => void;
}

export function ConversationList({ conversations, currentConversationId, onSelectConversation, onNewConversation, onDeleteConversation, onRenameConversation }: ConversationListProps) {
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [editingConv, setEditingConv] = useState<AIConversation | null>(null);
    const [newTitle, setNewTitle] = useState("");

    const handleOpenRename = (conv: AIConversation) => {
        setEditingConv(conv);
        setNewTitle(conv.title);
        setRenameDialogOpen(true);
    };

    const handleRename = () => {
        if (editingConv && newTitle.trim()) {
            onRenameConversation(editingConv.id, newTitle.trim());
            setRenameDialogOpen(false);
            setEditingConv(null);
            setNewTitle("");
        }
    };

    return (
        <>
            <div className="flex flex-col h-full">
                {/* New Chat Button */}
                <div className="p-3 border-b">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={onNewConversation}>
                        <Plus className="h-4 w-4" />
                        Chat Baru
                    </Button>
                </div>

                {/* Conversations List */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {conversations.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat chat</p>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    className={cn("group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors", currentConversationId === conv.id && "bg-muted")}
                                    onClick={() => onSelectConversation(conv.id)}
                                >
                                    <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="text-sm text-ellipsis" title={conv.title}>
                                            {conv.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{new Date(conv.updated_at).toLocaleDateString("id-ID")}</p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={() => handleOpenRename(conv)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Ubah Nama
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDeleteConversation(conv.id)}>
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ubah Nama Percakapan</DialogTitle>
                        <DialogDescription>Masukkan nama baru untuk percakapan ini.</DialogDescription>
                    </DialogHeader>
                    <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Nama percakapan"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename();
                        }}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleRename} disabled={!newTitle.trim()}>
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
