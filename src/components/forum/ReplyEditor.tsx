import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateReply } from "@/hooks/useForum";
import { useAuth } from "@/contexts/auth-context";
import { ForumRichTextEditor } from "./ForumRichTextEditor";
import { Send, X } from "lucide-react";

interface ReplyEditorProps {
    threadId: string;
    parentId?: string | null;
    onCancel?: () => void;
    onSuccess?: () => void;
    placeholder?: string;
}

export function ReplyEditor({ threadId, parentId = null, onCancel, onSuccess, placeholder = "Tulis balasan Anda..." }: ReplyEditorProps) {
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const createReply = useCreateReply();

    // Check if content has meaningful text (not just empty HTML tags)
    const hasContent = content.replace(/<[^>]*>/g, "").trim().length > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasContent) return;

        createReply.mutate(
            {
                threadId,
                formData: {
                    content: content,
                    parent_id: parentId,
                },
            },
            {
                onSuccess: () => {
                    setContent("");
                    onSuccess?.();
                },
            }
        );
    };

    if (!user) {
        return (
            <Card className="bg-muted/30">
                <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Silakan login untuk memberikan balasan</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardContent className="p-3">
                    <ForumRichTextEditor content={content} onChange={setContent} placeholder={placeholder} disabled={createReply.isPending} minHeight="100px" />

                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                        {onCancel && (
                            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={createReply.isPending}>
                                <X className="w-4 h-4 mr-1" />
                                Batal
                            </Button>
                        )}
                        <Button type="submit" size="sm" disabled={!hasContent || createReply.isPending}>
                            <Send className="w-4 h-4 mr-1" />
                            {createReply.isPending ? "Mengirim..." : "Kirim Balasan"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
