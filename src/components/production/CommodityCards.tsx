import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { translateCommodity } from "@/lib/i18n";
import { Production } from "@/types/database";
import { cn } from "@/lib/utils";

interface CommodityCardsProps {
    productions: Production[];
}

export function CommodityCards({ productions }: CommodityCardsProps) {
    // Group productions by commodity and find latest vs previous harvest
    const commodityStats = productions.reduce(
        (acc, p) => {
            if (!acc[p.commodity]) {
                acc[p.commodity] = {
                    commodity: p.commodity,
                    totalYield: 0,
                    latestHarvest: null as { date: string; yield: number } | null,
                    previousHarvest: null as { date: string; yield: number } | null,
                    count: 0,
                    harvestedCount: 0,
                };
            }

            acc[p.commodity].count++;

            if (p.status === "harvested" && p.harvest_yield_kg && p.harvest_date) {
                acc[p.commodity].totalYield += p.harvest_yield_kg;
                acc[p.commodity].harvestedCount++;

                const harvestDate = p.harvest_date;
                const harvestYield = p.harvest_yield_kg;

                // Track the two most recent harvests
                if (!acc[p.commodity].latestHarvest || harvestDate > acc[p.commodity].latestHarvest.date) {
                    // New latest - move current latest to previous
                    acc[p.commodity].previousHarvest = acc[p.commodity].latestHarvest;
                    acc[p.commodity].latestHarvest = { date: harvestDate, yield: harvestYield };
                } else if (!acc[p.commodity].previousHarvest || harvestDate > acc[p.commodity].previousHarvest.date) {
                    // New second-latest
                    acc[p.commodity].previousHarvest = { date: harvestDate, yield: harvestYield };
                }
            }

            return acc;
        },
        {} as Record<
            string,
            {
                commodity: string;
                totalYield: number;
                latestHarvest: { date: string; yield: number } | null;
                previousHarvest: { date: string; yield: number } | null;
                count: number;
                harvestedCount: number;
            }
        >
    );

    const commodityList = Object.values(commodityStats);

    if (commodityList.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {commodityList.map((stat) => {
                // Calculate trend based on latest vs previous harvest
                let change = 0;
                let trend: "up" | "down" | "neutral" = "neutral";
                let showTrend = false;

                if (stat.latestHarvest && stat.previousHarvest) {
                    // Both harvests exist - calculate percentage change
                    change = ((stat.latestHarvest.yield - stat.previousHarvest.yield) / stat.previousHarvest.yield) * 100;
                    trend = change > 0 ? "up" : change < 0 ? "down" : "neutral";
                    showTrend = true;
                }
                // If only one harvest exists, don't show trend (nothing to compare)

                const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

                return (
                    <Card key={stat.commodity} className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground truncate">{translateCommodity(stat.commodity)}</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{stat.totalYield.toLocaleString()} kg</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stat.harvestedCount} dipanen / {stat.count} total
                                    </p>
                                </div>
                                {showTrend && (
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
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
