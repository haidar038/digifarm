import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { COMMODITY_API_CONFIG } from "@/constants/commodities";
import type { CommodityTrendData } from "@/constants/commodities";
import { TrendingUp } from "lucide-react";

interface PriceTrendChartProps {
    trendData: CommodityTrendData[];
    isLoading?: boolean;
}

/**
 * Line chart component for displaying 5-day price trend
 */
export function PriceTrendChart({ trendData, isLoading }: PriceTrendChartProps) {
    // Transform data for Recharts
    const chartData = useMemo(() => {
        if (!trendData.length) return [];

        // Get all unique dates
        const dates = trendData[0]?.prices.map((p) => p.dateDisplay) ?? [];

        return dates.map((date, index) => {
            const dataPoint: Record<string, string | number> = { date };

            trendData.forEach((commodity) => {
                const price = commodity.prices[index]?.price ?? 0;
                dataPoint[commodity.commodityName] = price;
            });

            return dataPoint;
        });
    }, [trendData]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5" />
                        Trend Harga 5 Hari Terakhir
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!chartData.length) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5" />
                        Trend Harga 5 Hari Terakhir
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">Tidak ada data trend tersedia</div>
                </CardContent>
            </Card>
        );
    }

    // Custom tooltip formatter
    const formatTooltipValue = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Custom Y-axis formatter
    const formatYAxis = (value: number) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}k`;
        }
        return value.toString();
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5" />
                    Trend Harga {COMMODITY_API_CONFIG.TREND_DAYS} Hari Terakhir
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                            <YAxis domain={[COMMODITY_API_CONFIG.CHART_MIN_PRICE, COMMODITY_API_CONFIG.CHART_MAX_PRICE]} tickFormatter={formatYAxis} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                            <Tooltip
                                formatter={(value: number) => [formatTooltipValue(value), ""]}
                                labelStyle={{ color: "var(--foreground)" }}
                                contentStyle={{
                                    backgroundColor: "var(--background)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "8px",
                                }}
                            />
                            <Legend />
                            {trendData.map((commodity) => (
                                <Line key={commodity.commodityId} type="monotone" dataKey={commodity.commodityName} stroke={commodity.color} strokeWidth={2} dot={{ fill: commodity.color, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
