import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Production, COMMODITIES } from "@/types/database";

interface ProductionChartsProps {
  productions: Production[];
}

const COLORS = [
  "hsl(0, 72%, 51%)",    // Red Chili
  "hsl(20, 72%, 51%)",   // Rawit Chili
  "hsl(40, 72%, 51%)",   // Tomatoes
  "hsl(280, 72%, 51%)",  // Shallots
  "hsl(200, 72%, 51%)",  // Garlic
  "hsl(108, 45%, 52%)",  // Others / Primary
];

export function ProductionCharts({ productions }: ProductionChartsProps) {
  // Bar chart data: production by period
  const harvestedProductions = productions.filter((p) => p.status === "harvested");
  
  const barData = harvestedProductions.reduce((acc, p) => {
    const year = new Date(p.planting_date).getFullYear();
    const month = new Date(p.planting_date).toLocaleString("default", { month: "short" });
    const period = `${month} ${year}`;
    
    const existing = acc.find((d) => d.period === period);
    if (existing) {
      existing.yield += p.harvest_yield_kg || 0;
    } else {
      acc.push({ period, yield: p.harvest_yield_kg || 0 });
    }
    return acc;
  }, [] as { period: string; yield: number }[]).slice(-6);

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
          <CardTitle className="text-lg">Production by Period</CardTitle>
        </CardHeader>
        <CardContent>
          {barData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No harvest data available
            </div>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}kg`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)} kg`, "Yield"]}
                  />
                  <Bar dataKey="yield" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Production by Commodity</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No harvest data available
            </div>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
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
                    formatter={(value: number) => [`${value.toFixed(1)} kg`, "Yield"]}
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
