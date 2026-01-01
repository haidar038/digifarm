import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ObserverLayout } from "@/components/layout/ObserverLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, User, MapPin, Phone, Map, Sprout, Calendar } from "lucide-react";
import { Land, Production } from "@/types/database";
import { formatNumber, formatCurrency } from "@/lib/analytics-utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface FarmerProfile {
    id: string;
    full_name: string;
    phone: string | null;
    province_name: string | null;
    regency_name: string | null;
    district_name: string | null;
    village_name: string | null;
    created_at: string;
}

export default function ObserverFarmerDetail() {
    const { id: farmerId } = useParams<{ id: string }>();
    const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
    const [lands, setLands] = useState<Land[]>([]);
    const [productions, setProductions] = useState<Production[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch farmer profile
                const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", farmerId).single();

                if (profile) {
                    setFarmer(profile as FarmerProfile);
                }

                // Fetch farmer's lands
                const { data: landsData } = await supabase.from("lands").select("*").eq("user_id", farmerId);

                setLands((landsData || []) as Land[]);

                // Fetch farmer's productions
                const { data: productionsData } = await supabase.from("productions").select("*, land:lands(*)").eq("user_id", farmerId).order("created_at", { ascending: false });

                setProductions((productionsData || []) as unknown as Production[]);
            } catch (error) {
                console.error("Error fetching farmer data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (farmerId) {
            fetchData();
        }
    }, [farmerId]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "planted":
                return <Badge variant="secondary">Ditanam</Badge>;
            case "growing":
                return <Badge className="bg-yellow-500">Tumbuh</Badge>;
            case "harvested":
                return <Badge className="bg-green-500">Dipanen</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <ObserverLayout title="Detail Petani">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ObserverLayout>
        );
    }

    if (!farmer) {
        return (
            <ObserverLayout title="Detail Petani">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Petani tidak ditemukan</p>
                    <Link to="/observer/farmers">
                        <Button variant="outline" className="mt-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                    </Link>
                </div>
            </ObserverLayout>
        );
    }

    const totalYield = productions.filter((p) => p.status === "harvested").reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0);
    const totalArea = lands.reduce((sum, l) => sum + l.area_m2, 0);
    const totalRevenue = productions.filter((p) => p.status === "harvested").reduce((sum, p) => sum + (p.harvest_yield_kg || 0) * (p.selling_price_per_kg || 0), 0);

    return (
        <ObserverLayout title="Detail Petani" description={farmer.full_name}>
            <div className="space-y-6">
                {/* Back Button */}
                <Link to="/observer/farmers">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Daftar
                    </Button>
                </Link>

                {/* Farmer Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Informasi Petani
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                                    <p className="font-medium">{farmer.full_name}</p>
                                </div>
                                {farmer.phone && (
                                    <div>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> Telepon
                                        </p>
                                        <p className="font-medium">{farmer.phone}</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> Lokasi
                                    </p>
                                    <p className="font-medium">{[farmer.village_name, farmer.district_name, farmer.regency_name, farmer.province_name].filter(Boolean).join(", ") || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Terdaftar Sejak
                                    </p>
                                    <p className="font-medium">{format(new Date(farmer.created_at), "dd MMMM yyyy", { locale: id })}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Jumlah Lahan</CardDescription>
                            <CardTitle className="text-2xl">{lands.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Luas</CardDescription>
                            <CardTitle className="text-2xl">{formatNumber(totalArea)} m²</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Panen</CardDescription>
                            <CardTitle className="text-2xl">{formatNumber(totalYield)} kg</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Estimasi Revenue</CardDescription>
                            <CardTitle className="text-2xl text-green-600">{formatCurrency(totalRevenue)}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Lands Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Map className="h-5 w-5" />
                            Daftar Lahan ({lands.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Lahan</TableHead>
                                        <TableHead>Luas</TableHead>
                                        <TableHead>Komoditas</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lands.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                Belum ada lahan
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        lands.map((land) => (
                                            <TableRow key={land.id}>
                                                <TableCell className="font-medium">{land.name}</TableCell>
                                                <TableCell>{formatNumber(land.area_m2)} m²</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {land.commodities.map((c) => (
                                                            <Badge key={c} variant="outline" className="text-xs">
                                                                {c}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={land.status === "active" ? "default" : "secondary"}>{land.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Productions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sprout className="h-5 w-5" />
                            Riwayat Produksi ({productions.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Komoditas</TableHead>
                                        <TableHead>Lahan</TableHead>
                                        <TableHead>Tanggal Tanam</TableHead>
                                        <TableHead>Tanggal Panen</TableHead>
                                        <TableHead className="text-right">Hasil Panen</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                Belum ada produksi
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        productions.map((prod) => (
                                            <TableRow key={prod.id}>
                                                <TableCell className="font-medium">{prod.commodity}</TableCell>
                                                <TableCell>{prod.land?.name || "-"}</TableCell>
                                                <TableCell>{format(new Date(prod.planting_date), "dd MMM yyyy", { locale: id })}</TableCell>
                                                <TableCell>{prod.harvest_date ? format(new Date(prod.harvest_date), "dd MMM yyyy", { locale: id }) : "-"}</TableCell>
                                                <TableCell className="text-right">{prod.harvest_yield_kg ? `${formatNumber(prod.harvest_yield_kg)} kg` : "-"}</TableCell>
                                                <TableCell>{getStatusBadge(prod.status)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ObserverLayout>
    );
}
