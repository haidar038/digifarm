import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Production, Land, COMMODITIES } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { addDays, format } from "date-fns";

const formSchema = z.object({
  land_id: z.string().min(1, "Please select a land"),
  commodity: z.string().min(1, "Please select a commodity"),
  custom_commodity: z.string().optional(),
  planting_date: z.string().min(1, "Planting date is required"),
  seed_count: z.coerce.number().min(1, "Seed count must be greater than 0"),
  estimated_harvest_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProductionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  production?: Production | null;
  lands: Land[];
  onSuccess: () => void;
}

export function ProductionForm({
  open,
  onOpenChange,
  production,
  lands,
  onSuccess,
}: ProductionFormProps) {
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
    },
  });

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
      const commodity = data.commodity === "Others" && data.custom_commodity 
        ? data.custom_commodity 
        : data.commodity;

      const productionData = {
        land_id: data.land_id,
        commodity,
        planting_date: data.planting_date,
        seed_count: data.seed_count,
        estimated_harvest_date: data.estimated_harvest_date || null,
        notes: data.notes || null,
        status: "planted" as const,
      };

      if (production) {
        const { error } = await supabase
          .from("productions")
          .update(productionData)
          .eq("id", production.id);
        if (error) throw error;
        toast({ title: "Production updated successfully" });
      } else {
        const { error } = await supabase.from("productions").insert(productionData);
        if (error) throw error;
        toast({ title: "Production added successfully" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error saving production",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {production ? "Edit Production" : "Add New Production"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="land_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Land / Plantation *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a land" />
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
                  <FormLabel>Commodity Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select commodity" />
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
                    <FormLabel>Custom Commodity Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter commodity name" {...field} />
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
                    <FormLabel>Planting Date *</FormLabel>
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
                    <FormLabel>Number of Seeds *</FormLabel>
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
                  <FormLabel>Estimated Harvest Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {production ? "Update Production" : "Add Production"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
