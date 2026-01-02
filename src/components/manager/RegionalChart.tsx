import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import type { RegionalBreakdown, FarmerWithStats } from "@/types/database";
import { Loader2 } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

interface RegionalChartProps {
    data: RegionalBreakdown[];
    loading?: boolean;
}

export function RegionalChart({ data, loading }: RegionalChartProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Produksi per Wilayah</CardTitle>
                    <CardDescription>Breakdown produksi berdasarkan lokasi petani</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Produksi per Wilayah</CardTitle>
                    <CardDescription>Breakdown produksi berdasarkan lokasi petani</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Belum ada data wilayah</p>
                </CardContent>
            </Card>
        );
    }

    const chartData = data.map((item) => ({
        name: item.regency_name || item.province_name,
        petani: item.farmer_count,
        lahan: item.land_count,
        produksi: item.production_count,
        panen: item.total_yield,
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Produksi per Wilayah</CardTitle>
                <CardDescription>Breakdown produksi berdasarkan lokasi petani</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                        <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                            }}
                            formatter={(value: number, name: string) => {
                                const labels: Record<string, string> = {
                                    petani: "Petani",
                                    lahan: "Lahan",
                                    produksi: "Produksi",
                                    panen: "Panen (kg)",
                                };
                                return [value.toLocaleString("id-ID"), labels[name] || name];
                            }}
                        />
                        <Legend
                            formatter={(value) => {
                                const labels: Record<string, string> = {
                                    petani: "Petani",
                                    lahan: "Lahan",
                                    produksi: "Produksi",
                                    panen: "Panen (kg)",
                                };
                                return labels[value] || value;
                            }}
                        />
                        <Bar dataKey="petani" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="produksi" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

interface TopPerformersChartProps {
    farmers: FarmerWithStats[];
    loading?: boolean;
    limit?: number;
}

export function TopPerformersChart({ farmers, loading, limit = 5 }: TopPerformersChartProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Top Petani</CardTitle>
                    <CardDescription>Petani dengan hasil panen tertinggi</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (farmers.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Top Petani</CardTitle>
                    <CardDescription>Petani dengan hasil panen tertinggi</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Belum ada data petani</p>
                </CardContent>
            </Card>
        );
    }

    const topFarmers = [...farmers]
        .sort((a, b) => b.total_yield - a.total_yield)
        .slice(0, limit)
        .map((farmer) => ({
            name: farmer.full_name.split(" ").slice(0, 2).join(" "),
            panen: farmer.total_yield,
        }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Petani</CardTitle>
                <CardDescription>Petani dengan hasil panen tertinggi</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topFarmers} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} className="fill-muted-foreground" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`${value.toLocaleString("id-ID")} kg`, "Hasil Panen"]}
                        />
                        <Bar dataKey="panen" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

interface CommodityDistributionChartProps {
    farmers: FarmerWithStats[];
    loading?: boolean;
}

// This would need production data aggregated by commodity
// For now, showing a placeholder structure
export function CommodityDistributionChart({ loading }: CommodityDistributionChartProps) {
    // TODO: Implement actual commodity distribution from productions
    const sampleData = [
        { name: "Cabai Merah", value: 45 },
        { name: "Cabai Rawit", value: 30 },
        { name: "Tomat", value: 15 },
        { name: "Bawang", value: 10 },
    ];

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Distribusi Komoditas</CardTitle>
                    <CardDescription>Breakdown komoditas yang ditanam</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribusi Komoditas</CardTitle>
                <CardDescription>Breakdown komoditas yang ditanam</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={sampleData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {sampleData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
