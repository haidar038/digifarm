import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Production } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatShortDate, format } from "@/lib/dateUtils";
import { translateCommodity } from "@/lib/i18n";

const formSchema = z.object({
    harvest_date: z.string().min(1, "Tanggal panen wajib diisi"),
    harvest_yield_kg: z.coerce.number().min(0.01, "Hasil panen harus lebih dari 0"),
});

type FormData = z.infer<typeof formSchema>;

interface HarvestFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    production: Production;
    onSuccess: () => void;
}

export function HarvestForm({ open, onOpenChange, production, onSuccess }: HarvestFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            harvest_date: production.harvest_date || format(new Date(), "yyyy-MM-dd"),
            harvest_yield_kg: production.harvest_yield_kg || 0,
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from("productions")
                .update({
                    harvest_date: data.harvest_date,
                    harvest_yield_kg: data.harvest_yield_kg,
                    status: "harvested" as const,
                })
                .eq("id", production.id);

            if (error) throw error;
            toast({ title: "Panen berhasil dicatat" });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Gagal mencatat panen",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Catat Panen</DialogTitle>
                </DialogHeader>
                <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Mencatat panen untuk:</p>
                    <p className="font-medium">{translateCommodity(production.commodity)}</p>
                    <p className="text-sm text-muted-foreground"> Ditanam pada {formatShortDate(production.planting_date)}</p>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="harvest_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tanggal Panen *</FormLabel>
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
                                    <FormLabel>Hasil Panen (kg) *</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Menyimpan..." : "Catat Panen"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
