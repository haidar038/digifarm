import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsSummary, formatCurrency, formatNumber } from "@/lib/analytics-utils";
import { translateCommodity } from "@/lib/i18n";
import { TrendingUp, DollarSign, BarChart3, Award, Sprout } from "lucide-react";

interface AnalyticsMetricsProps {
    summary: AnalyticsSummary;
}

export function AnalyticsMetrics({ summary }: AnalyticsMetricsProps) {
    const metrics = [
        {
            title: "Total Pendapatan",
            value: formatCurrency(summary.totalRevenue),
            subtitle: summary.totalRevenue > 0 ? `Profit: ${formatCurrency(summary.totalProfit)}` : "Belum ada data penjualan",
            icon: DollarSign,
            color: "text-green-600",
        },
        {
            title: "Total Panen",
            value: `${formatNumber(summary.totalYield)} kg`,
            subtitle: `${summary.harvestCount} kali panen`,
            icon: BarChart3,
            color: "text-blue-600",
        },
        {
            title: "Produktivitas Rata-rata",
            value: `${formatNumber(summary.avgProductivity, 2)} kg/m²`,
            subtitle: summary.bestLand ? `Terbaik: ${summary.bestLand.landName}` : "Belum ada data",
            icon: TrendingUp,
            color: "text-purple-600",
        },
        {
            title: "Komoditas Terbaik",
            value: summary.mostProfitableCommodity ? translateCommodity(summary.mostProfitableCommodity.commodity) : "-",
            subtitle: summary.mostProfitableCommodity ? `Profit: ${formatCurrency(summary.mostProfitableCommodity.profit)}` : "Belum ada data",
            icon: Award,
            color: "text-amber-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                        <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
