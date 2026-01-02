import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "@/lib/dateUtils";
import type { Land, FarmerWithStats } from "@/types/database";

interface ManagerBulkImportProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    connectedFarmers: FarmerWithStats[];
    onSuccess: () => void;
}

interface ImportRow {
    farmer_id?: string;
    farmer_name?: string;
    land_name: string;
    commodity: string;
    planting_date: string;
    seed_count: number;
    estimated_harvest_date?: string;
    notes?: string;
    // Parsed/derived fields
    _farmerId?: string;
    _farmerName?: string;
    _landId?: string;
    _status: "valid" | "error" | "warning";
    _message?: string;
}

export function ManagerBulkImport({ open, onOpenChange, connectedFarmers, onSuccess }: ManagerBulkImportProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFarmer, setSelectedFarmer] = useState<string>("all");
    const [parsedData, setParsedData] = useState<ImportRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [step, setStep] = useState<"select" | "preview" | "result">("select");
    const [farmerLandsMap, setFarmerLandsMap] = useState<Map<string, Land[]>>(new Map());

    // Helper to convert Excel serial date to YYYY-MM-DD string
    const parseExcelDate = (value: any): string | null => {
        if (!value) return null;

        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }

        if (typeof value === "number") {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
            return date.toISOString().split("T")[0];
        }

        if (typeof value === "string") {
            const parsed = new Date(value);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString().split("T")[0];
            }
        }

        return null;
    };

    const loadFarmerLands = async (farmerIds: string[]) => {
        const { data, error } = await supabase.from("lands").select("*").in("user_id", farmerIds);

        if (error) {
            console.error("Error loading lands:", error);
            return new Map();
        }

        const map = new Map<string, Land[]>();
        for (const land of data as Land[]) {
            const farmerId = land.user_id!;
            if (!map.has(farmerId)) {
                map.set(farmerId, []);
            }
            map.get(farmerId)!.push(land);
        }
        return map;
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

            if (jsonData.length === 0) {
                toast({
                    title: "File kosong",
                    description: "File yang diupload tidak berisi data",
                    variant: "destructive",
                });
                return;
            }

            // Get unique farmer IDs/names from import data
            const uniqueFarmerIds = new Set<string>();
            const pendingRows: ImportRow[] = [];

            for (const row of jsonData) {
                const importRow: ImportRow = {
                    farmer_id: row.farmer_id,
                    farmer_name: row.farmer_name,
                    land_name: row.land_name,
                    commodity: row.commodity,
                    planting_date: parseExcelDate(row.planting_date) || "",
                    seed_count: parseInt(row.seed_count) || 0,
                    estimated_harvest_date: parseExcelDate(row.estimated_harvest_date) || undefined,
                    notes: row.notes,
                    _status: "valid",
                };

                // Find farmer
                let matchedFarmer: FarmerWithStats | undefined;

                if (selectedFarmer !== "all") {
                    // Single farmer mode
                    matchedFarmer = connectedFarmers.find((f) => f.id === selectedFarmer);
                    importRow._farmerId = selectedFarmer;
                    importRow._farmerName = matchedFarmer?.full_name;
                } else if (row.farmer_id) {
                    // Use farmer_id if provided
                    matchedFarmer = connectedFarmers.find((f) => f.id === row.farmer_id);
                    if (matchedFarmer) {
                        importRow._farmerId = matchedFarmer.id;
                        importRow._farmerName = matchedFarmer.full_name;
                    } else {
                        importRow._status = "error";
                        importRow._message = "Farmer ID tidak ditemukan atau tidak terhubung";
                    }
                } else if (row.farmer_name) {
                    // Match by name
                    matchedFarmer = connectedFarmers.find((f) => f.full_name.toLowerCase() === row.farmer_name.toLowerCase());
                    if (matchedFarmer) {
                        importRow._farmerId = matchedFarmer.id;
                        importRow._farmerName = matchedFarmer.full_name;
                    } else {
                        importRow._status = "error";
                        importRow._message = `Petani "${row.farmer_name}" tidak ditemukan`;
                    }
                } else {
                    importRow._status = "error";
                    importRow._message = "farmer_id atau farmer_name wajib diisi";
                }

                if (importRow._farmerId) {
                    uniqueFarmerIds.add(importRow._farmerId);
                }

                // Validate required fields
                if (!importRow.land_name) {
                    importRow._status = "error";
                    importRow._message = "land_name wajib diisi";
                } else if (!importRow.commodity) {
                    importRow._status = "error";
                    importRow._message = "commodity wajib diisi";
                } else if (!importRow.planting_date) {
                    importRow._status = "error";
                    importRow._message = "planting_date wajib diisi";
                } else if (importRow.seed_count <= 0) {
                    importRow._status = "error";
                    importRow._message = "seed_count harus lebih dari 0";
                }

                pendingRows.push(importRow);
            }

            // Load lands for all relevant farmers
            const landsMap = await loadFarmerLands(Array.from(uniqueFarmerIds));
            setFarmerLandsMap(landsMap);

            // Match lands
            for (const row of pendingRows) {
                if (row._status === "error") continue;

                const farmerLands = landsMap.get(row._farmerId!) || [];
                const matchedLand = farmerLands.find((l) => l.name.toLowerCase() === row.land_name.toLowerCase());

                if (matchedLand) {
                    row._landId = matchedLand.id;
                } else {
                    row._status = "warning";
                    row._message = `Lahan "${row.land_name}" tidak ditemukan, akan dibuat baru`;
                }
            }

            setParsedData(pendingRows);
            setStep("preview");
        } catch (error: any) {
            toast({
                title: "Gagal membaca file",
                description: error.message,
                variant: "destructive",
            });
        }

        e.target.value = "";
    };

    const handleImport = async () => {
        const validRows = parsedData.filter((r) => r._status !== "error");
        if (validRows.length === 0) {
            toast({
                title: "Tidak ada data valid",
                description: "Semua baris memiliki error",
                variant: "destructive",
            });
            return;
        }

        try {
            setImporting(true);
            let successCount = 0;
            let landCreatedCount = 0;

            for (const row of validRows) {
                let landId = row._landId;

                // Create land if not exists
                if (!landId && row._farmerId) {
                    const { data: newLand, error: landError } = await supabase
                        .from("lands")
                        .insert({
                            name: row.land_name,
                            area_m2: 1000, // Default area
                            commodities: [row.commodity],
                            status: "active",
                            user_id: row._farmerId,
                        } as any)
                        .select()
                        .single();

                    if (landError) {
                        console.error("Error creating land:", landError);
                        continue;
                    }

                    landId = (newLand as Land).id;
                    landCreatedCount++;
                }

                if (!landId) continue;

                // Create production
                const { error: prodError } = await supabase.from("productions").insert({
                    land_id: landId,
                    commodity: row.commodity,
                    planting_date: row.planting_date,
                    seed_count: row.seed_count,
                    estimated_harvest_date: row.estimated_harvest_date || null,
                    notes: row.notes || null,
                    status: "planted",
                    user_id: row._farmerId,
                } as any);

                if (!prodError) {
                    successCount++;
                }
            }

            const messages = [`${successCount} produksi berhasil diimpor`];
            if (landCreatedCount > 0) {
                messages.push(`${landCreatedCount} lahan baru dibuat`);
            }

            toast({ title: messages.join(", ") });
            onSuccess();
            handleClose();
        } catch (error: any) {
            toast({
                title: "Gagal mengimpor data",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setStep("select");
        setParsedData([]);
        setSelectedFarmer("all");
        onOpenChange(false);
    };

    const downloadTemplate = () => {
        const template = [
            {
                farmer_id: "",
                farmer_name: "Nama Petani",
                land_name: "Nama Lahan",
                commodity: "Red Chili",
                planting_date: format(new Date(), "yyyy-MM-dd"),
                seed_count: 100,
                estimated_harvest_date: "",
                notes: "",
            },
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "bulk_import_template.xlsx");
    };

    const validCount = parsedData.filter((r) => r._status === "valid").length;
    const warningCount = parsedData.filter((r) => r._status === "warning").length;
    const errorCount = parsedData.filter((r) => r._status === "error").length;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Bulk Import Produksi</DialogTitle>
                    <DialogDescription>Import data produksi untuk multiple petani sekaligus menggunakan file Excel/CSV</DialogDescription>
                </DialogHeader>

                {step === "select" && (
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Target Petani</Label>
                            <Select value={selectedFarmer} onValueChange={setSelectedFarmer}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih petani..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Petani (gunakan kolom farmer_name)</SelectItem>
                                    {connectedFarmers.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">{selectedFarmer === "all" ? "Data akan diimport berdasarkan kolom farmer_name atau farmer_id di file" : "Semua data akan diimport ke petani yang dipilih"}</p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Format File</CardTitle>
                                <CardDescription>Kolom yang diperlukan dalam file Excel/CSV</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="font-medium">farmer_id</span>
                                            <span className="text-muted-foreground"> (opsional)</span>
                                        </div>
                                        <div className="text-muted-foreground">UUID petani</div>

                                        <div>
                                            <span className="font-medium">farmer_name</span>
                                            <span className="text-muted-foreground"> (wajib jika farmer_id kosong)</span>
                                        </div>
                                        <div className="text-muted-foreground">Nama lengkap petani</div>

                                        <div>
                                            <span className="font-medium">land_name</span>
                                            <span className="text-destructive">*</span>
                                        </div>
                                        <div className="text-muted-foreground">Nama lahan</div>

                                        <div>
                                            <span className="font-medium">commodity</span>
                                            <span className="text-destructive">*</span>
                                        </div>
                                        <div className="text-muted-foreground">Jenis komoditas</div>

                                        <div>
                                            <span className="font-medium">planting_date</span>
                                            <span className="text-destructive">*</span>
                                        </div>
                                        <div className="text-muted-foreground">Tanggal tanam (YYYY-MM-DD)</div>

                                        <div>
                                            <span className="font-medium">seed_count</span>
                                            <span className="text-destructive">*</span>
                                        </div>
                                        <div className="text-muted-foreground">Jumlah benih</div>

                                        <div>
                                            <span className="font-medium">estimated_harvest_date</span>
                                        </div>
                                        <div className="text-muted-foreground">Perkiraan tanggal panen</div>

                                        <div>
                                            <span className="font-medium">notes</span>
                                        </div>
                                        <div className="text-muted-foreground">Catatan tambahan</div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="mt-4" onClick={downloadTemplate}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Template
                                </Button>
                            </CardContent>
                        </Card>

                        <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileSelect} />
                    </div>
                )}

                {step === "preview" && (
                    <div className="space-y-4 py-4">
                        <div className="flex gap-4">
                            <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Valid: {validCount}
                            </Badge>
                            <Badge variant="secondary" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Warning: {warningCount}
                            </Badge>
                            <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Error: {errorCount}
                            </Badge>
                        </div>

                        <div className="rounded-md border max-h-[400px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Petani</TableHead>
                                        <TableHead>Lahan</TableHead>
                                        <TableHead>Komoditas</TableHead>
                                        <TableHead>Tanggal Tanam</TableHead>
                                        <TableHead>Bibit</TableHead>
                                        <TableHead>Pesan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                {row._status === "valid" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                                {row._status === "warning" && <AlertCircle className="h-4 w-4 text-amber-600" />}
                                                {row._status === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
                                            </TableCell>
                                            <TableCell>{row._farmerName || row.farmer_name || "-"}</TableCell>
                                            <TableCell>{row.land_name}</TableCell>
                                            <TableCell>{row.commodity}</TableCell>
                                            <TableCell>{row.planting_date}</TableCell>
                                            <TableCell>{row.seed_count}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{row._message}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === "select" && (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                Batal
                            </Button>
                            <Button onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-4 w-4 mr-2" />
                                Pilih File
                            </Button>
                        </>
                    )}

                    {step === "preview" && (
                        <>
                            <Button variant="outline" onClick={() => setStep("select")}>
                                Kembali
                            </Button>
                            <Button onClick={handleImport} disabled={importing || validCount + warningCount === 0}>
                                {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Import {validCount + warningCount} Data
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
