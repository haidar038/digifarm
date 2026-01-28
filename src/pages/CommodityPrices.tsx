import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PriceCardGrid, PriceTable, PriceTrendChart, CommodityFilter } from "@/components/commodity";
import { useCommodityData } from "@/hooks/useCommodityPrices";
import { COMMODITY_API_CONFIG, ALL_COMMODITIES, DEFAULT_SELECTED_COMMODITIES, type CommodityFilter as FilterType } from "@/constants/commodities";
import { RefreshCw, TrendingUp, MapPin, Calendar, Info, AlertCircle } from "lucide-react";

export default function CommodityPrices() {
    // Filter state
    const [filter, setFilter] = useState<FilterType>({
        categoryKey: "all",
        commodityIds: DEFAULT_SELECTED_COMMODITIES,
    });

    // Fetch commodity data
    const { prices, trend, isLoading, isError, error, refetch } = useCommodityData(filter.commodityIds);

    // Filter prices based on selected commodities
    const filteredPrices = prices.filter((p) => filter.commodityIds.includes(p.commodityId));

    // Get last update time
    const lastUpdate = new Date().toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <>
            <SEO
                title="Harga Komoditas"
                description={`Informasi harga eceran komoditas pertanian harian di ${COMMODITY_API_CONFIG.LOCATION_NAME}. Pantau trend harga cabai dan komoditas lainnya.`}
                keywords="harga komoditas, harga cabai, harga pertanian, harga pasar, harga hari ini"
                url="/harga-komoditas"
            />
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />

                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <TrendingUp className="w-6 h-6 text-primary" />
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold">Harga Komoditas</h1>
                                </div>
                                <p className="text-muted-foreground">Informasi harga eceran komoditas pertanian harian</p>

                                {/* Location & Update Info */}
                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                    <Badge variant="secondary" className="gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {COMMODITY_API_CONFIG.LOCATION_NAME}
                                    </Badge>
                                    <Badge variant="outline" className="gap-1 bg-white">
                                        <Calendar className="w-3 h-3" />
                                        Update: {lastUpdate}
                                    </Badge>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <CommodityFilter filter={filter} onChange={setFilter} />
                                <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                                </Button>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {isError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Gagal memuat data harga. Menggunakan data simulasi.
                                    {error instanceof Error && `: ${error.message}`}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Info Alert */}
                        <Alert className="bg-white">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Data harga bersumber dari <strong>Bank Indonesia - PIHPS</strong> (Pusat Informasi Harga Pangan Antar Daerah). Harga dapat berubah setiap hari dan merupakan harga eceran di wilayah{" "}
                                {COMMODITY_API_CONFIG.LOCATION_NAME}.
                            </AlertDescription>
                        </Alert>

                        {/* Price Cards Grid */}
                        <section>
                            <h2 className="text-lg font-semibold mb-4">Harga Hari Ini</h2>
                            <PriceCardGrid prices={filteredPrices} isLoading={isLoading} />
                        </section>

                        {/* Charts and Table Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Trend Chart */}
                            <PriceTrendChart trendData={trend} isLoading={isLoading} />

                            {/* Price Comparison Table */}
                            <PriceTable prices={filteredPrices} isLoading={isLoading} />
                        </div>

                        {/* Additional Info */}
                        <Card className="bg-white">
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-400">
                                    <Info className="w-4 h-4" />
                                    Tentang Data Harga
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                    <div>
                                        <h4 className="font-medium text-foreground mb-1">Sumber Data</h4>
                                        <p>Data diambil dari Bank Indonesia - Pusat Informasi Harga Pangan Antar Daerah (PIHPS) yang menyediakan informasi harga komoditas strategis secara nasional.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-foreground mb-1">Frekuensi Update</h4>
                                        <p>Data harga diperbarui setiap hari kerja. Harga yang ditampilkan adalah harga eceran rata-rata di pasar tradisional wilayah {COMMODITY_API_CONFIG.LOCATION_NAME}.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-foreground mb-1">Komoditas Dipantau</h4>
                                        <ul className="list-disc list-inside">
                                            {ALL_COMMODITIES.map((c) => (
                                                <li key={c.id}>{c.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-foreground mb-1">Interpretasi Perubahan Harga</h4>
                                        <ul className="space-y-1">
                                            <li>
                                                <span className="text-red-600">↑ Naik</span> - Harga lebih tinggi dari kemarin
                                            </li>
                                            <li>
                                                <span className="text-green-600">↓ Turun</span> - Harga lebih rendah dari kemarin
                                            </li>
                                            <li>
                                                <span className="text-gray-600">— Stabil</span> - Harga tidak berubah
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}
