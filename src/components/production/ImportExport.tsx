import { useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Upload, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Production, Land } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatDate, formatShortDate, format } from "@/lib/dateUtils";

interface ImportExportProps {
    productions: Production[];
    lands: Land[];
    onImportSuccess: () => void;
}

export function ImportExport({ productions, lands, onImportSuccess }: ImportExportProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const importType = useRef<"planting" | "harvest">("planting");

    const handleImportClick = (type: "planting" | "harvest") => {
        importType.current = type;
        fileInputRef.current?.click();
    };

    // Helper to convert Excel serial date to YYYY-MM-DD string
    const parseExcelDate = (value: any): string | null => {
        if (!value) return null;

        // If it's already a valid date string (YYYY-MM-DD format)
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }

        // If it's a number (Excel serial date)
        if (typeof value === "number") {
            // Excel serial date: days since 1900-01-01 (with Excel's leap year bug)
            const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
            const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
            return date.toISOString().split("T")[0];
        }

        // Try to parse as date string
        if (typeof value === "string") {
            const parsed = new Date(value);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString().split("T")[0];
            }
        }

        return null;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            if (importType.current === "planting") {
                // Expected columns: land_name, commodity, planting_date, seed_count, estimated_harvest_date, notes
                const records = jsonData
                    .map((row: any) => {
                        const land = lands.find((l) => l.name.toLowerCase() === row.land_name?.toLowerCase());
                        return {
                            land_id: land?.id,
                            commodity: row.commodity,
                            planting_date: parseExcelDate(row.planting_date),
                            seed_count: parseInt(row.seed_count) || 0,
                            estimated_harvest_date: parseExcelDate(row.estimated_harvest_date),
                            notes: row.notes || null,
                            status: "planted" as const,
                        };
                    })
                    .filter((r) => r.land_id && r.commodity && r.planting_date);

                if (records.length === 0) {
                    throw new Error("Tidak ada data valid ditemukan. Pastikan kolom: land_name, commodity, planting_date, seed_count");
                }

                const { error } = await supabase.from("productions").insert(records);
                if (error) throw error;
                toast({ title: `${records.length} data tanam berhasil diimpor` });
            } else {
                // Harvest import: Expected columns: production_id or (land_name + commodity + planting_date), harvest_date, harvest_yield_kg
                let updatedCount = 0;
                let insertedCount = 0;

                for (const row of jsonData as any[]) {
                    let productionId = row.production_id;
                    let landId: string | null = null;

                    // Try to find existing production
                    if (!productionId && row.land_name && row.commodity) {
                        const land = lands.find((l) => l.name.toLowerCase() === row.land_name.toLowerCase());
                        landId = land?.id || null;

                        if (land && row.planting_date) {
                            const parsedPlantingDate = parseExcelDate(row.planting_date);
                            if (parsedPlantingDate) {
                                const production = productions.find((p) => p.land_id === land.id && p.commodity.toLowerCase() === row.commodity.toLowerCase() && p.planting_date === parsedPlantingDate);
                                productionId = production?.id;
                            }
                        }
                    }

                    const parsedHarvestDate = parseExcelDate(row.harvest_date);
                    const parsedPlantingDate = parseExcelDate(row.planting_date);

                    if (productionId && parsedHarvestDate && row.harvest_yield_kg) {
                        // Update existing production
                        await supabase
                            .from("productions")
                            .update({
                                harvest_date: parsedHarvestDate,
                                harvest_yield_kg: parseFloat(row.harvest_yield_kg),
                                status: "harvested" as const,
                            })
                            .eq("id", productionId);
                        updatedCount++;
                    } else if (!productionId && landId && row.commodity && parsedHarvestDate && row.harvest_yield_kg) {
                        // Insert new production with harvest data (no matching planting found)
                        const { error } = await supabase.from("productions").insert({
                            land_id: landId,
                            commodity: row.commodity,
                            planting_date: parsedPlantingDate || parsedHarvestDate, // Use planting_date if provided, otherwise use harvest_date
                            seed_count: parseInt(row.seed_count) || 0,
                            estimated_harvest_date: null,
                            harvest_date: parsedHarvestDate,
                            harvest_yield_kg: parseFloat(row.harvest_yield_kg),
                            status: "harvested" as const,
                            notes: row.notes || null,
                        });
                        if (!error) insertedCount++;
                    }
                }

                const message = [];
                if (updatedCount > 0) message.push(`${updatedCount} diperbarui`);
                if (insertedCount > 0) message.push(`${insertedCount} ditambahkan`);
                toast({ title: message.length > 0 ? `Data panen: ${message.join(", ")}` : "Tidak ada data valid ditemukan" });
            }

            onImportSuccess();
        } catch (error: any) {
            toast({
                title: "Impor gagal",
                description: error.message,
                variant: "destructive",
            });
        }

        e.target.value = "";
    };

    const exportToCSV = () => {
        const data = productions.map((p) => ({
            commodity: p.commodity,
            land_name: p.land?.name || "",
            planting_date: p.planting_date,
            seed_count: p.seed_count,
            estimated_harvest_date: p.estimated_harvest_date || "",
            harvest_date: p.harvest_date || "",
            harvest_yield_kg: p.harvest_yield_kg || "",
            status: p.status,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Productions");
        XLSX.writeFile(wb, `productions_${format(new Date(), "yyyy-MM-dd")}.csv`);
    };

    const exportToXLSX = () => {
        const data = productions.map((p) => ({
            Commodity: p.commodity,
            "Land Name": p.land?.name || "",
            "Planting Date": p.planting_date,
            "Seed Count": p.seed_count,
            "Est. Harvest Date": p.estimated_harvest_date || "",
            "Harvest Date": p.harvest_date || "",
            "Yield (kg)": p.harvest_yield_kg || "",
            Status: p.status,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Productions");
        XLSX.writeFile(wb, `productions_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    const exportToPDF = async () => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 14;
        const maxImageWidth = (pageWidth - margin * 3) / 2; // Two images side by side

        doc.setFontSize(18);
        doc.text("Laporan Produksi", margin, 22);
        doc.setFontSize(10);
        doc.text(`Dibuat pada ${formatDate(new Date(), "PPP")}`, margin, 30);

        let currentY = 35;

        // Capture Charts
        try {
            const periodChart = document.getElementById("chart-production-period");
            const commodityChart = document.getElementById("chart-production-commodity");

            if (periodChart && commodityChart) {
                const canvas1 = await html2canvas(periodChart, { scale: 2 });
                const imgData1 = canvas1.toDataURL("image/png");
                const aspectRatio1 = canvas1.height / canvas1.width;
                const imgHeight1 = maxImageWidth * aspectRatio1;

                const canvas2 = await html2canvas(commodityChart, { scale: 2 });
                const imgData2 = canvas2.toDataURL("image/png");
                const aspectRatio2 = canvas2.height / canvas2.width;
                const imgHeight2 = maxImageWidth * aspectRatio2;

                const maxChartHeight = Math.max(imgHeight1, imgHeight2);

                // Add Bar Chart
                doc.setFontSize(10);
                doc.text("Produksi per Periode", margin, currentY + 5);
                doc.addImage(imgData1, "PNG", margin, currentY + 8, maxImageWidth, imgHeight1);

                // Add Pie Chart
                doc.text("Produksi per Komoditas", margin + maxImageWidth + 10, currentY + 5);
                doc.addImage(imgData2, "PNG", margin + maxImageWidth + 10, currentY + 8, maxImageWidth, imgHeight2);

                currentY += maxChartHeight + 15;
            }
        } catch (err) {
            console.error("Error capturing charts:", err);
        }

        const tableData = productions.map((p) => [
            p.commodity,
            p.land?.name || "-",
            formatShortDate(p.planting_date),
            p.seed_count.toString(),
            p.harvest_date ? formatShortDate(p.harvest_date) : "-",
            p.harvest_yield_kg ? `${p.harvest_yield_kg} kg` : "-",
            p.status,
        ]);

        autoTable(doc, {
            head: [["Komoditas", "Lahan", "Tanam", "Benih", "Panen", "Hasil", "Status"]],
            body: tableData,
            startY: currentY + 5,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [105, 185, 83] },
        });

        // Summary - check if there's enough space, otherwise add new page
        const totalYield = productions.reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0);
        const harvestedCount = productions.filter((p) => p.status === "harvested").length;

        let tableFinalY = (doc as any).lastAutoTable.finalY || currentY + 10;
        const summaryHeight = 50; // Approximate height needed for summary

        if (tableFinalY + summaryHeight > pageHeight - 10) {
            doc.addPage();
            tableFinalY = 20;
        }

        doc.setFontSize(12);
        doc.text("Ringkasan", margin, tableFinalY + 15);
        doc.setFontSize(10);
        doc.text(`Total Produksi: ${productions.length}`, margin, tableFinalY + 25);
        doc.text(`Dipanen: ${harvestedCount}`, margin, tableFinalY + 32);
        doc.text(`Total Hasil: ${totalYield.toLocaleString()} kg`, margin, tableFinalY + 39);

        doc.save(`productions_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    };

    return (
        <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-white" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Impor
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleImportClick("planting")}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Impor Data Tanam
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleImportClick("harvest")}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Impor Data Panen
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-white" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Ekspor
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={exportToCSV}>
                        <FileText className="w-4 h-4 mr-2" />
                        Ekspor sebagai CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToXLSX}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Ekspor sebagai XLSX
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToPDF}>
                        <FileText className="w-4 h-4 mr-2" />
                        Ekspor sebagai PDF
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
