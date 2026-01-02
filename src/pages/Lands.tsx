import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LandForm } from "@/components/lands/LandForm";
import { LandDetails } from "@/components/lands/LandDetails";
import { LandsTable } from "@/components/lands/LandsTable";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Land } from "@/types/database";
import { toast } from "@/hooks/use-toast";
import { useRealtimeRefresh } from "@/hooks/useRealtimeSubscription";

const LandsPage = () => {
    const [lands, setLands] = useState<Land[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editingLand, setEditingLand] = useState<Land | null>(null);
    const [deletingLand, setDeletingLand] = useState<Land | null>(null);
    const [viewingLand, setViewingLand] = useState<Land | null>(null);

    const fetchLands = useCallback(async () => {
        try {
            const { data, error } = await supabase.from("lands").select("*").order("created_at", { ascending: false });

            if (error) throw error;
            setLands(data as Land[]);
        } catch (error) {
            console.error("Error fetching lands:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLands();
    }, [fetchLands]);

    // Real-time subscription for lands table
    useRealtimeRefresh("lands", fetchLands);

    const handleEdit = (land: Land) => {
        setEditingLand(land);
        setFormOpen(true);
    };

    const handleViewDetails = (land: Land) => {
        setViewingLand(land);
    };

    const handleDelete = async () => {
        if (!deletingLand) return;

        try {
            const { error } = await supabase.from("lands").delete().eq("id", deletingLand.id);

            if (error) throw error;
            toast({ title: "Lahan berhasil dihapus" });
            fetchLands();
        } catch (error: any) {
            toast({
                title: "Gagal menghapus lahan",
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
        <DashboardLayout title="Manajemen Lahan" description="Kelola lahan pertanian Anda">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <p className="text-muted-foreground">{lands.length} lahan terdaftar</p>
                    </div>
                    <Button onClick={() => setFormOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Lahan
                    </Button>
                </div>

                <LandsTable lands={lands} loading={loading} onEdit={handleEdit} onDelete={setDeletingLand} onViewDetails={handleViewDetails} />

                <LandForm open={formOpen} onOpenChange={handleFormClose} land={editingLand} onSuccess={fetchLands} />

                <LandDetails land={viewingLand} open={!!viewingLand} onOpenChange={(open) => !open && setViewingLand(null)} onEdit={handleEdit} />

                <AlertDialog open={!!deletingLand} onOpenChange={() => setDeletingLand(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Lahan</AlertDialogTitle>
                            <AlertDialogDescription>Apakah Anda yakin ingin menghapus "{deletingLand?.name}"? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data produksi terkait.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default LandsPage;
