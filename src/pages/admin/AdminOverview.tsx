import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Map, Sprout, TrendingUp } from "lucide-react";

interface SystemStats {
    totalUsers: number;
    totalFarmers: number;
    totalManagers: number;
    totalAdmins: number;
    totalLands: number;
    totalProductions: number;
    totalHarvested: number;
    totalYield: number;
}

export default function AdminOverview() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch user counts by role
            const { data: userProfiles } = await supabase.from("user_profiles").select("role");

            const totalUsers = userProfiles?.length || 0;
            const totalFarmers = userProfiles?.filter((u) => u.role === "farmer").length || 0;
            const totalManagers = userProfiles?.filter((u) => u.role === "manager").length || 0;
            const totalAdmins = userProfiles?.filter((u) => u.role === "admin").length || 0;

            // Fetch land count
            const { count: landCount } = await supabase.from("lands").select("*", { count: "exact", head: true });

            // Fetch production stats
            const { data: productions } = await supabase.from("productions").select("status, harvest_yield_kg");

            const totalProductions = productions?.length || 0;
            const totalHarvested = productions?.filter((p) => p.status === "harvested").length || 0;
            const totalYield = productions?.reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0) || 0;

            setStats({
                totalUsers,
                totalFarmers,
                totalManagers,
                totalAdmins,
                totalLands: landCount || 0,
                totalProductions,
                totalHarvested,
                totalYield,
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Admin Overview">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Admin Overview" description="Ringkasan statistik sistem RINDANG">
            <div className="space-y-6">
                {/* User Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengguna</CardTitle>
                            <Users className="h-5 w-5 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats?.totalFarmers} petani, {stats?.totalManagers} manager, {stats?.totalAdmins} admin
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Lahan</CardTitle>
                            <Map className="h-5 w-5 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalLands || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Lahan terdaftar</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Produksi</CardTitle>
                            <Sprout className="h-5 w-5 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalProductions || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stats?.totalHarvested} sudah dipanen</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Hasil Panen</CardTitle>
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalYield.toLocaleString() || 0} kg</div>
                            <p className="text-xs text-muted-foreground mt-1">Seluruh sistem</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Admin Panel</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                        <p>Selamat datang di Admin Panel RINDANG. Dari sini Anda dapat:</p>
                        <ul>
                            <li>
                                <strong>Manajemen Lahan</strong> - Melihat dan mengelola lahan dari semua pengguna
                            </li>
                            <li>
                                <strong>Manajemen Pengguna</strong> - Mengelola akun pengguna dan mengatur role
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
