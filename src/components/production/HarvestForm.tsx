import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Production } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatShortDate, format } from "@/lib/dateUtils";
import { translateCommodity } from "@/lib/i18n";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { calculateRevenue, calculateProfit, calculateROI, formatCurrency, getSmartCostDefault, getSmartPriceDefault } from "@/lib/cost-utils";

const formSchema = z.object({
    harvest_date: z.string().min(1, "Tanggal panen wajib diisi"),
    harvest_yield_kg: z.coerce.number().min(0.01, "Hasil panen harus lebih dari 0"),
    // Optional cost/revenue fields
    total_cost: z.coerce.number().optional(),
    selling_price_per_kg: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface HarvestFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    production: Production;
    onSuccess: () => void;
    historicalProductions?: Production[];
}

export function HarvestForm({ open, onOpenChange, production, onSuccess, historicalProductions = [] }: HarvestFormProps) {
    const [loading, setLoading] = useState(false);
    const [showCostSection, setShowCostSection] = useState(false);

    // Get smart defaults
    const smartCost = useMemo(() => getSmartCostDefault(production.commodity, historicalProductions), [production.commodity, historicalProductions]);
    const smartPrice = useMemo(() => getSmartPriceDefault(production.commodity, historicalProductions), [production.commodity, historicalProductions]);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            harvest_date: production.harvest_date || format(new Date(), "yyyy-MM-dd"),
            harvest_yield_kg: production.harvest_yield_kg || 0,
            total_cost: production.total_cost || undefined,
            selling_price_per_kg: production.selling_price_per_kg || undefined,
        },
    });

    // Watch values for live calculation
    const watchYield = form.watch("harvest_yield_kg");
    const watchCost = form.watch("total_cost");
    const watchPrice = form.watch("selling_price_per_kg");

    // Calculate profit preview
    const profitPreview = useMemo(() => {
        const yieldKg = watchYield || 0;
        const price = watchPrice || 0;
        const cost = watchCost || 0;

        if (yieldKg <= 0 || price <= 0) return null;

        const revenue = calculateRevenue(yieldKg, price);
        const profit = calculateProfit(revenue, cost || null);
        const roi = calculateROI(profit, cost || null);

        return { revenue, profit, roi };
    }, [watchYield, watchCost, watchPrice]);

    // Apply smart default when section is opened
    useEffect(() => {
        if (showCostSection) {
            const currentCost = form.getValues("total_cost");
            const currentPrice = form.getValues("selling_price_per_kg");

            if (!currentCost) {
                form.setValue("total_cost", smartCost.value);
            }
            if (!currentPrice) {
                form.setValue("selling_price_per_kg", smartPrice.value);
            }
        }
    }, [showCostSection, smartCost.value, smartPrice.value, form]);

    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from("productions")
                .update({
                    harvest_date: data.harvest_date,
                    harvest_yield_kg: data.harvest_yield_kg,
                    status: "harvested" as const,
                    // Only save cost/revenue if section was opened and values are valid
                    total_cost: showCostSection && data.total_cost ? data.total_cost : null,
                    selling_price_per_kg: showCostSection && data.selling_price_per_kg ? data.selling_price_per_kg : null,
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
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

                        {/* Collapsible Cost/Revenue Section */}
                        <Collapsible open={showCostSection} onOpenChange={setShowCostSection}>
                            <CollapsibleTrigger asChild>
                                <Button type="button" variant="ghost" className="w-full flex items-center justify-between p-3 h-auto border border-dashed rounded-lg hover:bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <Calculator className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Hitung Keuntungan (Opsional)</span>
                                    </div>
                                    {showCostSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3 space-y-4">
                                <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="total_cost"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center justify-between">
                                                    <span>Total Biaya Produksi</span>
                                                    <span className="text-xs font-normal text-muted-foreground">{smartCost.source === "history" ? "dari history" : "estimasi"}</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                                                        <Input type="number" step="1000" placeholder="0" className="pl-10" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="selling_price_per_kg"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center justify-between">
                                                    <span>Harga Jual per Kg</span>
                                                    <span className="text-xs font-normal text-muted-foreground">{smartPrice.source === "history" ? "dari history" : "estimasi"}</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                                                        <Input type="number" step="100" placeholder="0" className="pl-10" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Profit Preview */}
                                    {profitPreview && (
                                        <div className="pt-3 border-t border-border">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Estimasi Pendapatan:</span>
                                                <span className="text-sm font-medium">{formatCurrency(profitPreview.revenue)}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-sm text-muted-foreground">Estimasi Keuntungan:</span>
                                                <span className={`text-sm font-bold flex items-center gap-1 ${profitPreview.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                    {profitPreview.profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                    {formatCurrency(profitPreview.profit)}
                                                </span>
                                            </div>
                                            {watchCost && watchCost > 0 && (
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-sm text-muted-foreground">ROI:</span>
                                                    <span className={`text-sm font-medium ${profitPreview.roi >= 0 ? "text-green-600" : "text-red-600"}`}>{profitPreview.roi.toFixed(1)}%</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

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
