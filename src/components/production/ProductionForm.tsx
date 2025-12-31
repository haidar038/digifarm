import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Production, Land, COMMODITIES } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "@/lib/dateUtils";
import { addDays } from "date-fns";

const formSchema = z.object({
    land_id: z.string().min(1, "Silakan pilih lahan"),
    commodity: z.string().min(1, "Silakan pilih komoditas"),
    custom_commodity: z.string().optional(),
    planting_date: z.string().min(1, "Tanggal tanam wajib diisi"),
    seed_count: z.coerce.number().min(1, "Jumlah benih harus lebih dari 0"),
    estimated_harvest_date: z.string().optional(),
    notes: z.string().max(500).optional(),
    // Harvest fields (for editing harvested productions)
    harvest_date: z.string().optional(),
    harvest_yield_kg: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProductionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    production?: Production | null;
    lands: Land[];
    onSuccess: () => void;
}

export function ProductionForm({ open, onOpenChange, production, lands, onSuccess }: ProductionFormProps) {
    const [showCustom, setShowCustom] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            land_id: "",
            commodity: "",
            custom_commodity: "",
            planting_date: format(new Date(), "yyyy-MM-dd"),
            seed_count: 0,
            estimated_harvest_date: "",
            notes: "",
            harvest_date: "",
            harvest_yield_kg: 0,
        },
    });

    // Check if we're editing a harvested production
    const isHarvested = production?.status === "harvested";

    useEffect(() => {
        if (production) {
            const isOther = !COMMODITIES.includes(production.commodity as any);
            form.reset({
                land_id: production.land_id,
                commodity: isOther ? "Others" : production.commodity,
                custom_commodity: isOther ? production.commodity : "",
                planting_date: production.planting_date,
                seed_count: production.seed_count,
                estimated_harvest_date: production.estimated_harvest_date || "",
                notes: production.notes || "",
                harvest_date: production.harvest_date || "",
                harvest_yield_kg: production.harvest_yield_kg || 0,
            });
            setShowCustom(isOther);
        } else {
            form.reset({
                land_id: "",
                commodity: "",
                custom_commodity: "",
                planting_date: format(new Date(), "yyyy-MM-dd"),
                seed_count: 0,
                estimated_harvest_date: format(addDays(new Date(), 90), "yyyy-MM-dd"),
                notes: "",
                harvest_date: "",
                harvest_yield_kg: 0,
            });
            setShowCustom(false);
        }
    }, [production, form]);

    const watchCommodity = form.watch("commodity");

    useEffect(() => {
        setShowCustom(watchCommodity === "Others");
    }, [watchCommodity]);

    const onSubmit = async (data: FormData) => {
        try {
            const commodity = data.commodity === "Others" && data.custom_commodity ? data.custom_commodity : data.commodity;

            const productionData = {
                land_id: data.land_id,
                commodity,
                planting_date: data.planting_date,
                seed_count: data.seed_count,
                estimated_harvest_date: data.estimated_harvest_date || null,
                notes: data.notes || null,
                status: "planted" as "planted" | "growing" | "harvested",
                harvest_date: null as string | null,
                harvest_yield_kg: null as number | null,
            };

            // If editing, preserve or update harvest data and status
            if (production) {
                // If it was harvested, allow updating harvest fields
                if (isHarvested) {
                    productionData.harvest_date = data.harvest_date || null;
                    productionData.harvest_yield_kg = data.harvest_yield_kg || null;
                    // Keep status as harvested if harvest data exists
                    productionData.status = data.harvest_date && data.harvest_yield_kg ? "harvested" : production.status;
                } else {
                    // Keep original status for non-harvested
                    productionData.status = production.status;
                }
            } else {
                // New production starts as planted
                productionData.status = "planted";
            }

            if (production) {
                const { error } = await supabase.from("productions").update(productionData).eq("id", production.id);
                if (error) throw error;
                toast({ title: "Produksi berhasil diperbarui" });
            } else {
                const { error } = await supabase.from("productions").insert(productionData);
                if (error) throw error;
                toast({ title: "Produksi berhasil ditambahkan" });
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Gagal menyimpan produksi",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{production ? "Edit Produksi" : "Tambah Produksi Baru"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="land_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lahan / Perkebunan *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih lahan" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {lands.map((land) => (
                                                <SelectItem key={land.id} value={land.id}>
                                                    {land.name} ({land.area_m2.toLocaleString()} m²)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="commodity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jenis Komoditas *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih komoditas" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {COMMODITIES.map((commodity) => (
                                                <SelectItem key={commodity} value={commodity}>
                                                    {commodity}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="planting_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tanggal Tanam *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="seed_count"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jumlah Benih *</FormLabel>
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
                            name="estimated_harvest_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Perkiraan Tanggal Panen</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Harvest Data Section - Only shown when editing harvested production */}
                        {isHarvested && (
                            <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                                <p className="text-sm font-medium text-primary">Data Panen</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="harvest_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tanggal Panen</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="harvest_yield_kg"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hasil Panen (kg)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.1" placeholder="0" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Tambahkan catatan..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button type="submit">{production ? "Perbarui Produksi" : "Tambah Produksi"}</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
