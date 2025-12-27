import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Production } from "@/types/database";
import { cn } from "@/lib/utils";

interface CommodityCardsProps {
  productions: Production[];
}

export function CommodityCards({ productions }: CommodityCardsProps) {
  // Group productions by commodity
  const commodityStats = productions.reduce((acc, p) => {
    if (!acc[p.commodity]) {
      acc[p.commodity] = {
        commodity: p.commodity,
        currentYield: 0,
        previousYield: 0,
        count: 0,
      };
    }
    
    if (p.status === "harvested" && p.harvest_yield_kg) {
      const harvestDate = new Date(p.harvest_date!);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      if (harvestDate >= threeMonthsAgo) {
        acc[p.commodity].currentYield += p.harvest_yield_kg;
      } else {
        acc[p.commodity].previousYield += p.harvest_yield_kg;
      }
    }
    acc[p.commodity].count++;
    return acc;
  }, {} as Record<string, { commodity: string; currentYield: number; previousYield: number; count: number }>);

  const commodityList = Object.values(commodityStats);

  if (commodityList.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {commodityList.map((stat) => {
        const change = stat.previousYield > 0
          ? ((stat.currentYield - stat.previousYield) / stat.previousYield) * 100
          : stat.currentYield > 0
          ? 100
          : 0;
        
        const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral";
        const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

        return (
          <Card key={stat.commodity} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground truncate">
                    {stat.commodity}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.currentYield.toLocaleString()} kg
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.count} production{stat.count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    trend === "up" && "bg-primary/10 text-primary",
                    trend === "down" && "bg-destructive/10 text-destructive",
                    trend === "neutral" && "bg-muted text-muted-foreground"
                  )}
                >
                  <TrendIcon className="w-3 h-3" />
                  <span>{Math.abs(change).toFixed(0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
