import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ImagePlus, X, Loader2 } from "lucide-react";

interface ChatInputProps {
    onSend: (message: string, imageBase64?: string) => Promise<void>;
    isLoading: boolean;
    disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = async () => {
        if ((!message.trim() && !imageBase64) || isLoading) return;

        await onSend(message.trim(), imageBase64 || undefined);
        setMessage("");
        setImagePreview(null);
        setImageBase64(null);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (max 10MB for safety)
        if (file.size > 10 * 1024 * 1024) {
            alert("Ukuran gambar maksimal 10MB");
            return;
        }

        // Check file type
        if (!file.type.startsWith("image/")) {
            alert("File harus berupa gambar");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setImagePreview(base64);
            setImageBase64(base64);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImagePreview(null);
        setImageBase64(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="border-t bg-background p-4">
            {/* Image Preview */}
            {imagePreview && (
                <div className="mb-3 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border" />
                    <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90">
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2 items-end">
                {/* Image Upload Button */}
                <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading || disabled} title="Upload gambar untuk analisis">
                    <ImagePlus className="h-4 w-4" />
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

                {/* Text Input */}
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik pertanyaan tentang pertanian..."
                    disabled={isLoading || disabled}
                    className="min-h-[44px] max-h-[120px] resize-none"
                    rows={1}
                />

                {/* Send Button */}
                <Button onClick={handleSend} disabled={(!message.trim() && !imageBase64) || isLoading || disabled} size="icon">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-muted-foreground mt-2">
                Tekan Enter untuk kirim, Shift+Enter untuk baris baru.
                {!disabled && " Anda dapat mengirim gambar untuk analisis tanaman."}
            </p>
        </div>
    );
}
