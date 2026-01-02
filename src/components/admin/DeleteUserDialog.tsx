import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteUserDialogProps {
    user: UserProfile | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DeleteUserDialog({ user, open, onOpenChange, onSuccess }: DeleteUserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [confirmName, setConfirmName] = useState("");

    const handleDelete = async () => {
        if (!user) return;

        // Validate confirmation
        if (confirmName !== user.full_name) {
            toast({
                title: "Konfirmasi tidak cocok",
                description: "Ketik nama pengguna dengan benar untuk melanjutkan",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            // Use supabase.functions.invoke() for proper JWT handling
            // This automatically sends the correct auth headers
            const { data, error } = await supabase.functions.invoke("delete-user", {
                body: { user_id: user.id },
            });

            if (error) {
                throw new Error(error.message || "Gagal menghapus pengguna");
            }

            toast({
                title: "Pengguna berhasil dihapus",
                description: data.message,
            });

            setConfirmName("");
            onOpenChange(false);
            onSuccess();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
            toast({
                title: "Gagal menghapus pengguna",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const isConfirmValid = confirmName === user.full_name;

    return (
        <AlertDialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) setConfirmName("");
                onOpenChange(isOpen);
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Hapus Pengguna
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p>
                            Anda akan menghapus pengguna <strong>{user.full_name}</strong> beserta <strong>semua datanya</strong>:
                        </p>
                        <ul className="list-disc list-inside text-sm space-y-1 bg-destructive/10 p-3 rounded-md">
                            <li>Semua data lahan</li>
                            <li>Semua data produksi & panen</li>
                            <li>Semua aktivitas pertanian</li>
                            <li>Koneksi manager-petani</li>
                        </ul>
                        <p className="font-semibold text-destructive">Tindakan ini tidak dapat dibatalkan!</p>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2 py-2">
                    <Label htmlFor="confirm-name">
                        Ketik <strong>"{user.full_name}"</strong> untuk mengkonfirmasi:
                    </Label>
                    <Input id="confirm-name" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder="Ketik nama pengguna..." disabled={loading} />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={loading || !isConfirmValid} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Hapus Permanen
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
