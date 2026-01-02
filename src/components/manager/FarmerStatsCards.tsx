import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Map, Sprout, Scale, TrendingUp, Loader2 } from "lucide-react";
import type { ManagerStats } from "@/types/database";
import { formatCurrencyCompact } from "@/lib/cost-utils";

interface FarmerStatsCardsProps {
    stats: ManagerStats | null;
    loading?: boolean;
}

export function FarmerStatsCards({ stats, loading }: FarmerStatsCardsProps) {
    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-muted rounded" />
                            <div className="h-8 w-8 bg-muted rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-16 bg-muted rounded mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const statsConfig = [
        {
            title: "Petani Terhubung",
            value: stats?.connected_farmers ?? 0,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-900/30",
        },
        {
            title: "Total Lahan",
            value: stats?.total_lands ?? 0,
            suffix: stats?.total_area_m2 ? ` (${(stats.total_area_m2 / 10000).toFixed(1)} ha)` : "",
            icon: Map,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900/30",
        },
        {
            title: "Produksi Aktif",
            value: stats?.active_productions ?? 0,
            icon: Sprout,
            color: "text-amber-600",
            bgColor: "bg-amber-100 dark:bg-amber-900/30",
        },
        {
            title: "Total Panen",
            value: `${((stats?.total_yield_kg ?? 0) / 1000).toFixed(1)} ton`,
            subtitle: stats?.total_harvested ? `dari ${stats.total_harvested} produksi` : undefined,
            icon: Scale,
            color: "text-purple-600",
            bgColor: "bg-purple-100 dark:bg-purple-900/30",
        },
    ];

    // Add revenue card if available
    if (stats?.estimated_revenue) {
        statsConfig.push({
            title: "Estimasi Pendapatan",
            value: formatCurrencyCompact(stats.estimated_revenue),
            subtitle: undefined,
            icon: TrendingUp,
            color: "text-emerald-600",
            bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
        });
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {statsConfig.map((stat, index) => (
                <Card key={index} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                        <div className={`p-2 rounded-full ${stat.bgColor}`}>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stat.value}
                            {stat.suffix && <span className="text-sm font-normal text-muted-foreground">{stat.suffix}</span>}
                        </div>
                        {stat.subtitle && <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
