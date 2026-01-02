import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend } from "recharts";
import { Production } from "@/types/database";
import { calculateProfitByPeriod, getProfitSummary, formatCurrency, PeriodType } from "@/lib/profit-utils";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

interface ProfitLossTrendProps {
    productions: Production[];
}

export function ProfitLossTrend({ productions }: ProfitLossTrendProps) {
    const [periodType, setPeriodType] = useState<PeriodType>("monthly");

    const profitData = useMemo(() => calculateProfitByPeriod(productions, periodType), [productions, periodType]);

    const summary = useMemo(() => getProfitSummary(profitData), [profitData]);

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isProfit = data.profit >= 0;

            return (
                <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                    <p className="font-semibold mb-2">{label}</p>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">
                            Pendapatan: <span className="text-foreground font-medium">{formatCurrency(data.revenue)}</span>
                        </p>
                        <p className="text-muted-foreground">
                            Biaya: <span className="text-foreground font-medium">{formatCurrency(data.cost)}</span>
                        </p>
                        <p className={isProfit ? "text-green-600" : "text-red-600"}>
                            {isProfit ? "Keuntungan" : "Kerugian"}: <span className="font-semibold">{formatCurrency(Math.abs(data.profit))}</span>
                        </p>
                        <p className="text-muted-foreground text-xs">Panen: {data.harvestCount}x</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (profitData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Tren Profit/Loss
                    </CardTitle>
                    <CardDescription>Belum ada data panen dengan informasi keuangan</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <DollarSign className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">Data keuntungan/kerugian akan muncul setelah ada produksi yang dipanen dengan informasi biaya dan harga jual.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Tren Profit/Loss
                        </CardTitle>
                        <CardDescription>Analisis keuntungan dan kerugian per periode</CardDescription>
                    </div>
                    <Select value={periodType} onValueChange={(value: PeriodType) => setPeriodType(value)}>
                        <SelectTrigger className="w-[140px]">
                            <Calendar className="w-4 h-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monthly">Bulanan</SelectItem>
                            <SelectItem value="quarterly">Triwulan</SelectItem>
                            <SelectItem value="yearly">Tahunan</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Total Pendapatan</p>
                        <p className="text-lg font-semibold">{formatCurrency(summary.totalRevenue)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Total Biaya</p>
                        <p className="text-lg font-semibold">{formatCurrency(summary.totalCost)}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${summary.totalProfit >= 0 ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"}`}>
                        <p className="text-xs text-muted-foreground">Total {summary.totalProfit >= 0 ? "Keuntungan" : "Kerugian"}</p>
                        <p className={`text-lg font-semibold ${summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(Math.abs(summary.totalProfit))}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Margin Keuntungan</p>
                        <p className={`text-lg font-semibold ${summary.avgProfitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>{summary.avgProfitMargin.toFixed(1)}%</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={profitData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="period" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} interval={0} />
                            <YAxis tickFormatter={(value) => formatCurrency(value).replace("Rp", "").trim()} tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" height={36} formatter={(value) => (value === "profit" ? "Profit/Loss" : value)} />
                            <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
                            <Bar dataKey="profit" name="profit" radius={[4, 4, 0, 0]}>
                                {profitData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "#22c55e" : "#ef4444"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Period Statistics */}
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-muted-foreground">
                            Untung: <span className="font-medium text-foreground">{summary.profitPeriods} periode</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-muted-foreground">
                            Rugi: <span className="font-medium text-foreground">{summary.lossPeriods} periode</span>
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
