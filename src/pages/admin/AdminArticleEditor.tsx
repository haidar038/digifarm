import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminArticle, useArticleCategories, useArticleTags, useArticleTagsByArticleId, useCreateArticle, useUpdateArticle } from "@/hooks/useArticles";
import { ArticleEditor } from "@/components/articles";
import { ArticleFormData, ArticleStatus } from "@/types/article";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, Eye, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function AdminArticleEditor() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const { data: existingArticle, isLoading: articleLoading } = useAdminArticle(id || "");
    const { data: categories = [] } = useArticleCategories();
    const { data: allTags = [] } = useArticleTags();
    const { data: existingTagIds = [] } = useArticleTagsByArticleId(id || "");
    const createArticle = useCreateArticle();
    const updateArticle = useUpdateArticle();

    const [formData, setFormData] = useState<ArticleFormData>({
        title: "",
        excerpt: "",
        content: "",
        cover_image: null,
        category_id: null,
        status: "draft",
        tag_ids: [],
    });

    const [isPublished, setIsPublished] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Load existing article data
    useEffect(() => {
        if (existingArticle) {
            setFormData({
                title: existingArticle.title,
                excerpt: existingArticle.excerpt || "",
                content: existingArticle.content,
                cover_image: existingArticle.cover_image,
                category_id: existingArticle.category_id,
                status: existingArticle.status,
                tag_ids: existingTagIds,
            });
            setIsPublished(existingArticle.status === "published");
        }
    }, [existingArticle, existingTagIds]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast({
                title: "File tidak valid",
                description: "Silakan pilih file gambar",
                variant: "destructive",
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File terlalu besar",
                description: "Ukuran maksimal gambar adalah 5MB",
                variant: "destructive",
            });
            return;
        }

        try {
            setUploading(true);

            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `articles/${fileName}`;

            const { error: uploadError } = await supabase.storage.from("articles").upload(filePath, file);

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from("articles").getPublicUrl(filePath);

            setFormData((prev) => ({ ...prev, cover_image: publicUrl }));

            toast({
                title: "Gambar berhasil diunggah",
            });
        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "Gagal mengunggah gambar",
                description: error instanceof Error ? error.message : "Terjadi kesalahan",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (asDraft: boolean = false) => {
        // Validate required fields
        if (!formData.title.trim()) {
            toast({
                title: "Judul diperlukan",
                description: "Silakan masukkan judul artikel",
                variant: "destructive",
            });
            return;
        }

        if (!formData.content.trim() || formData.content === "<p></p>") {
            toast({
                title: "Konten diperlukan",
                description: "Silakan tulis konten artikel",
                variant: "destructive",
            });
            return;
        }

        const status: ArticleStatus = asDraft ? "draft" : isPublished ? "published" : "draft";

        try {
            if (isEditing && id) {
                await updateArticle.mutateAsync({
                    id,
                    formData: { ...formData, status },
                });
            } else {
                await createArticle.mutateAsync({ ...formData, status });
            }
            navigate("/admin/articles");
        } catch {
            // Error handled by mutation
        }
    };

    if (isEditing && articleLoading) {
        return (
            <AdminLayout title="Edit Artikel" description="Memuat artikel...">
                <div className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </AdminLayout>
        );
    }

    const isSaving = createArticle.isPending || updateArticle.isPending;

    return (
        <AdminLayout title={isEditing ? "Edit Artikel" : "Buat Artikel Baru"} description="Tulis dan kelola konten artikel">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Editor */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Back Button */}
                    <Button variant="ghost" onClick={() => navigate("/admin/articles")} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Button>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Judul Artikel *</Label>
                        <Input id="title" placeholder="Masukkan judul artikel..." value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} className="text-lg bg-white" />
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-2">
                        <Label htmlFor="excerpt">Ringkasan (Opsional)</Label>
                        <Textarea className="bg-white" id="excerpt" placeholder="Ringkasan singkat artikel..." value={formData.excerpt} onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))} rows={3} />
                        <p className="text-xs text-muted-foreground">Tampil di card preview dan meta description</p>
                    </div>

                    {/* Content Editor */}
                    <div className="space-y-2">
                        <Label>Konten Artikel *</Label>
                        <ArticleEditor content={formData.content} onChange={(content) => setFormData((prev) => ({ ...prev, content }))} placeholder="Tulis konten artikel di sini..." />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Publish Card */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Publikasi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="publish-toggle">Publikasi sekarang</Label>
                                <Switch id="publish-toggle" checked={isPublished} onCheckedChange={setIsPublished} />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => handleSubmit(true)} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Draft"}
                                </Button>
                                <Button className="flex-1 gap-2" onClick={() => handleSubmit(false)} disabled={isSaving}>
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {isPublished ? "Publikasi" : "Simpan"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Card */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Kategori</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={formData.category_id || "none"} onValueChange={(v) => setFormData((prev) => ({ ...prev, category_id: v === "none" ? null : v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Tidak ada kategori</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Tags Card */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Tags</CardTitle>
                            <CardDescription>Pilih tags untuk artikel</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {allTags.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Belum ada tags tersedia</p>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {allTags.map((tag) => (
                                        <div key={tag.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`tag-${tag.id}`}
                                                checked={formData.tag_ids.includes(tag.id)}
                                                onCheckedChange={(checked) => {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        tag_ids: checked ? [...prev.tag_ids, tag.id] : prev.tag_ids.filter((id) => id !== tag.id),
                                                    }));
                                                }}
                                            />
                                            <Label htmlFor={`tag-${tag.id}`} className="text-sm font-normal cursor-pointer">
                                                {tag.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Cover Image Card */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Cover Image</CardTitle>
                            <CardDescription>Gambar sampul untuk artikel</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.cover_image ? (
                                <div className="relative">
                                    <img src={formData.cover_image} alt="Cover" className="w-full aspect-video object-cover rounded-lg" />
                                    <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setFormData((prev) => ({ ...prev, cover_image: null }))}>
                                        Hapus
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col items-center justify-center py-4">
                                        {uploading ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        ) : (
                                            <>
                                                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                                <p className="text-sm text-muted-foreground">Klik untuk upload gambar</p>
                                                <p className="text-xs text-muted-foreground">Max 5MB</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                            )}
                        </CardContent>
                    </Card>

                    {/* Preview Button */}
                    {isEditing && existingArticle?.status === "published" && (
                        <Button variant="outline" className="w-full gap-2" asChild>
                            <a href={`/articles/${existingArticle.slug}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                                Lihat Artikel
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
