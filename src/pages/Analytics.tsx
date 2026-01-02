import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnalyticsMetrics } from "@/components/analytics/AnalyticsMetrics";
import { LandComparisonChart } from "@/components/analytics/LandComparisonChart";
import { CostRevenueChart } from "@/components/analytics/CostRevenueChart";
import { ProfitLossTrend } from "@/components/analytics/ProfitLossTrend";
import { ProductivityChart } from "@/components/overview/ProductivityChart";
import { ProductionCharts } from "@/components/production/ProductionCharts";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { Land, Production } from "@/types/database";
import { getAnalyticsSummary, getLandProductivity, getCommodityStats } from "@/lib/analytics-utils";
import { generateAnalyticsPDF, generateAnalyticsExcel, ReportData } from "@/lib/report-generator";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, BarChart3, Download, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Analytics() {
    const [lands, setLands] = useState<Land[]>([]);
    const [productions, setProductions] = useState<Production[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const { profile } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [landsRes, productionsRes] = await Promise.all([supabase.from("lands").select("*"), supabase.from("productions").select("*, land:lands(*)")]);

            if (landsRes.data) setLands(landsRes.data as Land[]);
            if (productionsRes.data) setProductions(productionsRes.data as unknown as Production[]);
        } catch (error) {
            console.error("Error fetching analytics data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getReportData = (): ReportData => ({
        summary: getAnalyticsSummary(productions, lands),
        landProductivity: getLandProductivity(productions, lands),
        commodityStats: getCommodityStats(productions),
        productions,
        lands,
        generatedAt: new Date(),
        userName: profile?.full_name,
    });

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            await generateAnalyticsPDF(getReportData());
            toast({
                title: "Ekspor berhasil",
                description: "Laporan PDF telah diunduh.",
            });
        } catch (error) {
            console.error("Export PDF error:", error);
            toast({
                title: "Gagal ekspor",
                description: "Terjadi kesalahan saat membuat laporan PDF.",
                variant: "destructive",
            });
        } finally {
            setExporting(false);
        }
    };

    const handleExportExcel = () => {
        try {
            generateAnalyticsExcel(getReportData());
            toast({
                title: "Ekspor berhasil",
                description: "Laporan Excel telah diunduh.",
            });
        } catch (error) {
            console.error("Export Excel error:", error);
            toast({
                title: "Gagal ekspor",
                description: "Terjadi kesalahan saat membuat laporan Excel.",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Analitik">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    const summary = getAnalyticsSummary(productions, lands);
    const landProductivity = getLandProductivity(productions, lands);
    const commodityStats = getCommodityStats(productions);

    return (
        <DashboardLayout title="Analitik">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <BarChart3 className="h-8 w-8 text-primary" />
                            Analitik Pertanian
                        </h1>
                        <p className="text-muted-foreground mt-1">Insight dan visualisasi data produksi pertanian Anda.</p>
                    </div>

                    {/* Export Button */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" disabled={exporting} className="bg-white">
                                {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                Ekspor Laporan
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportPDF}>
                                <FileText className="w-4 h-4 mr-2" />
                                Ekspor sebagai PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportExcel}>
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Ekspor sebagai Excel
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Key Metrics */}
                <AnalyticsMetrics summary={summary} />

                {/* Charts Row 1: Land Comparison + Cost Revenue */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div id="analytics-land-chart">
                        <LandComparisonChart data={landProductivity} />
                    </div>
                    <div id="analytics-revenue-chart">
                        <CostRevenueChart data={commodityStats} />
                    </div>
                </div>

                {/* Profit/Loss Trend (Full Width) */}
                <ProfitLossTrend productions={productions} />

                {/* Productivity Trend (Full Width) */}
                <ProductivityChart productions={productions} />

                {/* Production Charts (Bar + Pie) */}
                <ProductionCharts productions={productions} />
            </div>
        </DashboardLayout>
    );
}
