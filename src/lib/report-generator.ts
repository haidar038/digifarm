import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { Production, Land } from "@/types/database";
import { AnalyticsSummary, CommodityStats, LandProductivity, formatCurrency, formatNumber } from "./analytics-utils";
import { translateCommodity } from "./i18n";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export interface ReportData {
    summary: AnalyticsSummary;
    landProductivity: LandProductivity[];
    commodityStats: CommodityStats[];
    productions: Production[];
    lands: Land[];
    generatedAt: Date;
    userName?: string;
    chartIds?: string[]; // Optional custom chart IDs to capture
}

/**
 * Generate PDF Analytics Report
 */
export async function generateAnalyticsPDF(data: ReportData): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;

    let currentY = 20;

    // ===== HEADER =====
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan Analitik Pertanian", margin, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Dibuat pada: ${format(data.generatedAt, "d MMMM yyyy, HH:mm", { locale: localeId })}`, margin, currentY);
    if (data.userName) {
        doc.text(`Oleh: ${data.userName}`, pageWidth - margin - 50, currentY);
    }
    currentY += 15;

    // ===== SUMMARY METRICS =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Utama", margin, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const summaryData = [
        ["Total Pendapatan", formatCurrency(data.summary.totalRevenue)],
        ["Total Biaya", formatCurrency(data.summary.totalCost)],
        ["Total Profit", formatCurrency(data.summary.totalProfit)],
        ["Total Hasil Panen", `${formatNumber(data.summary.totalYield)} kg`],
        ["Jumlah Panen", `${data.summary.harvestCount} kali`],
        ["Produktivitas Rata-rata", `${formatNumber(data.summary.avgProductivity, 2)} kg/m²`],
    ];

    autoTable(doc, {
        startY: currentY,
        head: [["Metrik", "Nilai"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [105, 185, 83] },
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: "bold" } },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // ===== CHARTS (if available) =====
    try {
        // Use custom chart IDs if provided, otherwise use default analytics page IDs
        const defaultChartIds = [
            { id: "analytics-land-chart", title: "Produktivitas per Lahan" },
            { id: "analytics-revenue-chart", title: "Biaya vs Pendapatan" },
        ];

        // Also check for observer export charts
        const observerChartIds = [
            { id: "export-commodity-chart", title: "Distribusi Komoditas" },
            { id: "export-status-chart", title: "Status Produksi" },
            { id: "export-land-chart", title: "Produktivitas Lahan Teratas" },
        ];

        const chartIds = [...defaultChartIds, ...observerChartIds];

        for (const chart of chartIds) {
            const element = document.getElementById(chart.id);
            if (element) {
                // Check if we need new page
                if (currentY + 90 > pageHeight - 20) {
                    doc.addPage();
                    currentY = 20;
                }

                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: "#ffffff",
                    logging: false,
                });
                const imgData = canvas.toDataURL("image/png");
                const aspectRatio = canvas.height / canvas.width;
                const imgWidth = pageWidth - margin * 2;
                const imgHeight = Math.min(imgWidth * aspectRatio, 85);

                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text(chart.title, margin, currentY);
                currentY += 6;

                doc.addImage(imgData, "PNG", margin, currentY, imgWidth, imgHeight);
                currentY += imgHeight + 12;
            }
        }
    } catch (err) {
        console.error("Error capturing charts:", err);
    }

    // ===== LAND PRODUCTIVITY TABLE =====
    if (data.landProductivity.length > 0) {
        if (currentY + 60 > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Produktivitas per Lahan", margin, currentY);
        currentY += 8;

        const landData = data.landProductivity.map((lp) => [lp.landName, `${formatNumber(lp.area)} m²`, `${formatNumber(lp.totalYield)} kg`, `${formatNumber(lp.productivity, 2)} kg/m²`, lp.harvestCount.toString()]);

        autoTable(doc, {
            startY: currentY,
            head: [["Lahan", "Luas", "Total Hasil", "Produktivitas", "Jumlah Panen"]],
            body: landData,
            theme: "striped",
            headStyles: { fillColor: [105, 185, 83] },
            styles: { fontSize: 8 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== COMMODITY STATS TABLE =====
    if (data.commodityStats.length > 0) {
        if (currentY + 60 > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Statistik per Komoditas", margin, currentY);
        currentY += 8;

        const commodityData = data.commodityStats.map((cs) => [translateCommodity(cs.commodity), `${formatNumber(cs.totalYield)} kg`, formatCurrency(cs.totalRevenue), formatCurrency(cs.totalCost), formatCurrency(cs.profit)]);

        autoTable(doc, {
            startY: currentY,
            head: [["Komoditas", "Total Hasil", "Pendapatan", "Biaya", "Profit"]],
            body: commodityData,
            theme: "striped",
            headStyles: { fillColor: [105, 185, 83] },
            styles: { fontSize: 8 },
        });
    }

    // Save
    doc.save(`laporan-analitik_${format(data.generatedAt, "yyyy-MM-dd")}.pdf`);
}

/**
 * Generate Excel Analytics Report
 */
export function generateAnalyticsExcel(data: ReportData): void {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summarySheet = XLSX.utils.aoa_to_sheet([
        ["Laporan Analitik Pertanian"],
        [`Dibuat: ${format(data.generatedAt, "d MMMM yyyy, HH:mm", { locale: localeId })}`],
        [],
        ["Metrik", "Nilai"],
        ["Total Pendapatan", data.summary.totalRevenue],
        ["Total Biaya", data.summary.totalCost],
        ["Total Profit", data.summary.totalProfit],
        ["Total Hasil Panen (kg)", data.summary.totalYield],
        ["Jumlah Panen", data.summary.harvestCount],
        ["Produktivitas Rata-rata (kg/m²)", data.summary.avgProductivity],
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Ringkasan");

    // Sheet 2: Land Productivity
    const landHeaders = ["Nama Lahan", "Luas (m²)", "Total Hasil (kg)", "Produktivitas (kg/m²)", "Jumlah Panen"];
    const landRows = data.landProductivity.map((lp) => [lp.landName, lp.area, lp.totalYield, lp.productivity, lp.harvestCount]);
    const landSheet = XLSX.utils.aoa_to_sheet([landHeaders, ...landRows]);
    XLSX.utils.book_append_sheet(wb, landSheet, "Produktivitas Lahan");

    // Sheet 3: Commodity Stats
    const commodityHeaders = ["Komoditas", "Total Hasil (kg)", "Pendapatan", "Biaya", "Profit", "Rata-rata per Panen"];
    const commodityRows = data.commodityStats.map((cs) => [translateCommodity(cs.commodity), cs.totalYield, cs.totalRevenue, cs.totalCost, cs.profit, cs.avgYieldPerHarvest]);
    const commoditySheet = XLSX.utils.aoa_to_sheet([commodityHeaders, ...commodityRows]);
    XLSX.utils.book_append_sheet(wb, commoditySheet, "Statistik Komoditas");

    // Sheet 4: All Productions
    const productionHeaders = ["Komoditas", "Lahan", "Tanggal Tanam", "Jumlah Benih", "Tanggal Panen", "Hasil (kg)", "Status", "Biaya", "Harga/kg"];
    const productionRows = data.productions.map((p) => [
        translateCommodity(p.commodity),
        p.land?.name || "-",
        p.planting_date,
        p.seed_count,
        p.harvest_date || "-",
        p.harvest_yield_kg || "-",
        p.status,
        p.total_cost || "-",
        p.selling_price_per_kg || "-",
    ]);
    const productionSheet = XLSX.utils.aoa_to_sheet([productionHeaders, ...productionRows]);
    XLSX.utils.book_append_sheet(wb, productionSheet, "Data Produksi");

    // Save
    XLSX.writeFile(wb, `laporan-analitik_${format(data.generatedAt, "yyyy-MM-dd")}.xlsx`);
}
