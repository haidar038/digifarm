import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceChangeIndicator } from "./PriceChangeIndicator";
import type { CommodityPrice } from "@/constants/commodities";

interface PriceCardProps {
    data: CommodityPrice;
    isLoading?: boolean;
}

/**
 * Card component for displaying a single commodity's price
 */
export function PriceCard({ data, isLoading }: PriceCardProps) {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-3 h-12 rounded" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Color indicator */}
                    <div className="w-2 h-full min-h-[60px] rounded-full" style={{ backgroundColor: data.color }} />

                    <div className="flex-1 min-w-0">
                        {/* Commodity name */}
                        <h3 className="font-medium text-sm text-muted-foreground truncate">{data.commodityName}</h3>

                        {/* Current price */}
                        <p className="text-2xl font-bold mt-1">{data.currentPrice?.priceFormatted ?? "-"}</p>

                        {/* Price change indicator */}
                        <div className="mt-2">
                            <PriceChangeIndicator trend={data.trend} change={data.priceChange} changePercent={data.priceChangePercent} size="sm" />
                        </div>

                        {/* Previous price */}
                        {data.previousPrice && <p className="text-xs text-muted-foreground mt-1">Kemarin: {data.previousPrice.priceFormatted}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface PriceCardGridProps {
    prices: CommodityPrice[];
    isLoading?: boolean;
}

/**
 * Grid layout for price cards
 */
export function PriceCardGrid({ prices, isLoading }: PriceCardGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <PriceCard key={i} data={{} as CommodityPrice} isLoading />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {prices.map((price) => (
                <PriceCard key={price.commodityId} data={price} />
            ))}
        </div>
    );
}
