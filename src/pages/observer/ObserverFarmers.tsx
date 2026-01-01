import { useEffect, useState } from "react";
import { ObserverLayout } from "@/components/layout/ObserverLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Users, MapPin, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { formatNumber } from "@/lib/analytics-utils";

interface FarmerData {
    id: string;
    full_name: string;
    phone: string | null;
    province_name: string | null;
    regency_name: string | null;
    landCount: number;
    productionCount: number;
    totalYield: number;
    productivity: number;
}

export default function ObserverFarmers() {
    const [farmers, setFarmers] = useState<FarmerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [regionFilter, setRegionFilter] = useState<string>("all");
    const [regions, setRegions] = useState<string[]>([]);

    useEffect(() => {
        fetchFarmers();
    }, []);

    const fetchFarmers = async () => {
        try {
            // Fetch all farmers
            const { data: farmerProfiles } = await supabase.from("user_profiles").select("*").eq("role", "farmer");

            if (!farmerProfiles) {
                setFarmers([]);
                return;
            }

            // Fetch lands and productions for each farmer
            const { data: lands } = await supabase.from("lands").select("*");
            const { data: productions } = await supabase.from("productions").select("*");

            // Build farmer data with stats
            const farmerData: FarmerData[] = farmerProfiles.map((profile) => {
                const farmerLands = lands?.filter((l) => l.user_id === profile.id) || [];
                const farmerProductions = productions?.filter((p) => p.user_id === profile.id) || [];
                const harvestedProductions = farmerProductions.filter((p) => p.status === "harvested");

                const totalYield = harvestedProductions.reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0);
                const totalArea = farmerLands.reduce((sum, l) => sum + l.area_m2, 0);
                const productivity = totalArea > 0 ? totalYield / totalArea : 0;

                return {
                    id: profile.id,
                    full_name: profile.full_name,
                    phone: profile.phone,
                    province_name: profile.province_name,
                    regency_name: profile.regency_name,
                    landCount: farmerLands.length,
                    productionCount: farmerProductions.length,
                    totalYield,
                    productivity,
                };
            });

            setFarmers(farmerData);

            // Extract unique regions
            const uniqueRegions = [...new Set(farmerProfiles.map((p) => p.province_name).filter(Boolean))] as string[];
            setRegions(uniqueRegions);
        } catch (error) {
            console.error("Error fetching farmers:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredFarmers = farmers.filter((farmer) => {
        const matchesSearch = farmer.full_name.toLowerCase().includes(search.toLowerCase()) || (farmer.phone && farmer.phone.includes(search));
        const matchesRegion = regionFilter === "all" || farmer.province_name === regionFilter;
        return matchesSearch && matchesRegion;
    });

    // Sort by total yield descending
    const sortedFarmers = [...filteredFarmers].sort((a, b) => b.totalYield - a.totalYield);

    return (
        <ObserverLayout title="Data Petani" description="Daftar dan performa semua petani">
            <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Petani</CardDescription>
                            <CardTitle className="text-3xl">{farmers.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Lahan</CardDescription>
                            <CardTitle className="text-3xl text-green-600">{farmers.reduce((sum, f) => sum + f.landCount, 0)}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Hasil Panen</CardDescription>
                            <CardTitle className="text-3xl text-purple-600">{formatNumber(farmers.reduce((sum, f) => sum + f.totalYield, 0))} kg</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Farmers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Daftar Petani
                        </CardTitle>
                        <CardDescription>
                            {filteredFarmers.length} dari {farmers.length} petani
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Cari nama atau telepon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                            </div>
                            <Select value={regionFilter} onValueChange={setRegionFilter}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filter Wilayah" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Wilayah</SelectItem>
                                    {regions.map((region) => (
                                        <SelectItem key={region} value={region}>
                                            {region}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Petani</TableHead>
                                            <TableHead>Lokasi</TableHead>
                                            <TableHead className="text-center">Lahan</TableHead>
                                            <TableHead className="text-center">Produksi</TableHead>
                                            <TableHead className="text-right">Total Panen</TableHead>
                                            <TableHead className="text-right">Produktivitas</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedFarmers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    Tidak ada data petani
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            sortedFarmers.map((farmer, index) => (
                                                <TableRow key={farmer.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {index < 3 && (
                                                                <Badge variant={index === 0 ? "default" : "secondary"} className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                                                                    {index + 1}
                                                                </Badge>
                                                            )}
                                                            <div>
                                                                <p className="font-medium">{farmer.full_name}</p>
                                                                {farmer.phone && <p className="text-xs text-muted-foreground">{farmer.phone}</p>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {farmer.province_name || farmer.regency_name ? (
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <MapPin className="h-3 w-3" />
                                                                {farmer.regency_name || farmer.province_name}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">{farmer.landCount}</TableCell>
                                                    <TableCell className="text-center">{farmer.productionCount}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatNumber(farmer.totalYield)} kg</TableCell>
                                                    <TableCell className="text-right">{formatNumber(farmer.productivity, 2)} kg/m²</TableCell>
                                                    <TableCell>
                                                        <Link to={`/observer/farmers/${farmer.id}`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                                                            Detail
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Link>
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
            </div>
        </ObserverLayout>
    );
}
