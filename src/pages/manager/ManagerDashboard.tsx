import { useState, useEffect } from "react";
import { ManagerLayout } from "@/components/layout/ManagerLayout";
import { FarmerStatsCards } from "@/components/manager/FarmerStatsCards";
import { FarmerTable } from "@/components/manager/FarmerTable";
import { RegionalChart, TopPerformersChart } from "@/components/manager/RegionalChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { ManagerStats, FarmerWithStats, RegionalBreakdown } from "@/types/database";

export default function ManagerDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<ManagerStats | null>(null);
    const [farmers, setFarmers] = useState<FarmerWithStats[]>([]);
    const [regionalData, setRegionalData] = useState<RegionalBreakdown[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadDashboardData();
        }
    }, [user]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Get connected farmers
            const { data: connections, error: connError } = await supabase
                .from("manager_farmer_connections")
                .select(
                    `
                    farmer_id,
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
                .eq("manager_id", user?.id)
                .eq("status", "active");

            if (connError) throw connError;

            const farmerIds = connections?.map((c) => c.farmer_id) || [];

            if (farmerIds.length === 0) {
                // No connected farmers
                setStats({
                    connected_farmers: 0,
                    total_lands: 0,
                    total_area_m2: 0,
                    active_productions: 0,
                    total_harvested: 0,
                    total_yield_kg: 0,
                    estimated_revenue: 0,
                });
                setFarmers([]);
                setRegionalData([]);
                setLoading(false);
                return;
            }

            // Get lands for connected farmers
            const { data: lands, error: landsError } = await supabase.from("lands").select("id, user_id, area_m2").in("user_id", farmerIds);

            if (landsError) throw landsError;

            // Get productions for connected farmers
            const { data: productions, error: prodError } = await supabase.from("productions").select("id, user_id, status, harvest_yield_kg, selling_price_per_kg").in("user_id", farmerIds);

            if (prodError) throw prodError;

            // Calculate stats
            const totalLands = lands?.length || 0;
            const totalArea = lands?.reduce((sum, l) => sum + (l.area_m2 || 0), 0) || 0;
            const activeProductions = productions?.filter((p) => p.status !== "harvested").length || 0;
            const harvestedProductions = productions?.filter((p) => p.status === "harvested") || [];
            const totalYield = harvestedProductions.reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0);
            const estimatedRevenue = harvestedProductions.reduce((sum, p) => sum + (p.harvest_yield_kg || 0) * (p.selling_price_per_kg || 0), 0);

            setStats({
                connected_farmers: farmerIds.length,
                total_lands: totalLands,
                total_area_m2: totalArea,
                active_productions: activeProductions,
                total_harvested: harvestedProductions.length,
                total_yield_kg: totalYield,
                estimated_revenue: estimatedRevenue,
            });

            // Build farmer list with stats
            const farmersWithStats: FarmerWithStats[] = (connections || []).map((conn) => {
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
                    connection_status: "active",
                    connected_since: conn.responded_at,
                    land_count: farmerLands.length,
                    production_count: farmerProductions.length,
                    active_production_count: farmerProductions.filter((p) => p.status !== "harvested").length,
                    total_yield: farmerHarvested.reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0),
                    total_area_m2: farmerLands.reduce((sum, l) => sum + (l.area_m2 || 0), 0),
                };
            });

            setFarmers(farmersWithStats);

            // Build regional breakdown
            const regionMap = new Map<string, RegionalBreakdown>();
            for (const farmer of farmersWithStats) {
                const key = `${farmer.province_name || "Unknown"}-${farmer.regency_name || "Unknown"}`;
                const existing = regionMap.get(key);
                if (existing) {
                    existing.farmer_count += 1;
                    existing.land_count += farmer.land_count;
                    existing.production_count += farmer.production_count;
                    existing.total_yield += farmer.total_yield;
                } else {
                    regionMap.set(key, {
                        province_name: farmer.province_name || "Unknown",
                        regency_name: farmer.regency_name || "Unknown",
                        farmer_count: 1,
                        land_count: farmer.land_count,
                        production_count: farmer.production_count,
                        total_yield: farmer.total_yield,
                    });
                }
            }
            setRegionalData(Array.from(regionMap.values()));
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

    const handleExport = () => {
        toast({
            title: "Export dimulai",
            description: "Laporan sedang disiapkan...",
        });
        // TODO: Implement PDF/Excel export
    };

    return (
        <ManagerLayout title="Manager Dashboard" description="Ringkasan data petani binaan dan produktivitas">
            <div className="space-y-6">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{stats?.connected_farmers || 0} petani terhubung</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={loadDashboardData} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button size="sm" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Laporan
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <FarmerStatsCards stats={stats} loading={loading} />

                {/* Charts Row */}
                <div className="grid gap-6 md:grid-cols-2">
                    <RegionalChart data={regionalData} loading={loading} />
                    <TopPerformersChart farmers={farmers} loading={loading} />
                </div>

                {/* Farmer Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Petani Binaan</CardTitle>
                        <CardDescription>Daftar petani yang terhubung dengan Anda</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FarmerTable farmers={farmers} loading={loading} />
                    </CardContent>
                </Card>
            </div>
        </ManagerLayout>
    );
}
