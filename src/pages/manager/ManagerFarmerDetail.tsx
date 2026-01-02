import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ManagerLayout } from "@/components/layout/ManagerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, MapPin, Phone, Calendar, Map, Sprout, Plus, Loader2, Edit, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LandForm } from "@/components/lands/LandForm";
import { ProductionForm } from "@/components/production/ProductionForm";
import { ConfirmManagerActionDialog } from "@/components/manager/ConfirmManagerActionDialog";
import type { Land, Production, ManagerFarmerConnection } from "@/types/database";
import type { UserProfile } from "@/types/auth";

interface FarmerDetail extends UserProfile {
    connected_since?: string;
}

export default function ManagerFarmerDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [farmer, setFarmer] = useState<FarmerDetail | null>(null);
    const [lands, setLands] = useState<Land[]>([]);
    const [productions, setProductions] = useState<Production[]>([]);

    // Form dialogs
    const [landFormOpen, setLandFormOpen] = useState(false);
    const [productionFormOpen, setProductionFormOpen] = useState(false);
    const [editingLand, setEditingLand] = useState<Land | null>(null);
    const [editingProduction, setEditingProduction] = useState<Production | null>(null);

    // Confirmation dialog
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        actionType: "add" | "edit" | "delete";
        dataType: "land" | "production";
        onConfirm: () => void;
    }>({ open: false, actionType: "add", dataType: "land", onConfirm: () => {} });
    const [confirmLoading, setConfirmLoading] = useState(false);

    useEffect(() => {
        if (id) {
            loadFarmerData();
        }
    }, [id]);

    const loadFarmerData = async () => {
        try {
            setLoading(true);

            // Get the connection to find connected_since
            const { data: connectionData, error: connectionError } = await supabase.from("manager_farmer_connections").select("responded_at").eq("farmer_id", id).eq("status", "active").maybeSingle();

            if (connectionError) throw connectionError;

            // Get farmer profile
            const { data: farmerData, error: farmerError } = await supabase.from("user_profiles").select("*").eq("id", id).single();

            if (farmerError) throw farmerError;

            // Get farmer's lands
            const { data: landsData, error: landsError } = await supabase.from("lands").select("*").eq("user_id", id).order("created_at", { ascending: false });

            if (landsError) throw landsError;

            // Get farmer's productions with land info
            const { data: productionsData, error: productionsError } = await supabase.from("productions").select("*, land:lands(*)").eq("user_id", id).order("created_at", { ascending: false });

            if (productionsError) throw productionsError;

            setFarmer({
                ...(farmerData as UserProfile),
                connected_since: connectionData?.responded_at || undefined,
            });
            setLands((landsData as Land[]) || []);
            setProductions((productionsData as Production[]) || []);
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

    const handleAddLand = () => {
        setEditingLand(null);
        setLandFormOpen(true);
    };

    const handleEditLand = (land: Land) => {
        setEditingLand(land);
        setLandFormOpen(true);
    };

    const handleAddProduction = () => {
        setEditingProduction(null);
        setProductionFormOpen(true);
    };

    const handleEditProduction = (production: Production) => {
        setEditingProduction(production);
        setProductionFormOpen(true);
    };

    const handleLandFormSuccess = () => {
        loadFarmerData();
        setLandFormOpen(false);
        setEditingLand(null);
    };

    const handleProductionFormSuccess = () => {
        loadFarmerData();
        setProductionFormOpen(false);
        setEditingProduction(null);
    };

    if (loading) {
        return (
            <ManagerLayout title="Loading..." description="">
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </ManagerLayout>
        );
    }

    if (!farmer) {
        return (
            <ManagerLayout title="Petani tidak ditemukan" description="">
                <div className="text-center py-24">
                    <p className="text-muted-foreground mb-4">Data petani tidak dapat ditemukan</p>
                    <Button onClick={() => navigate("/manager/farmers")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                </div>
            </ManagerLayout>
        );
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            active: "default",
            vacant: "secondary",
            archived: "outline",
            planted: "secondary",
            growing: "default",
            harvested: "outline",
        };
        return variants[status] || "default";
    };

    const activeProductions = productions.filter((p) => p.status !== "harvested");
    const harvestedProductions = productions.filter((p) => p.status === "harvested");

    const formatAuditInfo = (createdBy: string | null, updatedBy: string | null) => {
        if (createdBy && createdBy !== farmer.id) {
            return (
                <Badge variant="outline" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    Manager
                </Badge>
            );
        }
        return null;
    };

    return (
        <ManagerLayout title={farmer.full_name} description="Detail dan kelola data petani">
            <div className="space-y-6">
                {/* Back button */}
                <Button variant="ghost" size="sm" onClick={() => navigate("/manager/farmers")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Daftar
                </Button>

                {/* Farmer Info Card */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl">{farmer.full_name}</CardTitle>
                                <CardDescription className="flex items-center gap-4 mt-2">
                                    <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {farmer.phone || "-"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {farmer.district_name || "-"}, {farmer.regency_name || "-"}
                                    </span>
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-blue-600">
                                    Terhubung
                                </Badge>
                                {farmer.connected_since && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Sejak {new Date(farmer.connected_since).toLocaleDateString("id-ID")}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <Map className="h-5 w-5 mx-auto mb-2 text-green-600" />
                                <div className="text-2xl font-bold">{lands.length}</div>
                                <div className="text-xs text-muted-foreground">Lahan</div>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <Sprout className="h-5 w-5 mx-auto mb-2 text-amber-600" />
                                <div className="text-2xl font-bold">{activeProductions.length}</div>
                                <div className="text-xs text-muted-foreground">Produksi Aktif</div>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <div className="text-2xl font-bold">{harvestedProductions.length}</div>
                                <div className="text-xs text-muted-foreground">Total Panen</div>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <div className="text-2xl font-bold">{harvestedProductions.reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0)} kg</div>
                                <div className="text-xs text-muted-foreground">Hasil Panen</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs for Lands and Productions */}
                <Tabs defaultValue="lands" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="lands" className="flex items-center gap-2">
                            <Map className="h-4 w-4" />
                            Lahan ({lands.length})
                        </TabsTrigger>
                        <TabsTrigger value="productions" className="flex items-center gap-2">
                            <Sprout className="h-4 w-4" />
                            Produksi ({productions.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Lands Tab */}
                    <TabsContent value="lands">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Lahan</CardTitle>
                                    <CardDescription>Daftar lahan milik petani ini</CardDescription>
                                </div>
                                <Button size="sm" onClick={handleAddLand}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Tambah Lahan
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama Lahan</TableHead>
                                                <TableHead>Lokasi</TableHead>
                                                <TableHead className="text-right">Luas</TableHead>
                                                <TableHead>Komoditas</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Input Oleh</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {lands.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                        Belum ada data lahan
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                lands.map((land) => (
                                                    <TableRow key={land.id}>
                                                        <TableCell className="font-medium">{land.name}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">{land.address || "-"}</TableCell>
                                                        <TableCell className="text-right">{land.area_m2.toLocaleString("id-ID")} m²</TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1">
                                                                {land.commodities.map((c, i) => (
                                                                    <Badge key={i} variant="outline" className="text-xs">
                                                                        {c}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={getStatusBadge(land.status)}>{land.status === "active" ? "Aktif" : land.status === "vacant" ? "Kosong" : "Diarsipkan"}</Badge>
                                                        </TableCell>
                                                        <TableCell>{formatAuditInfo(land.created_by, land.updated_by)}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => handleEditLand(land)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Productions Tab */}
                    <TabsContent value="productions">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Produksi</CardTitle>
                                    <CardDescription>Riwayat produksi petani ini</CardDescription>
                                </div>
                                <Button size="sm" onClick={handleAddProduction} disabled={lands.length === 0}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Tambah Produksi
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {lands.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">Petani belum memiliki lahan. Tambahkan lahan terlebih dahulu.</div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Komoditas</TableHead>
                                                    <TableHead>Lahan</TableHead>
                                                    <TableHead>Tanggal Tanam</TableHead>
                                                    <TableHead className="text-right">Bibit</TableHead>
                                                    <TableHead>Est. Panen</TableHead>
                                                    <TableHead className="text-right">Hasil</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Input Oleh</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {productions.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                                                            Belum ada data produksi
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    productions.map((prod) => (
                                                        <TableRow key={prod.id}>
                                                            <TableCell className="font-medium">{prod.commodity}</TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">{prod.land?.name || "-"}</TableCell>
                                                            <TableCell>{new Date(prod.planting_date).toLocaleDateString("id-ID")}</TableCell>
                                                            <TableCell className="text-right">{prod.seed_count.toLocaleString("id-ID")}</TableCell>
                                                            <TableCell>{prod.estimated_harvest_date ? new Date(prod.estimated_harvest_date).toLocaleDateString("id-ID") : "-"}</TableCell>
                                                            <TableCell className="text-right font-medium">{prod.harvest_yield_kg ? `${prod.harvest_yield_kg.toLocaleString("id-ID")} kg` : "-"}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={getStatusBadge(prod.status)}>{prod.status === "planted" ? "Ditanam" : prod.status === "growing" ? "Tumbuh" : "Dipanen"}</Badge>
                                                            </TableCell>
                                                            <TableCell>{formatAuditInfo(prod.created_by, prod.updated_by)}</TableCell>
                                                            <TableCell>
                                                                <Button variant="ghost" size="icon" onClick={() => handleEditProduction(prod)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Land Form Dialog */}
            <LandForm open={landFormOpen} onOpenChange={setLandFormOpen} land={editingLand} onSuccess={handleLandFormSuccess} targetFarmerId={id} targetFarmerName={farmer.full_name} />

            {/* Production Form Dialog */}
            <ProductionForm
                open={productionFormOpen}
                onOpenChange={setProductionFormOpen}
                production={editingProduction}
                lands={lands}
                productions={productions}
                onSuccess={handleProductionFormSuccess}
                targetFarmerId={id}
                targetFarmerName={farmer.full_name}
            />

            {/* Confirmation Dialog */}
            <ConfirmManagerActionDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
                onConfirm={confirmDialog.onConfirm}
                farmerName={farmer.full_name}
                actionType={confirmDialog.actionType}
                dataType={confirmDialog.dataType}
                loading={confirmLoading}
            />
        </ManagerLayout>
    );
}
