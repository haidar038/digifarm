import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Land } from "@/types/database";
import { Loader2, Search, Download, Map, Filter } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";

interface LandWithOwner extends Land {
    owner?: {
        id: string;
        full_name: string;
        province_name: string | null;
    };
}

export default function AdminLands() {
    const [lands, setLands] = useState<LandWithOwner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        fetchLands();
    }, []);

    const fetchLands = async () => {
        try {
            // Fetch lands first
            const { data: landsData, error: landsError } = await supabase.from("lands").select("*");

            if (landsError) throw landsError;

            // Fetch user profiles for the owners
            const userIds = [...new Set(landsData?.map((l) => l.user_id).filter(Boolean))];
            let profilesMap: Record<string, { id: string; full_name: string; province_name: string | null }> = {};

            if (userIds.length > 0) {
                const { data: profilesData } = await supabase.from("user_profiles").select("id, full_name, province_name").in("id", userIds);

                if (profilesData) {
                    profilesMap = profilesData.reduce((acc, p) => {
                        acc[p.id] = p;
                        return acc;
                    }, {} as Record<string, { id: string; full_name: string; province_name: string | null }>);
                }
            }

            // Combine lands with owner profiles
            const landsWithOwner: LandWithOwner[] =
                landsData?.map((land) => ({
                    ...land,
                    status: land.status as Land["status"],
                    owner: land.user_id ? profilesMap[land.user_id] : undefined,
                })) || [];

            setLands(landsWithOwner);
        } catch (error) {
            console.error("Error fetching lands:", error);
            toast({
                title: "Error",
                description: "Gagal memuat data lahan",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredLands = lands.filter((land) => {
        const matchesSearch = land.name.toLowerCase().includes(searchTerm.toLowerCase()) || land.owner?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || land.address?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || land.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleExport = () => {
        const exportData = filteredLands.map((land) => ({
            "Nama Lahan": land.name,
            Pemilik: land.owner?.full_name || "-",
            Lokasi: land.owner?.province_name || "-",
            "Luas (m²)": land.area_m2,
            Alamat: land.address || "-",
            Status: land.status,
            Komoditas: land.commodities?.join(", ") || "-",
            "Tanggal Dibuat": format(new Date(land.created_at), "d MMM yyyy", { locale: localeId }),
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Lahan");
        XLSX.writeFile(wb, `admin-lahan_${format(new Date(), "yyyy-MM-dd")}.xlsx`);

        toast({
            title: "Ekspor berhasil",
            description: "Data lahan telah diunduh",
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
            case "vacant":
                return <Badge variant="secondary">Kosong</Badge>;
            case "archived":
                return <Badge variant="outline">Diarsipkan</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Manajemen Lahan">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Manajemen Lahan" description="Kelola lahan dari semua pengguna">
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Lahan</CardTitle>
                            <Map className="h-5 w-5 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{lands.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Lahan Aktif</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{lands.filter((l) => l.status === "active").length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Luas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{lands.reduce((sum, l) => sum + l.area_m2, 0).toLocaleString()} m²</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4 justify-between">
                            <div className="flex flex-1 gap-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Cari lahan atau pemilik..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua</SelectItem>
                                        <SelectItem value="active">Aktif</SelectItem>
                                        <SelectItem value="vacant">Kosong</SelectItem>
                                        <SelectItem value="archived">Diarsipkan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" onClick={handleExport}>
                                <Download className="w-4 h-4 mr-2" />
                                Ekspor
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredLands.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">Tidak ada lahan yang ditemukan.</div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Lahan</TableHead>
                                            <TableHead>Pemilik</TableHead>
                                            <TableHead>Luas</TableHead>
                                            <TableHead>Komoditas</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Dibuat</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLands.map((land) => (
                                            <TableRow key={land.id}>
                                                <TableCell className="font-medium">{land.name}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{land.owner?.full_name || "-"}</div>
                                                        <div className="text-xs text-muted-foreground">{land.owner?.province_name || "-"}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{land.area_m2.toLocaleString()} m²</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {land.commodities?.slice(0, 2).map((c) => (
                                                            <Badge key={c} variant="outline" className="text-xs">
                                                                {c}
                                                            </Badge>
                                                        ))}
                                                        {land.commodities && land.commodities.length > 2 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                +{land.commodities.length - 2}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(land.status)}</TableCell>
                                                <TableCell className="text-muted-foreground">{format(new Date(land.created_at), "d MMM yyyy", { locale: localeId })}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
