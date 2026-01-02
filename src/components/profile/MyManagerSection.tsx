import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, MapPin, Link2, Clock, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getMyManager, getPendingRequests, approveConnection, rejectConnection, requestRevoke } from "@/lib/connection-utils";
import type { ManagerFarmerConnection, ConnectionStatus } from "@/types/database";

export function MyManagerSection() {
    const [loading, setLoading] = useState(true);
    const [manager, setManager] = useState<ManagerFarmerConnection | null>(null);
    const [pendingRequests, setPendingRequests] = useState<ManagerFarmerConnection[]>([]);

    // Dialog states
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ManagerFarmerConnection | null>(null);
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [managerData, requests] = await Promise.all([getMyManager(), getPendingRequests()]);
            setManager(managerData);
            setPendingRequests(requests);
        } catch (error: any) {
            toast({
                title: "Gagal memuat data",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;

        try {
            setSubmitting(true);
            await approveConnection(selectedRequest.id, note || undefined);

            toast({
                title: "Koneksi disetujui",
                description: "Manager sekarang dapat mengakses data Anda",
            });

            setApproveDialogOpen(false);
            setNote("");
            setSelectedRequest(null);
            loadData();
        } catch (error: any) {
            toast({
                title: "Gagal menyetujui",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;

        try {
            setSubmitting(true);
            await rejectConnection(selectedRequest.id, note || undefined);

            toast({
                title: "Koneksi ditolak",
                description: "Permintaan koneksi telah ditolak",
            });

            setRejectDialogOpen(false);
            setNote("");
            setSelectedRequest(null);
            loadData();
        } catch (error: any) {
            toast({
                title: "Gagal menolak",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevokeRequest = async () => {
        if (!manager) return;

        try {
            setSubmitting(true);
            await requestRevoke(manager.id, note || undefined);

            toast({
                title: "Permintaan terkirim",
                description: "Admin akan meninjau permintaan pencabutan Anda",
            });

            setRevokeDialogOpen(false);
            setNote("");
            loadData();
        } catch (error: any) {
            toast({
                title: "Gagal mengirim permintaan",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Manager Saya
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <Clock className="h-5 w-5" />
                            Permintaan Koneksi Pending
                        </CardTitle>
                        <CardDescription>Ada manager yang ingin terhubung dengan Anda</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-4 rounded-lg bg-background border">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <User className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{request.manager?.full_name || request.manager_id}</p>
                                        {request.manager?.phone && (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {request.manager.phone}
                                            </p>
                                        )}
                                        {request.request_note && <p className="text-sm text-muted-foreground mt-1 italic">"{request.request_note}"</p>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => {
                                            setSelectedRequest(request);
                                            setRejectDialogOpen(true);
                                        }}
                                    >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Tolak
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setSelectedRequest(request);
                                            setApproveDialogOpen(true);
                                        }}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Setujui
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Current Manager */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Manager Saya
                    </CardTitle>
                    <CardDescription>Manager yang terhubung dapat membantu mengelola data produksi Anda</CardDescription>
                </CardHeader>
                <CardContent>
                    {manager ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <User className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">{manager.manager?.full_name || manager.manager_id}</p>
                                        {manager.manager?.phone && (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {manager.manager.phone}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="default" className="bg-green-600">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Terhubung
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">Sejak {new Date(manager.responded_at || manager.created_at).toLocaleDateString("id-ID")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button variant="outline" size="sm" className="text-destructive" onClick={() => setRevokeDialogOpen(true)}>
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Ajukan Pencabutan Koneksi
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                <User className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">Anda belum terhubung dengan manager manapun</p>
                            <p className="text-sm text-muted-foreground mt-1">Manager atau Admin dapat mengirim permintaan koneksi kepada Anda</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Setujui Koneksi</DialogTitle>
                        <DialogDescription>Manager akan dapat melihat dan mengelola data produksi Anda.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Catatan (opsional)</label>
                            <Textarea placeholder="Tulis catatan untuk manager..." value={note} onChange={(e) => setNote(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleApprove} disabled={submitting}>
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Setujui Koneksi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Koneksi</DialogTitle>
                        <DialogDescription>Anda yakin ingin menolak permintaan koneksi ini?</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Alasan (opsional)</label>
                            <Textarea placeholder="Tulis alasan penolakan..." value={note} onChange={(e) => setNote(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={submitting}>
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Tolak Koneksi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke Request Dialog */}
            <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajukan Pencabutan Koneksi</DialogTitle>
                        <DialogDescription>Permintaan pencabutan akan dikirim ke Admin untuk ditinjau. Selama menunggu, manager masih dapat mengakses data Anda.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Alasan pencabutan</label>
                            <Textarea placeholder="Jelaskan alasan Anda ingin mencabut koneksi..." value={note} onChange={(e) => setNote(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleRevokeRequest} disabled={submitting}>
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Ajukan Pencabutan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
