import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { LandProductivity, formatNumber } from "@/lib/analytics-utils";
import { Map } from "lucide-react";

interface LandComparisonChartProps {
    data: LandProductivity[];
}

const COLORS = [
    "hsl(142, 76%, 36%)", // Green
    "hsl(142, 71%, 45%)",
    "hsl(142, 69%, 58%)",
    "hsl(143, 64%, 68%)",
    "hsl(144, 61%, 77%)",
    "hsl(145, 58%, 85%)",
];

export function LandComparisonChart({ data }: LandComparisonChartProps) {
    // Take top 6 lands
    const chartData = data.slice(0, 6).map((lp) => ({
        name: lp.landName.length > 15 ? lp.landName.slice(0, 15) + "..." : lp.landName,
        fullName: lp.landName,
        productivity: Math.round(lp.productivity * 100) / 100,
        totalYield: lp.totalYield,
        harvestCount: lp.harvestCount,
    }));

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Map className="w-5 h-5 text-primary" />
                        Perbandingan Produktivitas Lahan
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">Belum ada data untuk ditampilkan</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Map className="w-5 h-5 text-primary" />
                    Perbandingan Produktivitas Lahan
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} horizontal={true} vertical={false} />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v} kg/m²`} />
                            <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                                formatter={(value: number, name: string, props: any) => [`${formatNumber(value, 2)} kg/m²`, "Produktivitas"]}
                                labelFormatter={(label, payload) => {
                                    if (payload && payload[0]) {
                                        const item = payload[0].payload;
                                        return `${item.fullName} (${item.harvestCount} panen, ${formatNumber(item.totalYield)} kg total)`;
                                    }
                                    return label;
                                }}
                            />
                            <Bar dataKey="productivity" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
