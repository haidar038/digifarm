import { useState, useEffect } from "react";
import { ObserverLayout } from "@/components/layout/ObserverLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Land, Production } from "@/types/database";
import { Loader2, FileText, FileSpreadsheet, Download, Database, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateAnalyticsPDF, generateAnalyticsExcel, ReportData } from "@/lib/report-generator";
import { getAnalyticsSummary, getLandProductivity, getCommodityStats, formatNumber, formatCurrency } from "@/lib/analytics-utils";
import { useAuth } from "@/contexts/auth-context";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];

export default function ObserverExport() {
    const [lands, setLands] = useState<Land[]>([]);
    const [productions, setProductions] = useState<Production[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [exportType, setExportType] = useState<"pdf" | "excel" | "csv">("pdf");
    const [dataScope, setDataScope] = useState<"all" | "harvested">("all");
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
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredData = () => {
        if (dataScope === "harvested") {
            return productions.filter((p) => p.status === "harvested");
        }
        return productions;
    };

    const getReportData = (): ReportData => {
        const filteredProductions = getFilteredData();
        return {
            summary: getAnalyticsSummary(filteredProductions, lands),
            landProductivity: getLandProductivity(filteredProductions, lands),
            commodityStats: getCommodityStats(filteredProductions),
            productions: filteredProductions,
            lands,
            generatedAt: new Date(),
            userName: profile?.full_name,
        };
    };

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

    const handleExportCSV = () => {
        try {
            const filteredProductions = getFilteredData();

            // Build CSV content
            const headers = ["ID", "Komoditas", "Lahan", "Tanggal Tanam", "Tanggal Panen", "Hasil Panen (kg)", "Biaya Total", "Harga Jual/kg", "Status"];

            const rows = filteredProductions.map((p) => [p.id, p.commodity, p.land?.name || "", p.planting_date, p.harvest_date || "", p.harvest_yield_kg || "", p.total_cost || "", p.selling_price_per_kg || "", p.status]);

            const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

            // Download CSV
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `data_produksi_${new Date().toISOString().split("T")[0]}.csv`;
            link.click();

            toast({
                title: "Ekspor berhasil",
                description: "Data CSV telah diunduh.",
            });
        } catch (error) {
            console.error("Export CSV error:", error);
            toast({
                title: "Gagal ekspor",
                description: "Terjadi kesalahan saat membuat file CSV.",
                variant: "destructive",
            });
        }
    };

    const handleExport = () => {
        switch (exportType) {
            case "pdf":
                handleExportPDF();
                break;
            case "excel":
                handleExportExcel();
                break;
            case "csv":
                handleExportCSV();
                break;
        }
    };

    if (loading) {
        return (
            <ObserverLayout title="Ekspor Data">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ObserverLayout>
        );
    }

    // Prepare chart data
    const filteredProductions = getFilteredData();
    const commodityStats = getCommodityStats(filteredProductions);
    const landProductivity = getLandProductivity(filteredProductions, lands);

    // Pie chart data - commodity distribution by yield
    const pieData = commodityStats.map((c) => ({
        name: c.commodity,
        value: c.totalYield,
    }));

    // Bar chart data - top lands by productivity
    const barData = landProductivity.slice(0, 8).map((lp) => ({
        name: lp.landName.length > 12 ? lp.landName.substring(0, 12) + "..." : lp.landName,
        fullName: lp.landName,
        yield: lp.totalYield,
        productivity: lp.productivity,
    }));

    // Status distribution for pie chart
    const statusData = [
        { name: "Ditanam", value: productions.filter((p) => p.status === "planted").length, color: "#3b82f6" },
        { name: "Tumbuh", value: productions.filter((p) => p.status === "growing").length, color: "#f59e0b" },
        { name: "Dipanen", value: productions.filter((p) => p.status === "harvested").length, color: "#10b981" },
    ].filter((s) => s.value > 0);

    return (
        <ObserverLayout title="Ekspor Data" description="Unduh laporan dan data mentah">
            <div className="space-y-6">
                {/* Export Options */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Ekspor Laporan
                        </CardTitle>
                        <CardDescription>Unduh laporan agregat atau data mentah dalam berbagai format</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Export Type */}
                            <div className="space-y-2">
                                <Label>Format Ekspor</Label>
                                <Select value={exportType} onValueChange={(v) => setExportType(v as "pdf" | "excel" | "csv")}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pdf">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                PDF - Laporan Lengkap
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="excel">
                                            <div className="flex items-center gap-2">
                                                <FileSpreadsheet className="h-4 w-4" />
                                                Excel - Laporan Lengkap
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="csv">
                                            <div className="flex items-center gap-2">
                                                <Database className="h-4 w-4" />
                                                CSV - Data Mentah
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Data Scope */}
                            <div className="space-y-2">
                                <Label>Cakupan Data</Label>
                                <Select value={dataScope} onValueChange={(v) => setDataScope(v as "all" | "harvested")}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Produksi</SelectItem>
                                        <SelectItem value="harvested">Hanya yang Sudah Panen</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button onClick={handleExport} disabled={exporting} className="w-full sm:w-auto">
                            {exporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Mengekspor...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Ekspor Sekarang
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Data Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Lahan</CardDescription>
                            <CardTitle className="text-2xl">{lands.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Produksi</CardDescription>
                            <CardTitle className="text-2xl">{productions.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Data Terpilih</CardDescription>
                            <CardTitle className="text-2xl text-blue-600">{filteredProductions.length} records</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Hasil Panen</CardDescription>
                            <CardTitle className="text-2xl text-green-600">{formatNumber(filteredProductions.filter((p) => p.status === "harvested").reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0))} kg</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Commodity Distribution Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5" />
                                Distribusi Komoditas
                            </CardTitle>
                            <CardDescription>Berdasarkan hasil panen (kg)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pieData.length > 0 ? (
                                <div id="export-commodity-chart" className="h-72 bg-white dark:bg-background rounded-lg p-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={90} fill="#8884d8" dataKey="value">
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => `${formatNumber(value)} kg`} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-72 flex items-center justify-center text-muted-foreground">Tidak ada data panen</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Status Distribution Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5" />
                                Status Produksi
                            </CardTitle>
                            <CardDescription>Distribusi berdasarkan status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {statusData.length > 0 ? (
                                <div id="export-status-chart" className="h-72 bg-white dark:bg-background rounded-lg p-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={90} fill="#8884d8" dataKey="value">
                                                {statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-72 flex items-center justify-center text-muted-foreground">Tidak ada data produksi</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Lands Bar Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Produktivitas Lahan Teratas
                            </CardTitle>
                            <CardDescription>Top 8 lahan berdasarkan hasil panen</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {barData.length > 0 ? (
                                <div id="export-land-chart" className="h-80 bg-white dark:bg-background rounded-lg p-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} height={80} />
                                            <YAxis tickFormatter={(v) => `${v} kg`} tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                formatter={(value: number, name: string) => [name === "yield" ? `${formatNumber(value)} kg` : `${formatNumber(value, 3)} kg/m²`, name === "yield" ? "Total Panen" : "Produktivitas"]}
                                                labelFormatter={(label: string, payload: any[]) => payload[0]?.payload?.fullName || label}
                                            />
                                            <Legend />
                                            <Bar dataKey="yield" name="Total Panen" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-80 flex items-center justify-center text-muted-foreground">Tidak ada data lahan dengan hasil panen</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Format Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Format</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                        <ul>
                            <li>
                                <strong>PDF</strong> - Laporan visual lengkap dengan grafik dan ringkasan statistik. Cocok untuk presentasi dan dokumentasi.
                            </li>
                            <li>
                                <strong>Excel</strong> - Spreadsheet dengan multiple sheet berisi data terstruktur. Cocok untuk analisis lanjutan.
                            </li>
                            <li>
                                <strong>CSV</strong> - Data mentah dalam format sederhana. Cocok untuk import ke sistem lain atau analisis dengan tools lain.
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </ObserverLayout>
    );
}
