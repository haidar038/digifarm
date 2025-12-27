import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProductionForm } from "@/components/production/ProductionForm";
import { HarvestForm } from "@/components/production/HarvestForm";
import { ProductionsTable } from "@/components/production/ProductionsTable";
import { ProductionCharts } from "@/components/production/ProductionCharts";
import { CommodityCards } from "@/components/production/CommodityCards";
import { ImportExport } from "@/components/production/ImportExport";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Production, Land } from "@/types/database";
import { toast } from "@/hooks/use-toast";

const ProductionPage = () => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState<Production | null>(null);
  const [harvestingProduction, setHarvestingProduction] = useState<Production | null>(null);
  const [deletingProduction, setDeletingProduction] = useState<Production | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productionsRes, landsRes] = await Promise.all([
        supabase
          .from("productions")
          .select("*, land:lands(*)")
          .order("created_at", { ascending: false }),
        supabase.from("lands").select("*").eq("status", "active"),
      ]);

      if (productionsRes.data) setProductions(productionsRes.data as unknown as Production[]);
      if (landsRes.data) setLands(landsRes.data as Land[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (production: Production) => {
    setEditingProduction(production);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProduction) return;

    try {
      const { error } = await supabase
        .from("productions")
        .delete()
        .eq("id", deletingProduction.id);

      if (error) throw error;
      toast({ title: "Production deleted successfully" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting production",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingProduction(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from("productions")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      toast({ title: `${selectedIds.length} productions deleted` });
      setSelectedIds([]);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting productions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBulkDeleteOpen(false);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingProduction(null);
  };

  return (
    <DashboardLayout
      title="Production Management"
      description="Track and manage your agricultural production"
    >
      <div className="space-y-6">
        {/* Charts */}
        <ProductionCharts productions={productions} />

        {/* Commodity Cards */}
        <CommodityCards productions={productions} />

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">
              {productions.length} {productions.length === 1 ? "production" : "productions"}
            </p>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedIds.length})
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ImportExport
              productions={productions}
              lands={lands}
              onImportSuccess={fetchData}
            />
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Production
            </Button>
          </div>
        </div>

        {/* Table */}
        <ProductionsTable
          productions={productions}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          loading={loading}
          onEdit={handleEdit}
          onHarvest={setHarvestingProduction}
          onDelete={setDeletingProduction}
        />

        {/* Forms and Dialogs */}
        <ProductionForm
          open={formOpen}
          onOpenChange={handleFormClose}
          production={editingProduction}
          lands={lands}
          onSuccess={fetchData}
        />

        {harvestingProduction && (
          <HarvestForm
            open={!!harvestingProduction}
            onOpenChange={() => setHarvestingProduction(null)}
            production={harvestingProduction}
            onSuccess={fetchData}
          />
        )}

        <AlertDialog open={!!deletingProduction} onOpenChange={() => setDeletingProduction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Production</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this production record for "
                {deletingProduction?.commodity}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Selected Productions</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedIds.length} selected
                production records? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default ProductionPage;
