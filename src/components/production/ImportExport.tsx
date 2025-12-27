import { useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Production, Land } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
        const records = jsonData.map((row: any) => {
          const land = lands.find((l) => l.name.toLowerCase() === row.land_name?.toLowerCase());
          return {
            land_id: land?.id,
            commodity: row.commodity,
            planting_date: row.planting_date,
            seed_count: parseInt(row.seed_count) || 0,
            estimated_harvest_date: row.estimated_harvest_date || null,
            notes: row.notes || null,
            status: "planted" as const,
          };
        }).filter((r) => r.land_id && r.commodity && r.planting_date);

        if (records.length === 0) {
          throw new Error("No valid records found. Ensure columns: land_name, commodity, planting_date, seed_count");
        }

        const { error } = await supabase.from("productions").insert(records);
        if (error) throw error;
        toast({ title: `${records.length} planting records imported` });
      } else {
        // Harvest import: Expected columns: production_id or (land_name + commodity + planting_date), harvest_date, harvest_yield_kg
        for (const row of jsonData as any[]) {
          let productionId = row.production_id;
          
          if (!productionId && row.land_name && row.commodity && row.planting_date) {
            const land = lands.find((l) => l.name.toLowerCase() === row.land_name.toLowerCase());
            if (land) {
              const production = productions.find(
                (p) => 
                  p.land_id === land.id && 
                  p.commodity.toLowerCase() === row.commodity.toLowerCase() &&
                  p.planting_date === row.planting_date
              );
              productionId = production?.id;
            }
          }

          if (productionId && row.harvest_date && row.harvest_yield_kg) {
            await supabase
              .from("productions")
              .update({
                harvest_date: row.harvest_date,
                harvest_yield_kg: parseFloat(row.harvest_yield_kg),
                status: "harvested" as const,
              })
              .eq("id", productionId);
          }
        }
        toast({ title: "Harvest data imported successfully" });
      }

      onImportSuccess();
    } catch (error: any) {
      toast({
        title: "Import failed",
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

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Production Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on ${format(new Date(), "PPP")}`, 14, 30);

    const tableData = productions.map((p) => [
      p.commodity,
      p.land?.name || "-",
      format(new Date(p.planting_date), "MM/dd/yy"),
      p.seed_count.toString(),
      p.harvest_date ? format(new Date(p.harvest_date), "MM/dd/yy") : "-",
      p.harvest_yield_kg ? `${p.harvest_yield_kg} kg` : "-",
      p.status,
    ]);

    autoTable(doc, {
      head: [["Commodity", "Land", "Planted", "Seeds", "Harvested", "Yield", "Status"]],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [105, 185, 83] },
    });

    // Summary
    const totalYield = productions.reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0);
    const harvestedCount = productions.filter((p) => p.status === "harvested").length;
    
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(12);
    doc.text("Summary", 14, finalY + 15);
    doc.setFontSize(10);
    doc.text(`Total Productions: ${productions.length}`, 14, finalY + 25);
    doc.text(`Harvested: ${harvestedCount}`, 14, finalY + 32);
    doc.text(`Total Yield: ${totalYield.toLocaleString()} kg`, 14, finalY + 39);

    doc.save(`productions_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleImportClick("planting")}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import Planting Data
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleImportClick("harvest")}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import Harvest Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={exportToCSV}>
            <FileText className="w-4 h-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToXLSX}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export as XLSX
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
