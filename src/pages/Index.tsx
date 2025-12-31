import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/overview/StatCard";
import { PlantingCalendar } from "@/components/overview/PlantingCalendar";
import { OngoingActivities } from "@/components/overview/OngoingActivities";
import { ProductivityChart } from "@/components/overview/ProductivityChart";
import { supabase } from "@/integrations/supabase/client";
import { Land, Production, Activity } from "@/types/database";
import { Map, Sprout, TrendingUp } from "lucide-react";
import { WeatherCard } from "@/components/overview/WeatherCard";

const Index = () => {
    const [lands, setLands] = useState<Land[]>([]);
    const [productions, setProductions] = useState<Production[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [landsRes, productionsRes, activitiesRes] = await Promise.all([
                supabase.from("lands").select("*"),
                supabase.from("productions").select("*, land:lands(*)"),
                supabase.from("activities").select("*, land:lands(*), production:productions(*)"),
            ]);

            if (landsRes.data) setLands(landsRes.data as Land[]);
            if (productionsRes.data) setProductions(productionsRes.data as unknown as Production[]);
            if (activitiesRes.data) setActivities(activitiesRes.data as unknown as Activity[]);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats
    const totalProductiveLand = lands.filter((l) => l.status === "active").reduce((sum, l) => sum + l.area_m2, 0);

    const totalVacantLand = lands.filter((l) => l.status === "vacant").reduce((sum, l) => sum + l.area_m2, 0);

    const activeCrops = productions.filter((p) => p.status === "planted" || p.status === "growing").length;

    const totalHarvest = productions.filter((p) => p.status === "harvested").reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0);

    if (loading) {
        return (
            <DashboardLayout title="Ringkasan" description="Selamat Datang di Dashboard RINDANG">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Ringkasan" description="Selamat Datang di Dashboard RINDANG">
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <StatCard title="Total Lahan Produktif" value={`${totalProductiveLand.toLocaleString()} m²`} subtitle="Lahan Kosong" subtitleValue={`${totalVacantLand.toLocaleString()} m²`} icon={Map} />
                    <StatCard title="Tanaman Aktif" value={activeCrops} subtitle="Siklus Saat Ini" subtitleValue={productions.length > 0 ? "Berjalan" : "Tidak Ada"} icon={Sprout} />
                    <StatCard title="Total Panen" value={`${totalHarvest.toLocaleString()} kg`} subtitle="Sepanjang Waktu" subtitleValue={`${productions.filter((p) => p.status === "harvested").length} panen`} icon={TrendingUp} />
                    <WeatherCard />
                </div>

                {/* Calendar and Activities */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PlantingCalendar productions={productions} />
                    <OngoingActivities activities={activities} />
                </div>

                {/* Productivity Chart */}
                <ProductivityChart productions={productions} />
            </div>
        </DashboardLayout>
    );
};

export default Index;
