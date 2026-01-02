import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { AuditLog, AuditAction } from "@/types/database";
import { ArrowRight, Plus, Minus } from "lucide-react";

interface AuditLogDetailProps {
    log: AuditLog | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TABLE_NAME_MAP: Record<string, string> = {
    lands: "Lahan",
    productions: "Produksi",
    activities: "Aktivitas",
};

const ACTION_MAP: Record<AuditAction, { label: string; variant: "default" | "secondary" | "destructive"; icon: React.ReactNode }> = {
    create: { label: "Tambah", variant: "default", icon: <Plus className="w-3 h-3" /> },
    update: { label: "Ubah", variant: "secondary", icon: <ArrowRight className="w-3 h-3" /> },
    delete: { label: "Hapus", variant: "destructive", icon: <Minus className="w-3 h-3" /> },
};

// Field labels for better readability
const FIELD_LABELS: Record<string, string> = {
    // Common
    id: "ID",
    name: "Nama",
    created_at: "Dibuat Pada",
    updated_at: "Diperbarui Pada",
    user_id: "User ID",
    created_by: "Dibuat Oleh",
    updated_by: "Diperbarui Oleh",
    status: "Status",
    notes: "Catatan",

    // Lands
    area_m2: "Luas (m²)",
    address: "Alamat",
    latitude: "Latitude",
    longitude: "Longitude",
    commodities: "Komoditas",
    custom_commodity: "Komoditas Lainnya",
    photos: "Foto",

    // Productions
    land_id: "ID Lahan",
    commodity: "Komoditas",
    planting_date: "Tanggal Tanam",
    seed_count: "Jumlah Bibit",
    estimated_harvest_date: "Estimasi Panen",
    harvest_date: "Tanggal Panen",
    harvest_yield_kg: "Hasil Panen (kg)",
    total_cost: "Total Biaya",
    selling_price_per_kg: "Harga Jual per kg",

    // Activities
    production_id: "ID Produksi",
    activity_type: "Jenis Aktivitas",
    description: "Deskripsi",
    scheduled_date: "Tanggal Terjadwal",
    completed_at: "Selesai Pada",
};

// Format value for display
function formatValue(value: unknown): string {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Ya" : "Tidak";
    if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

// Render diff view for changes
function DiffView({ changes }: { changes: Record<string, unknown> | null }) {
    if (!changes || Object.keys(changes).length === 0) {
        return <p className="text-sm text-muted-foreground italic">Tidak ada perubahan tercatat</p>;
    }

    return (
        <div className="space-y-3">
            {Object.entries(changes).map(([field, change]) => {
                const changeData = change as { old: unknown; new: unknown };
                const fieldLabel = FIELD_LABELS[field] || field;

                return (
                    <div key={field} className="p-3 rounded-lg bg-muted/50 border">
                        <p className="text-sm font-medium mb-2">{fieldLabel}</p>
                        <div className="flex items-start gap-3 text-sm">
                            <div className="flex-1 p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                                <p className="text-xs text-muted-foreground mb-1">Sebelum</p>
                                <p className="text-red-700 dark:text-red-400 break-all">{formatValue(changeData.old)}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground mt-6 flex-shrink-0" />
                            <div className="flex-1 p-2 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                                <p className="text-xs text-muted-foreground mb-1">Sesudah</p>
                                <p className="text-green-700 dark:text-green-400 break-all">{formatValue(changeData.new)}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Render data view for create/delete
function DataView({ data, type }: { data: Record<string, unknown> | null; type: "create" | "delete" }) {
    if (!data || Object.keys(data).length === 0) {
        return <p className="text-sm text-muted-foreground italic">Tidak ada data tercatat</p>;
    }

    const bgClass = type === "create" ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";

    return (
        <div className={`p-4 rounded-lg border ${bgClass}`}>
            <div className="grid grid-cols-2 gap-3">
                {Object.entries(data).map(([field, value]) => {
                    const fieldLabel = FIELD_LABELS[field] || field;
                    return (
                        <div key={field} className="text-sm">
                            <p className="text-muted-foreground text-xs">{fieldLabel}</p>
                            <p className="font-medium break-all">{formatValue(value)}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function AuditLogDetail({ log, open, onOpenChange }: AuditLogDetailProps) {
    if (!log) return null;

    const actionInfo = ACTION_MAP[log.action];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <Badge variant={actionInfo?.variant || "default"} className="gap-1">
                            {actionInfo?.icon}
                            {actionInfo?.label || log.action}
                        </Badge>
                        <span>{TABLE_NAME_MAP[log.table_name] || log.table_name}</span>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(85vh-120px)]">
                    <div className="space-y-6 pr-4">
                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Waktu</p>
                                <p className="font-medium">{format(new Date(log.created_at), "dd MMMM yyyy HH:mm:ss", { locale: localeId })}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">User</p>
                                <p className="font-medium">{log.user?.full_name || log.user_email || "-"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Role</p>
                                <p className="font-medium capitalize">{log.user_role || "-"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Record ID</p>
                                <p className="font-mono text-xs">{log.record_id || "-"}</p>
                            </div>
                        </div>

                        <Separator />

                        {/* Changes/Data Section */}
                        <div>
                            <h4 className="font-medium mb-3">{log.action === "update" ? "Perubahan" : log.action === "create" ? "Data Baru" : "Data Terhapus"}</h4>

                            {log.action === "update" && <DiffView changes={log.changes} />}

                            {log.action === "create" && <DataView data={log.new_data} type="create" />}

                            {log.action === "delete" && <DataView data={log.old_data} type="delete" />}
                        </div>

                        {/* Additional Metadata */}
                        {(log.ip_address || log.user_agent) && (
                            <>
                                <Separator />
                                <div className="text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground mb-2">Informasi Tambahan</p>
                                    {log.ip_address && (
                                        <p>
                                            IP Address: <span className="font-mono">{log.ip_address}</span>
                                        </p>
                                    )}
                                    {log.user_agent && <p className="truncate">User Agent: {log.user_agent}</p>}
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
