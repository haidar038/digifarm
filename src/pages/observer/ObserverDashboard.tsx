import { useEffect, useState } from "react";
import { ObserverLayout } from "@/components/layout/ObserverLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Map, Sprout, TrendingUp, BarChart3 } from "lucide-react";
import { Production, Land } from "@/types/database";
import { getAnalyticsSummary, getCommodityStats, formatNumber, formatCurrency } from "@/lib/analytics-utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface SystemStats {
    totalFarmers: number;
    totalLands: number;
    totalArea: number;
    totalProductions: number;
    totalHarvested: number;
    totalYield: number;
    totalRevenue: number;
}

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#ec4899"];

export default function ObserverDashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [productions, setProductions] = useState<Production[]>([]);
    const [lands, setLands] = useState<Land[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch farmer count
            const { data: farmers } = await supabase.from("user_profiles").select("id").eq("role", "farmer");

            // Fetch all lands
            const { data: landsData } = await supabase.from("lands").select("*");

            // Fetch all productions
            const { data: productionsData } = await supabase.from("productions").select("*, land:lands(*)");

            const typedLands = (landsData || []) as Land[];
            const typedProductions = (productionsData || []) as unknown as Production[];

            setLands(typedLands);
            setProductions(typedProductions);

            const totalArea = typedLands.reduce((sum, l) => sum + l.area_m2, 0);
            const totalYield = typedProductions.filter((p) => p.status === "harvested").reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0);
            const totalRevenue = typedProductions
                .filter((p) => p.status === "harvested")
                .reduce((sum, p) => {
                    const yield_kg = p.harvest_yield_kg || 0;
                    const price = p.selling_price_per_kg || 0;
                    return sum + yield_kg * price;
                }, 0);

            setStats({
                totalFarmers: farmers?.length || 0,
                totalLands: typedLands.length,
                totalArea,
                totalProductions: typedProductions.length,
                totalHarvested: typedProductions.filter((p) => p.status === "harvested").length,
                totalYield,
                totalRevenue,
            });
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ObserverLayout title="Dashboard Observer">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ObserverLayout>
        );
    }

    const commodityStats = getCommodityStats(productions);
    const pieData = commodityStats.map((c) => ({
        name: c.commodity,
        value: c.totalYield,
    }));

    return (
        <ObserverLayout title="Dashboard Observer" description="Ringkasan data sistem RINDANG">
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Petani</CardTitle>
                            <Users className="h-5 w-5 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalFarmers || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Petani terdaftar</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Lahan</CardTitle>
                            <Map className="h-5 w-5 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalLands || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">{formatNumber(stats?.totalArea || 0)} m² total area</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Produksi</CardTitle>
                            <Sprout className="h-5 w-5 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalProductions || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stats?.totalHarvested || 0} sudah dipanen</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Hasil Panen</CardTitle>
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(stats?.totalYield || 0)} kg</div>
                            <p className="text-xs text-muted-foreground mt-1">Est. {formatCurrency(stats?.totalRevenue || 0)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Commodity Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Distribusi Komoditas
                            </CardTitle>
                            <CardDescription>Berdasarkan hasil panen (kg)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={80} fill="#8884d8" dataKey="value">
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `${formatNumber(value)} kg`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Commodities Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Performa Komoditas
                            </CardTitle>
                            <CardDescription>Berdasarkan profit</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={commodityStats.slice(0, 5)} layout="vertical">
                                        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                                        <YAxis type="category" dataKey="commodity" width={80} />
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Bar dataKey="profit" fill="#10b981" name="Profit" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Observer Panel</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                        <p>Selamat datang di Observer Panel RINDANG. Sebagai observer, Anda dapat:</p>
                        <ul>
                            <li>
                                <strong>Dashboard</strong> - Melihat ringkasan statistik seluruh sistem
                            </li>
                            <li>
                                <strong>Data Petani</strong> - Melihat daftar dan performa semua petani
                            </li>
                            <li>
                                <strong>Ekspor Data</strong> - Mengunduh laporan dalam format PDF atau Excel
                            </li>
                        </ul>
                        <p className="text-muted-foreground">
                            <em>Panel ini bersifat read-only. Anda tidak dapat mengubah data apapun.</em>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </ObserverLayout>
    );
}
