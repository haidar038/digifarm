/**
 * Planning Page - Season Planting Calendar
 * Visualizes production schedules and detects conflicts
 */

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SeasonCalendar } from "@/components/planning/SeasonCalendar";
import { ConflictAlert } from "@/components/planning/ConflictAlert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Production, Land } from "@/types/database";
import { getAllConflicts } from "@/lib/conflict-utils";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/hooks/use-toast";
import { Loader2, Calendar, AlertTriangle, Sprout, Map as MapIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Planning() {
    const [productions, setProductions] = useState<Production[]>([]);
    const [lands, setLands] = useState<Land[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLand, setSelectedLand] = useState<string>("all");
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                setLoading(true);

                // Fetch lands and productions in parallel
                const [landsRes, productionsRes] = await Promise.all([
                    supabase.from("lands").select("*").eq("user_id", user.id).order("name"),
                    supabase.from("productions").select("*, land:lands(*)").eq("user_id", user.id).order("planting_date", { ascending: false }),
                ]);

                if (landsRes.error) throw landsRes.error;
                if (productionsRes.error) throw productionsRes.error;

                setLands(landsRes.data as Land[]);
                setProductions(productionsRes.data as unknown as Production[]);
            } catch (error: unknown) {
                console.error("Error fetching planning data:", error);
                toast({
                    title: "Gagal memuat data",
                    description: error instanceof Error ? error.message : "Terjadi kesalahan",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Filter productions by selected land
    const filteredProductions = useMemo(() => {
        if (selectedLand === "all") return productions;
        return productions.filter((p) => p.land_id === selectedLand);
    }, [productions, selectedLand]);

    // Get conflicts
    const conflictsMap = useMemo(() => getAllConflicts(filteredProductions), [filteredProductions]);

    // Create production names map for conflict alert
    const productionNames = useMemo(() => {
        const map = new Map<string, string>();
        productions.forEach((p) => map.set(p.id, p.commodity));
        return map;
    }, [productions]);

    // Handle production click - navigate to production page
    const handleProductionClick = (production: Production) => {
        navigate(`/production?highlight=${production.id}`);
    };

    // Stats
    const stats = useMemo(
        () => ({
            totalProductions: filteredProductions.length,
            activeProductions: filteredProductions.filter((p) => p.status !== "harvested").length,
            conflictCount: conflictsMap.size,
            landsWithProduction: new Set(filteredProductions.map((p) => p.land_id)).size,
        }),
        [filteredProductions, conflictsMap]
    );

    if (loading) {
        return (
            <DashboardLayout title="Perencanaan">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Perencanaan Musim Tanam" description="Lihat jadwal tanam dan deteksi konflik periode produksi">
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Produksi</CardTitle>
                            <Sprout className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalProductions}</div>
                            <p className="text-xs text-muted-foreground">{stats.activeProductions} aktif</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Lahan Aktif</CardTitle>
                            <MapIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.landsWithProduction}</div>
                            <p className="text-xs text-muted-foreground">dari {lands.length} lahan</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Konflik</CardTitle>
                            <AlertTriangle className={`h-4 w-4 ${stats.conflictCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${stats.conflictCount > 0 ? "text-red-500" : ""}`}>{stats.conflictCount}</div>
                            <p className="text-xs text-muted-foreground">jadwal tumpang tindih</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Filter Lahan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedLand} onValueChange={setSelectedLand}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Lahan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Lahan</SelectItem>
                                    {lands.map((land) => (
                                        <SelectItem key={land.id} value={land.id}>
                                            {land.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                </div>

                {/* Conflict Alert */}
                <ConflictAlert conflicts={conflictsMap} productionNames={productionNames} />

                {/* Season Calendar */}
                <SeasonCalendar productions={filteredProductions} lands={lands} onProductionClick={handleProductionClick} />

                {/* Empty State */}
                {productions.length === 0 && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium mb-2">Belum Ada Produksi</h3>
                                <p className="text-sm">Tambahkan produksi di halaman Produksi untuk melihatnya di kalender.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
