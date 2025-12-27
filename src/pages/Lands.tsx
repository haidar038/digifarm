import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LandForm } from "@/components/lands/LandForm";
import { LandsTable } from "@/components/lands/LandsTable";
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
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Land } from "@/types/database";
import { toast } from "@/hooks/use-toast";

const LandsPage = () => {
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLand, setEditingLand] = useState<Land | null>(null);
  const [deletingLand, setDeletingLand] = useState<Land | null>(null);

  useEffect(() => {
    fetchLands();
  }, []);

  const fetchLands = async () => {
    try {
      const { data, error } = await supabase
        .from("lands")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLands(data as Land[]);
    } catch (error) {
      console.error("Error fetching lands:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (land: Land) => {
    setEditingLand(land);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingLand) return;

    try {
      const { error } = await supabase
        .from("lands")
        .delete()
        .eq("id", deletingLand.id);

      if (error) throw error;
      toast({ title: "Land deleted successfully" });
      fetchLands();
    } catch (error: any) {
      toast({
        title: "Error deleting land",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingLand(null);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingLand(null);
  };

  return (
    <DashboardLayout
      title="Land Management"
      description="Manage your farms and agricultural lands"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-muted-foreground">
              {lands.length} {lands.length === 1 ? "land" : "lands"} registered
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Land
          </Button>
        </div>

        <LandsTable
          lands={lands}
          loading={loading}
          onEdit={handleEdit}
          onDelete={setDeletingLand}
        />

        <LandForm
          open={formOpen}
          onOpenChange={handleFormClose}
          land={editingLand}
          onSuccess={fetchLands}
        />

        <AlertDialog open={!!deletingLand} onOpenChange={() => setDeletingLand(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Land</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingLand?.name}"? This action
                cannot be undone and will also delete all associated productions.
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
      </div>
    </DashboardLayout>
  );
};

export default LandsPage;
