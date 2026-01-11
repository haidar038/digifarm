import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Production } from "@/types/database";
import { formatMonthYear } from "@/lib/dateUtils";
import { startOfMonth, endOfMonth, isWithinInterval, addMonths } from "date-fns";
import { useMemo } from "react";
import { translateCommodity } from "@/lib/i18n";

interface ProductivityChartProps {
    productions: Production[];
}

// Colors for different commodities (vibrant, distinct colors)
const COMMODITY_COLORS: Record<string, string> = {
    // Indonesian names (current)
    "Cabai Merah": "#E53935", // Vibrant Red
    "Cabai Rawit": "#FF6F00", // Deep Orange
    Tomat: "#F4511E", // Coral Orange-Red
    "Bawang Merah": "#8E24AA", // Purple
    "Bawang Putih": "#1E88E5", // Blue
    Lainnya: "#43A047", // Green
    // English names (legacy support)
    "Red Chili": "#E53935",
    "Rawit Chili": "#FF6F00",
    Tomatoes: "#F4511E",
    Shallots: "#8E24AA",
    Garlic: "#1E88E5",
};

const DEFAULT_COLOR = "#78909C"; // Blue Grey for unknown commodities

export function ProductivityChart({ productions }: ProductivityChartProps) {
    // Get harvested productions only
    const harvestedProductions = useMemo(() => productions.filter((p) => p.status === "harvested" && p.harvest_date && p.harvest_yield_kg), [productions]);

    // Get unique commodities
    const commodities = useMemo(() => [...new Set(harvestedProductions.map((p) => p.commodity))], [harvestedProductions]);

    // Determine date range from earliest to latest harvest
    const { chartData, months } = useMemo(() => {
        if (harvestedProductions.length === 0) {
            return { chartData: [], months: [] };
        }

        // Find earliest and latest harvest dates
        const dates = harvestedProductions.map((p) => new Date(p.harvest_date!));
        const earliestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
        const latestDate = new Date(Math.max(...dates.map((d) => d.getTime())));

        // Generate months from earliest to latest
        const monthsList: Date[] = [];
        let currentMonth = startOfMonth(earliestDate);
        const endMonth = startOfMonth(latestDate);

        while (currentMonth <= endMonth) {
            monthsList.push(currentMonth);
            currentMonth = addMonths(currentMonth, 1);
        }

        // Build chart data
        const data = monthsList.map((monthDate) => {
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);
            const monthLabel = formatMonthYear(monthDate);

            const entry: Record<string, string | number> = { month: monthLabel };

            // Calculate yield for each commodity in this month
            commodities.forEach((commodity) => {
                const commodityYield = harvestedProductions
                    .filter(
                        (p) =>
                            p.commodity === commodity &&
                            isWithinInterval(new Date(p.harvest_date!), {
                                start: monthStart,
                                end: monthEnd,
                            })
                    )
                    .reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0);

                entry[commodity] = Math.round(commodityYield * 10) / 10;
            });

            return entry;
        });

        return { chartData: data, months: monthsList };
    }, [harvestedProductions, commodities]);

    if (harvestedProductions.length === 0) {
        return (
            <Card className="col-span-full">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Tren Produktivitas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">Belum ada data panen</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Tren Produktivitas per Komoditas
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}kg`} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                    boxShadow: "var(--shadow-md)",
                                }}
                                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                                formatter={(value: number, name: string) => [`${value} kg`, translateCommodity(name)]}
                            />
                            <Legend wrapperStyle={{ paddingTop: "10px" }} formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{translateCommodity(value)}</span>} />
                            {commodities.map((commodity) => (
                                <Line
                                    key={commodity}
                                    type="monotone"
                                    dataKey={commodity}
                                    stroke={COMMODITY_COLORS[commodity] || DEFAULT_COLOR}
                                    strokeWidth={2}
                                    dot={{ fill: COMMODITY_COLORS[commodity] || DEFAULT_COLOR, strokeWidth: 2, r: 3 }}
                                    activeDot={{ r: 5, stroke: COMMODITY_COLORS[commodity] || DEFAULT_COLOR, strokeWidth: 2 }}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
