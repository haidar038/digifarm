import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CommodityStats, formatCurrency, formatNumber } from "@/lib/analytics-utils";
import { translateCommodity } from "@/lib/i18n";
import { DollarSign } from "lucide-react";

interface CostRevenueChartProps {
    data: CommodityStats[];
}

export function CostRevenueChart({ data }: CostRevenueChartProps) {
    const chartData = data
        .filter((cs) => cs.totalRevenue > 0 || cs.totalCost > 0)
        .slice(0, 6)
        .map((cs) => ({
            name: translateCommodity(cs.commodity),
            commodity: cs.commodity,
            revenue: cs.totalRevenue,
            cost: cs.totalCost,
            profit: cs.profit,
        }));

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <DollarSign className="w-5 h-5 text-primary" />
                        Analisis Biaya vs Pendapatan
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <p>Belum ada data biaya atau pendapatan</p>
                            <p className="text-sm mt-1">Tambahkan total biaya dan harga jual pada data produksi</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Analisis Biaya vs Pendapatan
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickFormatter={(v) => {
                                    if (v >= 1000000) return `${(v / 1000000).toFixed(0)}jt`;
                                    if (v >= 1000) return `${(v / 1000).toFixed(0)}rb`;
                                    return v.toString();
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                                formatter={(value: number, name: string) => [formatCurrency(value), name === "revenue" ? "Pendapatan" : name === "cost" ? "Biaya" : "Profit"]}
                                labelFormatter={(label, payload) => {
                                    if (payload && payload[0]) {
                                        const profit = payload[0].payload.profit;
                                        return `${label} (Profit: ${formatCurrency(profit)})`;
                                    }
                                    return label;
                                }}
                            />
                            <Legend formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value === "revenue" ? "Pendapatan" : "Biaya"}</span>} />
                            <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="revenue" />
                            <Bar dataKey="cost" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="cost" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
