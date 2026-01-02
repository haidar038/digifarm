import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link2, UserPlus, Search, Loader2, Check, X, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getAllConnections, getPendingRevokeRequests, assignConnection, revokeConnection, approveConnection, rejectConnection, approveRevokeRequest, rejectRevokeRequest } from "@/lib/connection-utils";
import type { ManagerFarmerConnection, ConnectionRevokeRequest } from "@/types/database";
import type { UserProfile } from "@/types/auth";

export default function AdminConnections() {
    const [connections, setConnections] = useState<ManagerFarmerConnection[]>([]);
    const [revokeRequests, setRevokeRequests] = useState<ConnectionRevokeRequest[]>([]);
    const [managers, setManagers] = useState<UserProfile[]>([]);
    const [farmers, setFarmers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Assignment dialog
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedManager, setSelectedManager] = useState("");
    const [selectedFarmer, setSelectedFarmer] = useState("");
    const [assignNote, setAssignNote] = useState("");
    const [assigning, setAssigning] = useState(false);

    // Action dialog for approve/reject
    const [actionDialog, setActionDialog] = useState<{
        open: boolean;
        type: "approve" | "reject" | "revoke" | "approve_revoke" | "reject_revoke";
        connectionId: string;
        requestId?: string;
        targetName: string;
    }>({ open: false, type: "approve", connectionId: "", targetName: "" });
    const [actionNote, setActionNote] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [connectionsData, revokeData, usersData] = await Promise.all([getAllConnections(), getPendingRevokeRequests(), supabase.from("user_profiles").select("*").order("full_name")]);

            if (usersData.error) throw usersData.error;

            setConnections(connectionsData);
            setRevokeRequests(revokeData as ConnectionRevokeRequest[]);
            setManagers((usersData.data as UserProfile[]).filter((u) => u.role === "manager"));
            setFarmers((usersData.data as UserProfile[]).filter((u) => u.role === "farmer"));
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

    // Filter connections by search
    const filterConnections = (status: string[]) => {
        return connections.filter((c) => status.includes(c.status)).filter((c) => search === "" || c.manager?.full_name?.toLowerCase().includes(search.toLowerCase()) || c.farmer?.full_name?.toLowerCase().includes(search.toLowerCase()));
    };

    const activeConnections = filterConnections(["active"]);
    const pendingConnections = filterConnections(["pending"]);
    const historyConnections = filterConnections(["rejected", "revoked"]);

    // Get available farmers (not connected)
    const getAvailableFarmers = () => {
        const connectedFarmerIds = connections.filter((c) => c.status === "active" || c.status === "pending").map((c) => c.farmer_id);
        return farmers.filter((f) => !connectedFarmerIds.includes(f.id));
    };

    const handleAssign = async () => {
        if (!selectedManager || !selectedFarmer) {
            toast({ title: "Pilih manager dan petani", variant: "destructive" });
            return;
        }

        try {
            setAssigning(true);
            await assignConnection(selectedManager, selectedFarmer, assignNote || undefined);
            toast({ title: "Koneksi berhasil dibuat" });
            setAssignDialogOpen(false);
            setSelectedManager("");
            setSelectedFarmer("");
            setAssignNote("");
            loadData();
        } catch (error: any) {
            toast({
                title: "Gagal membuat koneksi",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setAssigning(false);
        }
    };

    const handleAction = async () => {
        try {
            setProcessing(true);
            const { type, connectionId, requestId } = actionDialog;

            switch (type) {
                case "approve":
                    await approveConnection(connectionId, actionNote || undefined);
                    toast({ title: "Permintaan koneksi disetujui" });
                    break;
                case "reject":
                    await rejectConnection(connectionId, actionNote || undefined);
                    toast({ title: "Permintaan koneksi ditolak" });
                    break;
                case "revoke":
                    await revokeConnection(connectionId);
                    toast({ title: "Koneksi berhasil dicabut" });
                    break;
                case "approve_revoke":
                    if (requestId) {
                        await approveRevokeRequest(requestId, actionNote || undefined);
                        toast({ title: "Permintaan pencabutan disetujui" });
                    }
                    break;
                case "reject_revoke":
                    if (requestId) {
                        await rejectRevokeRequest(requestId, actionNote || undefined);
                        toast({ title: "Permintaan pencabutan ditolak" });
                    }
                    break;
            }

            setActionDialog({ open: false, type: "approve", connectionId: "", targetName: "" });
            setActionNote("");
            loadData();
        } catch (error: any) {
            toast({
                title: "Gagal memproses aksi",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            active: "default",
            pending: "secondary",
            rejected: "destructive",
            revoked: "outline",
        };
        const labels: Record<string, string> = {
            active: "Aktif",
            pending: "Pending",
            rejected: "Ditolak",
            revoked: "Dicabut",
        };
        return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
    };

    const getConnectionTypeBadge = (type: string) => {
        return (
            <Badge variant="outline" className="text-xs">
                {type === "admin_assigned" ? "Admin" : "Manager"}
            </Badge>
        );
    };

    const formatDate = (date: string | null) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Stats
    const stats = {
        active: connections.filter((c) => c.status === "active").length,
        pending: connections.filter((c) => c.status === "pending").length,
        revokeRequests: revokeRequests.length,
    };

    return (
        <AdminLayout title="Manajemen Koneksi" description="Kelola koneksi antara manager dan petani">
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Koneksi Aktif</CardDescription>
                            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Pending Request</CardDescription>
                            <CardTitle className="text-3xl text-amber-600">{stats.pending}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Revoke Requests</CardDescription>
                            <CardTitle className="text-3xl text-red-600">{stats.revokeRequests}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Manager</CardDescription>
                            <CardTitle className="text-3xl text-blue-600">{managers.length}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Link2 className="h-5 w-5" />
                                Daftar Koneksi
                            </CardTitle>
                            <CardDescription>Kelola hubungan manager-petani dalam sistem</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                            <Button size="sm" onClick={() => setAssignDialogOpen(true)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign Koneksi
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Cari nama manager atau petani..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Tabs defaultValue="active" className="space-y-4">
                                <TabsList>
                                    <TabsTrigger value="active">Aktif ({activeConnections.length})</TabsTrigger>
                                    <TabsTrigger value="pending">Pending ({pendingConnections.length})</TabsTrigger>
                                    <TabsTrigger value="revoke">Revoke Requests ({revokeRequests.length})</TabsTrigger>
                                    <TabsTrigger value="history">Riwayat ({historyConnections.length})</TabsTrigger>
                                </TabsList>

                                {/* Active Connections */}
                                <TabsContent value="active">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Manager</TableHead>
                                                    <TableHead>Petani</TableHead>
                                                    <TableHead>Lokasi</TableHead>
                                                    <TableHead>Tipe</TableHead>
                                                    <TableHead>Terhubung Sejak</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {activeConnections.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                            Tidak ada koneksi aktif
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    activeConnections.map((c) => (
                                                        <TableRow key={c.id}>
                                                            <TableCell className="font-medium">{c.manager?.full_name || "-"}</TableCell>
                                                            <TableCell>{c.farmer?.full_name || "-"}</TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">{c.farmer?.regency_name || "-"}</TableCell>
                                                            <TableCell>{getConnectionTypeBadge(c.connection_type)}</TableCell>
                                                            <TableCell>{formatDate(c.responded_at)}</TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:text-destructive"
                                                                    onClick={() =>
                                                                        setActionDialog({
                                                                            open: true,
                                                                            type: "revoke",
                                                                            connectionId: c.id,
                                                                            targetName: c.farmer?.full_name || "",
                                                                        })
                                                                    }
                                                                >
                                                                    Cabut
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                {/* Pending Requests */}
                                <TabsContent value="pending">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Manager</TableHead>
                                                    <TableHead>Petani</TableHead>
                                                    <TableHead>Catatan</TableHead>
                                                    <TableHead>Tanggal Request</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingConnections.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                            Tidak ada permintaan pending
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    pendingConnections.map((c) => (
                                                        <TableRow key={c.id}>
                                                            <TableCell className="font-medium">{c.manager?.full_name || "-"}</TableCell>
                                                            <TableCell>{c.farmer?.full_name || "-"}</TableCell>
                                                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{c.request_note || "-"}</TableCell>
                                                            <TableCell>{formatDate(c.created_at)}</TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                        onClick={() =>
                                                                            setActionDialog({
                                                                                open: true,
                                                                                type: "approve",
                                                                                connectionId: c.id,
                                                                                targetName: c.farmer?.full_name || "",
                                                                            })
                                                                        }
                                                                    >
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={() =>
                                                                            setActionDialog({
                                                                                open: true,
                                                                                type: "reject",
                                                                                connectionId: c.id,
                                                                                targetName: c.farmer?.full_name || "",
                                                                            })
                                                                        }
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                {/* Revoke Requests */}
                                <TabsContent value="revoke">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Petani</TableHead>
                                                    <TableHead>Manager Saat Ini</TableHead>
                                                    <TableHead>Alasan</TableHead>
                                                    <TableHead>Tanggal Request</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {revokeRequests.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                            Tidak ada permintaan pencabutan
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    revokeRequests.map((r) => (
                                                        <TableRow key={r.id}>
                                                            <TableCell className="font-medium">{(r.connection as any)?.farmer?.full_name || "-"}</TableCell>
                                                            <TableCell>{(r.connection as any)?.manager?.full_name || "-"}</TableCell>
                                                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.reason || "-"}</TableCell>
                                                            <TableCell>{formatDate(r.created_at)}</TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                        onClick={() =>
                                                                            setActionDialog({
                                                                                open: true,
                                                                                type: "approve_revoke",
                                                                                connectionId: r.connection_id,
                                                                                requestId: r.id,
                                                                                targetName: (r.connection as any)?.farmer?.full_name || "",
                                                                            })
                                                                        }
                                                                    >
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={() =>
                                                                            setActionDialog({
                                                                                open: true,
                                                                                type: "reject_revoke",
                                                                                connectionId: r.connection_id,
                                                                                requestId: r.id,
                                                                                targetName: (r.connection as any)?.farmer?.full_name || "",
                                                                            })
                                                                        }
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                {/* History */}
                                <TabsContent value="history">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Manager</TableHead>
                                                    <TableHead>Petani</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Tipe</TableHead>
                                                    <TableHead>Tanggal</TableHead>
                                                    <TableHead>Catatan</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {historyConnections.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                            Tidak ada riwayat koneksi
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    historyConnections.map((c) => (
                                                        <TableRow key={c.id}>
                                                            <TableCell className="font-medium">{c.manager?.full_name || "-"}</TableCell>
                                                            <TableCell>{c.farmer?.full_name || "-"}</TableCell>
                                                            <TableCell>{getStatusBadge(c.status)}</TableCell>
                                                            <TableCell>{getConnectionTypeBadge(c.connection_type)}</TableCell>
                                                            <TableCell>{formatDate(c.status === "revoked" ? c.revoked_at : c.responded_at)}</TableCell>
                                                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{c.response_note || "-"}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Assign Connection Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Koneksi Baru</DialogTitle>
                        <DialogDescription>Hubungkan seorang petani dengan manager. Koneksi akan langsung aktif.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Manager</Label>
                            <Select value={selectedManager} onValueChange={setSelectedManager}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih manager..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {managers.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Petani</Label>
                            <Select value={selectedFarmer} onValueChange={setSelectedFarmer}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih petani..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAvailableFarmers().map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.full_name} {f.village_name && `(${f.village_name})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {getAvailableFarmers().length === 0 && <p className="text-xs text-muted-foreground">Semua petani sudah memiliki koneksi aktif</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Catatan (opsional)</Label>
                            <Textarea placeholder="Tambahkan catatan..." value={assignNote} onChange={(e) => setAssignNote(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleAssign} disabled={assigning || !selectedManager || !selectedFarmer}>
                            {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Action Confirmation Dialog */}
            <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog((prev) => ({ ...prev, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {actionDialog.type.includes("revoke") && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                            {actionDialog.type === "approve" && "Setujui Permintaan Koneksi"}
                            {actionDialog.type === "reject" && "Tolak Permintaan Koneksi"}
                            {actionDialog.type === "revoke" && "Cabut Koneksi"}
                            {actionDialog.type === "approve_revoke" && "Setujui Pencabutan Koneksi"}
                            {actionDialog.type === "reject_revoke" && "Tolak Pencabutan Koneksi"}
                        </DialogTitle>
                        <DialogDescription>
                            {actionDialog.type === "approve" && `Koneksi ke ${actionDialog.targetName} akan diaktifkan.`}
                            {actionDialog.type === "reject" && `Permintaan koneksi ke ${actionDialog.targetName} akan ditolak.`}
                            {actionDialog.type === "revoke" && `Koneksi dengan ${actionDialog.targetName} akan dicabut. Manager tidak dapat lagi mengelola data petani ini.`}
                            {actionDialog.type === "approve_revoke" && `Koneksi ${actionDialog.targetName} dengan manager akan dicabut.`}
                            {actionDialog.type === "reject_revoke" && `Permintaan pencabutan dari ${actionDialog.targetName} akan ditolak.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label>Catatan (opsional)</Label>
                        <Textarea placeholder="Tambahkan catatan..." value={actionNote} onChange={(e) => setActionNote(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog((prev) => ({ ...prev, open: false }))}>
                            Batal
                        </Button>
                        <Button variant={actionDialog.type.includes("reject") || actionDialog.type === "revoke" ? "destructive" : "default"} onClick={handleAction} disabled={processing}>
                            {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Konfirmasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
