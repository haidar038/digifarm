import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Upload, X } from "lucide-react";
import { Land, COMMODITIES } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MapSelector } from "./MapSelector";
import { useAuth } from "@/contexts/auth-context";

const formSchema = z.object({
    name: z.string().min(1, "Nama lahan wajib diisi").max(100),
    area_m2: z.coerce.number().min(1, "Luas harus lebih dari 0"),
    address: z.string().max(500).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
    longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
    commodities: z.array(z.string()).min(1, "Pilih minimal satu komoditas"),
    custom_commodity: z.string().max(100).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface LandFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    land?: Land | null;
    onSuccess: () => void;
    // Manager context - for CRUD on behalf of farmer
    targetFarmerId?: string;
    targetFarmerName?: string;
}

export function LandForm({ open, onOpenChange, land, onSuccess, targetFarmerId, targetFarmerName }: LandFormProps) {
    const { user } = useAuth();
    const [photos, setPhotos] = useState<File[]>([]);
    const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [showCustom, setShowCustom] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            area_m2: 0,
            address: "",
            latitude: null,
            longitude: null,
            commodities: [],
            custom_commodity: "",
        },
    });

    useEffect(() => {
        if (land) {
            form.reset({
                name: land.name,
                area_m2: land.area_m2,
                address: land.address || "",
                latitude: land.latitude,
                longitude: land.longitude,
                commodities: land.commodities,
                custom_commodity: land.custom_commodity || "",
            });
            setExistingPhotos(land.photos || []);
            setShowCustom(land.commodities.includes("Lainnya"));
        } else {
            form.reset({
                name: "",
                area_m2: 0,
                address: "",
                latitude: null,
                longitude: null,
                commodities: [],
                custom_commodity: "",
            });
            setExistingPhotos([]);
            setPhotos([]);
            setShowCustom(false);
        }
    }, [land, form]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const totalPhotos = existingPhotos.length + photos.length + files.length;
        if (totalPhotos > 3) {
            toast({
                title: "Maksimal 3 foto",
                variant: "destructive",
            });
            return;
        }
        setPhotos((prev) => [...prev, ...files].slice(0, 3 - existingPhotos.length));
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const removeExistingPhoto = (url: string) => {
        setExistingPhotos((prev) => prev.filter((p) => p !== url));
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        form.setValue("latitude", lat);
        form.setValue("longitude", lng);
    };

    const onSubmit = async (data: FormData) => {
        try {
            setUploading(true);

            // Upload new photos
            const uploadedUrls: string[] = [...existingPhotos];
            for (const photo of photos) {
                const fileName = `${Date.now()}-${photo.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage.from("farm-photos").upload(fileName, photo);

                if (uploadError) throw uploadError;

                const {
                    data: { publicUrl },
                } = supabase.storage.from("farm-photos").getPublicUrl(uploadData.path);

                uploadedUrls.push(publicUrl);
            }

            const landData: Record<string, any> = {
                name: data.name,
                area_m2: data.area_m2,
                address: data.address || null,
                latitude: data.latitude || null,
                longitude: data.longitude || null,
                commodities: data.commodities,
                custom_commodity: data.commodities.includes("Lainnya") ? data.custom_commodity : null,
                photos: uploadedUrls,
                status: "active" as const,
            };

            // Set user_id for new land insertions
            // Manager inputting on behalf of farmer: use targetFarmerId
            // Farmer inputting own land: use current user's ID
            if (!land) {
                const userId = targetFarmerId || user?.id;
                if (!userId) {
                    throw new Error("Sesi tidak valid. Silakan login kembali.");
                }
                landData.user_id = userId;
            }

            if (land) {
                const { error } = await supabase
                    .from("lands")
                    .update(landData as any)
                    .eq("id", land.id);
                if (error) throw error;
                toast({ title: "Lahan berhasil diperbarui" });
            } else {
                const { error } = await supabase.from("lands").insert(landData as any);
                if (error) throw error;
                toast({ title: "Lahan berhasil ditambahkan" });
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Gagal menyimpan lahan",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const watchCommodities = form.watch("commodities");

    useEffect(() => {
        setShowCustom(watchCommodities.includes("Lainnya"));
    }, [watchCommodities]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {land ? "Edit Lahan" : "Tambah Lahan Baru"}
                        {targetFarmerName && <span className="block text-sm font-normal text-muted-foreground mt-1">Atas nama: {targetFarmerName}</span>}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama Lahan *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan nama lahan" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="area_m2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Luas (m²) *</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Alamat</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Masukkan alamat" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="latitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Garis Lintang</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="any" placeholder="-6.2088" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="longitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Garis Bujur</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="any" placeholder="106.8456" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <FormLabel>Pilih Lokasi di Peta</FormLabel>
                            <MapSelector latitude={form.watch("latitude") ?? undefined} longitude={form.watch("longitude") ?? undefined} onLocationSelect={handleLocationSelect} />
                        </div>

                        <FormField
                            control={form.control}
                            name="commodities"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Komoditas *</FormLabel>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {COMMODITIES.map((commodity) => (
                                            <FormField
                                                key={commodity}
                                                control={form.control}
                                                name="commodities"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(commodity)}
                                                                onCheckedChange={(checked) => {
                                                                    const newValue = checked ? [...(field.value || []), commodity] : field.value?.filter((v) => v !== commodity) || [];
                                                                    field.onChange(newValue);
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-sm font-normal cursor-pointer">{commodity}</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {showCustom && (
                            <FormField
                                control={form.control}
                                name="custom_commodity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama Komoditas Kustom</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan nama komoditas" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="space-y-2">
                            <FormLabel>Foto Lahan (Min 1, Maks 3)</FormLabel>
                            <div className="flex flex-wrap gap-3">
                                {existingPhotos.map((url, index) => (
                                    <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                                        <img src={url} alt={`Farm ${index + 1}`} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeExistingPhoto(url)} className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                                        <img src={URL.createObjectURL(photo)} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removePhoto(index)} className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {existingPhotos.length + photos.length < 3 && (
                                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                                        <Upload className="w-6 h-6 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground mt-1">Unggah</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={uploading}>
                                {uploading ? "Menyimpan..." : land ? "Perbarui Lahan" : "Tambah Lahan"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
