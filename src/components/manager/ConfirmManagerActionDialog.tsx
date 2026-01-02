import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus, Edit, Trash2 } from "lucide-react";

interface ConfirmManagerActionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    farmerName: string;
    actionType: "add" | "edit" | "delete";
    dataType: "land" | "production";
    loading?: boolean;
}

export function ConfirmManagerActionDialog({ open, onOpenChange, onConfirm, farmerName, actionType, dataType, loading = false }: ConfirmManagerActionDialogProps) {
    const getIcon = () => {
        switch (actionType) {
            case "add":
                return <Plus className="h-5 w-5 text-green-600" />;
            case "edit":
                return <Edit className="h-5 w-5 text-blue-600" />;
            case "delete":
                return <Trash2 className="h-5 w-5 text-red-600" />;
        }
    };

    const getTitle = () => {
        const action = actionType === "add" ? "Tambah" : actionType === "edit" ? "Edit" : "Hapus";
        const data = dataType === "land" ? "Lahan" : "Produksi";
        return `${action} ${data} atas nama Petani`;
    };

    const getDescription = () => {
        const action = actionType === "add" ? "menambahkan" : actionType === "edit" ? "mengedit" : "menghapus";
        const data = dataType === "land" ? "data lahan" : "data produksi";
        return `Anda akan ${action} ${data} atas nama petani "${farmerName}". Perubahan ini akan tercatat dalam audit trail.`;
    };

    const getButtonText = () => {
        switch (actionType) {
            case "add":
                return "Ya, Tambahkan";
            case "edit":
                return "Ya, Perbarui";
            case "delete":
                return "Ya, Hapus";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {getIcon()}
                        {getTitle()}
                    </DialogTitle>
                    <DialogDescription className="pt-2">{getDescription()}</DialogDescription>
                </DialogHeader>

                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                        <p className="font-medium">Perhatian</p>
                        <p className="mt-1">Pastikan Anda memiliki persetujuan dari petani sebelum melakukan perubahan data mereka.</p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Batal
                    </Button>
                    <Button variant={actionType === "delete" ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>
                        {loading ? "Memproses..." : getButtonText()}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
