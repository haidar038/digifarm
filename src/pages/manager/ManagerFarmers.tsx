import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ManagerLayout } from "@/components/layout/ManagerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, UserPlus, MapPin, Eye, Loader2, Link2, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { requestConnection } from "@/lib/connection-utils";
import { formatNumber } from "@/lib/analytics-utils";
import type { FarmerWithStats, ConnectionStatus } from "@/types/database";
import type { UserProfile } from "@/types/auth";

interface AvailableFarmer extends UserProfile {
    hasConnection: boolean;
    connectionStatus?: ConnectionStatus;
}

export default function ManagerFarmers() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [connectedFarmers, setConnectedFarmers] = useState<FarmerWithStats[]>([]);
    const [allFarmers, setAllFarmers] = useState<AvailableFarmer[]>([]);
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [selectedFarmer, setSelectedFarmer] = useState<AvailableFarmer | null>(null);
    const [requestNote, setRequestNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            loadFarmers();
        }
    }, [user]);

    const loadFarmers = async () => {
        try {
            setLoading(true);

            // Get all connections for this manager
            const { data: connections, error: connError } = await supabase
                .from("manager_farmer_connections")
                .select(
                    `
                    farmer_id,
                    status,
                    responded_at,
                    farmer:user_profiles!manager_farmer_connections_farmer_id_fkey(
                        id,
                        full_name,
                        phone,
                        province_name,
                        regency_name,
                        district_name
                    )
                `
                )
                .eq("manager_id", user?.id);

            if (connError) throw connError;

            const activeConnections = connections?.filter((c) => c.status === "active") || [];
            const pendingConnections = connections?.filter((c) => c.status === "pending") || [];
            const connectedFarmerIds = connections?.map((c) => c.farmer_id) || [];

            // Get stats for connected farmers
            const activeFarmerIds = activeConnections.map((c) => c.farmer_id);

            let farmersWithStats: FarmerWithStats[] = [];

            if (activeFarmerIds.length > 0) {
                // Get lands for connected farmers
                const { data: lands } = await supabase.from("lands").select("id, user_id, area_m2").in("user_id", activeFarmerIds);

                // Get productions for connected farmers
                const { data: productions } = await supabase.from("productions").select("id, user_id, status, harvest_yield_kg").in("user_id", activeFarmerIds);

                farmersWithStats = activeConnections.map((conn) => {
                    const farmer = conn.farmer as any;
                    const farmerLands = lands?.filter((l) => l.user_id === conn.farmer_id) || [];
                    const farmerProductions = productions?.filter((p) => p.user_id === conn.farmer_id) || [];
                    const farmerHarvested = farmerProductions.filter((p) => p.status === "harvested");

                    return {
                        id: farmer.id,
                        full_name: farmer.full_name,
                        phone: farmer.phone,
                        province_name: farmer.province_name,
                        regency_name: farmer.regency_name,
                        connection_status: "active" as ConnectionStatus,
                        connected_since: conn.responded_at,
                        land_count: farmerLands.length,
                        production_count: farmerProductions.length,
                        active_production_count: farmerProductions.filter((p) => p.status !== "harvested").length,
                        total_yield: farmerHarvested.reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0),
                        total_area_m2: farmerLands.reduce((sum, l) => sum + (l.area_m2 || 0), 0),
                    };
                });
            }

            setConnectedFarmers(farmersWithStats);

            // Get all farmers (for "Semua Petani" tab)
            const { data: allFarmersData, error: farmersError } = await supabase.from("user_profiles").select("*").eq("role", "farmer").order("full_name");

            if (farmersError) throw farmersError;

            // Map to include connection status
            const availableFarmers: AvailableFarmer[] = (allFarmersData as UserProfile[]).map((farmer) => {
                const existingConnection = connections?.find((c) => c.farmer_id === farmer.id);
                return {
                    ...farmer,
                    hasConnection: !!existingConnection,
                    connectionStatus: existingConnection?.status as ConnectionStatus | undefined,
                };
            });

            setAllFarmers(availableFarmers);
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

    const handleRequestConnection = async () => {
        if (!selectedFarmer) return;

        try {
            setSubmitting(true);
            await requestConnection(selectedFarmer.id, requestNote || undefined);

            toast({
                title: "Permintaan terkirim",
                description: `Permintaan koneksi ke ${selectedFarmer.full_name} telah dikirim`,
            });

            setRequestDialogOpen(false);
            setRequestNote("");
            setSelectedFarmer(null);
            loadFarmers();
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

    const filteredConnected = connectedFarmers.filter((f) => f.full_name.toLowerCase().includes(search.toLowerCase()) || f.regency_name?.toLowerCase().includes(search.toLowerCase()));

    const filteredAll = allFarmers.filter((f) => f.full_name.toLowerCase().includes(search.toLowerCase()) || f.regency_name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <ManagerLayout title="Petani Binaan" description="Kelola koneksi dan data petani">
            <div className="space-y-6">
                {/* Search */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Cari berdasarkan nama atau lokasi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>

                <Tabs defaultValue="connected" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="connected" className="flex items-center gap-2">
                            <Link2 className="h-4 w-4" />
                            Terhubung ({connectedFarmers.length})
                        </TabsTrigger>
                        <TabsTrigger value="all" className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Semua Petani ({allFarmers.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Connected Farmers Tab */}
                    <TabsContent value="connected">
                        <Card>
                            <CardHeader>
                                <CardTitle>Petani Terhubung</CardTitle>
                                <CardDescription>Petani yang sudah terhubung dengan Anda. Anda dapat mengelola data mereka.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : filteredConnected.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground">Belum ada petani yang terhubung</p>
                                        <p className="text-sm text-muted-foreground mt-1">Kirim permintaan koneksi ke petani di tab "Semua Petani"</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead>Lokasi</TableHead>
                                                    <TableHead className="text-center">Lahan</TableHead>
                                                    <TableHead className="text-center">Produksi</TableHead>
                                                    <TableHead className="text-right">Total Panen</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredConnected.map((farmer) => (
                                                    <TableRow key={farmer.id}>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{farmer.full_name}</span>
                                                                <span className="text-xs text-muted-foreground">Terhubung sejak {new Date(farmer.connected_since!).toLocaleDateString("id-ID")}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <MapPin className="h-3 w-3" />
                                                                {farmer.regency_name || "-"}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline">{farmer.land_count}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={farmer.active_production_count > 0 ? "default" : "secondary"}>{farmer.active_production_count} aktif</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">{formatNumber(farmer.total_yield)} kg</TableCell>
                                                        <TableCell>
                                                            <Button size="sm" onClick={() => navigate(`/manager/farmers/${farmer.id}`)}>
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                Kelola
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

                    {/* All Farmers Tab */}
                    <TabsContent value="all">
                        <Card>
                            <CardHeader>
                                <CardTitle>Semua Petani</CardTitle>
                                <CardDescription>Daftar semua petani. Kirim permintaan koneksi untuk mengelola data petani.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : filteredAll.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground">Tidak ada petani ditemukan</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead>Lokasi</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredAll.map((farmer) => (
                                                    <TableRow key={farmer.id}>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{farmer.full_name}</span>
                                                                <span className="text-xs text-muted-foreground">{farmer.phone || "-"}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <MapPin className="h-3 w-3" />
                                                                {farmer.regency_name || "-"}, {farmer.province_name || "-"}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {farmer.hasConnection ? (
                                                                <Badge variant={farmer.connectionStatus === "pending" ? "secondary" : farmer.connectionStatus === "active" ? "default" : "outline"}>
                                                                    {farmer.connectionStatus === "pending" ? "Menunggu" : farmer.connectionStatus === "active" ? "Terhubung" : farmer.connectionStatus}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline">Belum terhubung</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {!farmer.hasConnection && (
                                                                <Dialog
                                                                    open={requestDialogOpen && selectedFarmer?.id === farmer.id}
                                                                    onOpenChange={(open) => {
                                                                        setRequestDialogOpen(open);
                                                                        if (!open) setSelectedFarmer(null);
                                                                    }}
                                                                >
                                                                    <DialogTrigger asChild>
                                                                        <Button size="sm" variant="outline" onClick={() => setSelectedFarmer(farmer)}>
                                                                            <Send className="h-4 w-4 mr-1" />
                                                                            Minta Koneksi
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Permintaan Koneksi</DialogTitle>
                                                                            <DialogDescription>Kirim permintaan koneksi ke {selectedFarmer?.full_name}. Petani perlu menyetujui permintaan ini.</DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="space-y-4 py-4">
                                                                            <div className="space-y-2">
                                                                                <label className="text-sm font-medium">Catatan (opsional)</label>
                                                                                <Textarea placeholder="Tulis pesan untuk petani..." value={requestNote} onChange={(e) => setRequestNote(e.target.value)} />
                                                                            </div>
                                                                        </div>
                                                                        <DialogFooter>
                                                                            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                                                                                Batal
                                                                            </Button>
                                                                            <Button onClick={handleRequestConnection} disabled={submitting}>
                                                                                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                                                Kirim Permintaan
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            )}
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
                </Tabs>
            </div>
        </ManagerLayout>
    );
}
