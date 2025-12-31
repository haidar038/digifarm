import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Production, COMMODITIES } from "@/types/database";
import { translateCommodity } from "@/lib/i18n";

interface ProductionChartsProps {
    productions: Production[];
}

const COLORS = [
    "hsl(0, 72%, 51%)", // Red Chili
    "hsl(20, 72%, 51%)", // Rawit Chili
    "hsl(40, 72%, 51%)", // Tomatoes
    "hsl(280, 72%, 51%)", // Shallots
    "hsl(200, 72%, 51%)", // Garlic
    "hsl(108, 45%, 52%)", // Others / Primary
];

export function ProductionCharts({ productions }: ProductionChartsProps) {
    // Bar chart data: production by period with separate bars for each commodity
    const harvestedProductions = productions.filter((p) => p.status === "harvested");

    // Get all unique commodities
    const commodities = [...new Set(harvestedProductions.map((p) => p.commodity))];

    // Create bar data with separate values for each commodity
    const barData = harvestedProductions
        .reduce((acc, p) => {
            const year = new Date(p.planting_date).getFullYear();
            const month = new Date(p.planting_date).toLocaleString("default", { month: "short" });
            const period = `${month} ${year}`;

            const existing = acc.find((d) => d.period === period);
            if (existing) {
                existing[p.commodity] = ((existing[p.commodity] as number) || 0) + (p.harvest_yield_kg || 0);
            } else {
                const newEntry: Record<string, string | number> = { period };
                commodities.forEach((c) => (newEntry[c] = 0));
                newEntry[p.commodity] = p.harvest_yield_kg || 0;
                acc.push(newEntry);
            }
            return acc;
        }, [] as Record<string, string | number>[])
        .slice(-6);

    // Pie chart data: production by commodity
    const pieData = harvestedProductions.reduce((acc, p) => {
        const existing = acc.find((d) => d.name === p.commodity);
        if (existing) {
            existing.value += p.harvest_yield_kg || 0;
        } else {
            acc.push({ name: p.commodity, value: p.harvest_yield_kg || 0 });
        }
        return acc;
    }, [] as { name: string; value: number }[]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Produksi per Periode</CardTitle>
                </CardHeader>
                <CardContent>
                    {barData.length === 0 ? (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">Belum ada data panen</div>
                    ) : (
                        <div>
                            <div className="h-[270px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                                        <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}kg`} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--popover))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "var(--radius)",
                                            }}
                                            formatter={(value: number, name: string) => [`${value.toFixed(1)} kg`, translateCommodity(name)]}
                                        />
                                        {commodities.map((commodity, index) => (
                                            <Bar key={commodity} dataKey={commodity} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} name={commodity} />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend */}
                            <div className="flex flex-wrap justify-center gap-4 mt-3 pb-2">
                                {commodities.map((commodity, index) => (
                                    <div key={commodity} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-xs text-muted-foreground">{translateCommodity(commodity)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Produksi per Komoditas</CardTitle>
                </CardHeader>
                <CardContent>
                    {pieData.length === 0 ? (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">Belum ada data panen</div>
                    ) : (
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--popover))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "var(--radius)",
                                        }}
                                        formatter={(value: number) => [`${value.toFixed(1)} kg`, "Hasil"]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
