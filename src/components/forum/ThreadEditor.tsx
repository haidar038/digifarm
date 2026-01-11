import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForumCategories, useCreateThread, useUpdateThread } from "@/hooks/useForum";
import { ThreadFormData, ForumThread } from "@/types/forum";
import { ForumRichTextEditor } from "./ForumRichTextEditor";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

interface ThreadEditorProps {
    thread?: ForumThread;
    onSuccess?: (slug: string) => void;
}

export function ThreadEditor({ thread, onSuccess }: ThreadEditorProps) {
    const navigate = useNavigate();
    const { data: categories, isLoading: categoriesLoading } = useForumCategories();
    const createThread = useCreateThread();
    const updateThread = useUpdateThread();

    const isEditing = !!thread;
    const isSubmitting = createThread.isPending || updateThread.isPending;

    const [formData, setFormData] = useState<ThreadFormData>({
        title: "",
        content: "",
        category_id: null,
        images: [],
        tag_ids: [],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (thread) {
            setFormData({
                title: thread.title,
                content: thread.content,
                category_id: thread.category_id,
                images: thread.images || [],
                tag_ids: [],
            });
        }
    }, [thread]);

    // Check if content has meaningful text (not just empty HTML tags)
    const getTextContent = (html: string) => html.replace(/<[^>]*>/g, "").trim();

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = "Judul wajib diisi";
        } else if (formData.title.length < 10) {
            newErrors.title = "Judul minimal 10 karakter";
        }

        const textContent = getTextContent(formData.content);
        if (!textContent) {
            newErrors.content = "Konten wajib diisi";
        } else if (textContent.length < 20) {
            newErrors.content = "Konten minimal 20 karakter";
        }

        if (!formData.category_id) {
            newErrors.category_id = "Pilih kategori";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        if (isEditing && thread) {
            updateThread.mutate(
                { id: thread.id, formData },
                {
                    onSuccess: (data) => {
                        onSuccess?.(data.slug);
                        navigate(`/forum/thread/${data.slug}`);
                    },
                }
            );
        } else {
            createThread.mutate(formData, {
                onSuccess: (data) => {
                    onSuccess?.(data.slug);
                    navigate(`/forum/thread/${data.slug}`);
                },
            });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <CardTitle>{isEditing ? "Edit Diskusi" : "Buat Diskusi Baru"}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Judul <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            placeholder="Masukkan judul diskusi Anda..."
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className={errors.title ? "border-destructive" : ""}
                            disabled={isSubmitting}
                        />
                        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                        <p className="text-xs text-muted-foreground">Gunakan judul yang jelas dan deskriptif agar mudah ditemukan</p>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category">
                            Kategori <span className="text-destructive">*</span>
                        </Label>
                        <Select value={formData.category_id || ""} onValueChange={(value) => setFormData({ ...formData, category_id: value })} disabled={isSubmitting || categoriesLoading}>
                            <SelectTrigger className={errors.category_id ? "border-destructive" : ""}>
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories?.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category_id && <p className="text-sm text-destructive">{errors.category_id}</p>}
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <Label htmlFor="content">
                            Konten <span className="text-destructive">*</span>
                        </Label>
                        <ForumRichTextEditor
                            content={formData.content}
                            onChange={(content) => setFormData({ ...formData, content })}
                            placeholder="Jelaskan pertanyaan atau topik diskusi Anda secara detail..."
                            disabled={isSubmitting}
                            minHeight="200px"
                            className={errors.content ? "border-destructive" : ""}
                        />
                        {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
                        <p className="text-xs text-muted-foreground">Berikan detail yang cukup agar orang lain dapat memahami dan membantu Anda</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isEditing ? "Menyimpan..." : "Membuat..."}
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    {isEditing ? "Simpan Perubahan" : "Buat Diskusi"}
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
