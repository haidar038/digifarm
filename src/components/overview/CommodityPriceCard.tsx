import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useCommodityPrices } from "@/hooks/useCommodityPrices";
import { TrendingUp, TrendingDown, Minus, Tags, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ID for Cabai Merah Besar
const CABAI_MERAH_BESAR_ID = "7_13";

/**
 * CommodityPriceCard - A clickable stat card showing Cabai Merah Besar price
 * Clicking the card navigates to the full commodity prices page
 */
export function CommodityPriceCard() {
    const { data: prices, isLoading, isError } = useCommodityPrices();

    // Find Cabai Merah Besar from prices
    const cabaiMerahBesar = prices?.find((p) => p.commodityId === CABAI_MERAH_BESAR_ID);

    // Loading state
    if (isLoading) {
        return (
            <Link to="/commodity-prices">
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-slide-up cursor-pointer h-full">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Harga Komoditas</p>
                                <div className="flex items-center h-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Tags className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-auto pt-2">
                            <span className="text-xs text-muted-foreground">Memuat data...</span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        );
    }

    // Error state or no data
    if (isError || !cabaiMerahBesar) {
        return (
            <Link to="/commodity-prices">
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-slide-up cursor-pointer h-full">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Harga Komoditas</p>
                                <p className="text-3xl font-bold text-foreground tracking-tight">-</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Tags className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-auto pt-2">
                            <span className="text-xs text-muted-foreground">Data tidak tersedia</span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        );
    }

    // Trend icon and color
    const TrendIcon = cabaiMerahBesar.trend === "up" ? TrendingUp : cabaiMerahBesar.trend === "down" ? TrendingDown : Minus;
    const trendColor = cabaiMerahBesar.trend === "up" ? "text-red-500" : cabaiMerahBesar.trend === "down" ? "text-green-500" : "text-muted-foreground";

    return (
        <Link to="/commodity-prices">
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-slide-up cursor-pointer h-full">
                <CardContent className="p-6 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Harga Komoditas</p>
                            <p className="text-3xl font-bold text-foreground tracking-tight">{cabaiMerahBesar.currentPrice?.priceFormatted ?? "-"}</p>

                            {/* Trend indicator */}
                            <div className={cn("flex items-center gap-1 mt-2 text-sm font-medium", trendColor)}>
                                <TrendIcon className="w-4 h-4" />
                                <span>
                                    {cabaiMerahBesar.priceChangePercent > 0 ? "+" : ""}
                                    {cabaiMerahBesar.priceChangePercent.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Tags className="w-6 h-6 text-primary" />
                        </div>
                    </div>

                    {/* Subtitle: commodity name - pushed to bottom */}
                    <div className="flex items-center gap-2 mt-auto pt-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cabaiMerahBesar.color }} />
                        <span className="text-sm font-semibold text-secondary-foreground">{cabaiMerahBesar.commodityName}</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
