import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceChangeIndicator } from "./PriceChangeIndicator";
import type { CommodityPrice } from "@/constants/commodities";
import { TableIcon } from "lucide-react";

interface PriceTableProps {
    prices: CommodityPrice[];
    isLoading?: boolean;
}

/**
 * Table component for displaying commodity prices comparison
 */
export function PriceTable({ prices, isLoading }: PriceTableProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TableIcon className="w-5 h-5" />
                        Perbandingan Harga
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Get dates for headers
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const formatDate = (date: Date) =>
        date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TableIcon className="w-5 h-5" />
                    Perbandingan Harga
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Komoditas</TableHead>
                                <TableHead className="text-right">{formatDate(yesterday)}</TableHead>
                                <TableHead className="text-right">{formatDate(today)}</TableHead>
                                <TableHead className="text-right">Perubahan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {prices.map((price) => (
                                <TableRow key={price.commodityId}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: price.color }} />
                                            <span className="font-medium">{price.commodityName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">{price.previousPrice?.priceFormatted ?? "-"}</TableCell>
                                    <TableCell className="text-right font-semibold">{price.currentPrice?.priceFormatted ?? "-"}</TableCell>
                                    <TableCell className="text-right">
                                        <PriceChangeIndicator trend={price.trend} change={price.priceChange} changePercent={price.priceChangePercent} showAmount={false} size="sm" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
