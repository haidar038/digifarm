import { useState, useEffect } from "react";
import { ManagerLayout } from "@/components/layout/ManagerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Link2, Clock, CheckCircle, XCircle, Loader2, MapPin, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getMyConnections, revokeConnection } from "@/lib/connection-utils";
import type { ManagerFarmerConnection, ConnectionStatus } from "@/types/database";

export default function ManagerConnections() {
    const [loading, setLoading] = useState(true);
    const [connections, setConnections] = useState<ManagerFarmerConnection[]>([]);
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState<ManagerFarmerConnection | null>(null);
    const [revokeNote, setRevokeNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        try {
            setLoading(true);
            const data = await getMyConnections();
            setConnections(data);
        } catch (error: any) {
            toast({
                title: "Gagal memuat koneksi",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeRequest = async () => {
        if (!selectedConnection) return;

        try {
            setSubmitting(true);
            await revokeConnection(selectedConnection.id);

            toast({
                title: "Permintaan revoke terkirim",
                description: "Admin akan meninjau permintaan Anda",
            });

            setRevokeDialogOpen(false);
            setRevokeNote("");
            setSelectedConnection(null);
            loadConnections();
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

    const getStatusBadge = (status: ConnectionStatus) => {
        const config: Record<ConnectionStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ElementType }> = {
            pending: { variant: "secondary", label: "Menunggu", icon: Clock },
            active: { variant: "default", label: "Aktif", icon: CheckCircle },
            rejected: { variant: "destructive", label: "Ditolak", icon: XCircle },
            revoked: { variant: "outline", label: "Dicabut", icon: XCircle },
        };

        const { variant, label, icon: Icon } = config[status];
        return (
            <Badge variant={variant} className="flex items-center gap-1 w-fit">
                <Icon className="h-3 w-3" />
                {label}
            </Badge>
        );
    };

    const activeConnections = connections.filter((c) => c.status === "active");
    const pendingConnections = connections.filter((c) => c.status === "pending");
    const historyConnections = connections.filter((c) => c.status === "rejected" || c.status === "revoked");

    return (
        <ManagerLayout title="Koneksi" description="Kelola koneksi dengan petani binaan">
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Koneksi Aktif</CardDescription>
                            <CardTitle className="text-3xl text-green-600">{activeConnections.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Menunggu Persetujuan</CardDescription>
                            <CardTitle className="text-3xl text-amber-600">{pendingConnections.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Riwayat</CardDescription>
                            <CardTitle className="text-3xl text-muted-foreground">{historyConnections.length}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Refresh Button */}
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={loadConnections} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="active" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="active" className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Aktif ({activeConnections.length})
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Pending ({pendingConnections.length})
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <Link2 className="h-4 w-4" />
                            Riwayat ({historyConnections.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Active Tab */}
                    <TabsContent value="active">
                        <Card>
                            <CardHeader>
                                <CardTitle>Koneksi Aktif</CardTitle>
                                <CardDescription>Petani yang sudah terhubung dengan Anda</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : activeConnections.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">Belum ada koneksi aktif</div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Petani</TableHead>
                                                    <TableHead>Tipe Koneksi</TableHead>
                                                    <TableHead>Terhubung Sejak</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {activeConnections.map((conn) => (
                                                    <TableRow key={conn.id}>
                                                        <TableCell>
                                                            <div className="font-medium">{conn.farmer_id}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{conn.connection_type === "admin_assigned" ? "Ditugaskan Admin" : "Request Manager"}</Badge>
                                                        </TableCell>
                                                        <TableCell>{conn.responded_at ? new Date(conn.responded_at).toLocaleDateString("id-ID") : "-"}</TableCell>
                                                        <TableCell>{getStatusBadge(conn.status)}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => {
                                                                    setSelectedConnection(conn);
                                                                    setRevokeDialogOpen(true);
                                                                }}
                                                            >
                                                                Ajukan Revoke
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Pending Tab */}
                    <TabsContent value="pending">
                        <Card>
                            <CardHeader>
                                <CardTitle>Permintaan Pending</CardTitle>
                                <CardDescription>Permintaan koneksi yang menunggu persetujuan petani</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : pendingConnections.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">Tidak ada permintaan pending</div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Petani</TableHead>
                                                    <TableHead>Tanggal Request</TableHead>
                                                    <TableHead>Catatan</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingConnections.map((conn) => (
                                                    <TableRow key={conn.id}>
                                                        <TableCell>
                                                            <div className="font-medium">{conn.farmer_id}</div>
                                                        </TableCell>
                                                        <TableCell>{new Date(conn.created_at).toLocaleDateString("id-ID")}</TableCell>
                                                        <TableCell className="max-w-[200px] truncate">{conn.request_note || "-"}</TableCell>
                                                        <TableCell>{getStatusBadge(conn.status)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Riwayat Koneksi</CardTitle>
                                <CardDescription>Koneksi yang telah ditolak atau dicabut</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : historyConnections.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">Tidak ada riwayat koneksi</div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Petani</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Tanggal</TableHead>
                                                    <TableHead>Catatan</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {historyConnections.map((conn) => (
                                                    <TableRow key={conn.id}>
                                                        <TableCell>
                                                            <div className="font-medium">{conn.farmer_id}</div>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(conn.status)}</TableCell>
                                                        <TableCell>{new Date(conn.updated_at).toLocaleDateString("id-ID")}</TableCell>
                                                        <TableCell className="max-w-[200px] truncate">{conn.response_note || "-"}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Revoke Dialog */}
                <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ajukan Pencabutan Koneksi</DialogTitle>
                            <DialogDescription>Permintaan pencabutan akan dikirim ke Admin untuk ditinjau.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Alasan (opsional)</label>
                                <Textarea placeholder="Jelaskan alasan pencabutan koneksi..." value={revokeNote} onChange={(e) => setRevokeNote(e.target.value)} />
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
        </ManagerLayout>
    );
}
