import { useState, useMemo } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { AuditLog, AuditAction } from "@/types/database";
import { UserProfile } from "@/types/auth";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface AuditLogTableProps {
    logs: AuditLog[];
    users: UserProfile[];
    isLoading: boolean;
    onViewDetail: (log: AuditLog) => void;
}

const TABLE_NAME_MAP: Record<string, string> = {
    lands: "Lahan",
    productions: "Produksi",
    activities: "Aktivitas",
};

const ACTION_MAP: Record<AuditAction, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    create: { label: "Tambah", variant: "default" },
    update: { label: "Ubah", variant: "secondary" },
    delete: { label: "Hapus", variant: "destructive" },
};

const ITEMS_PER_PAGE = 10;

export function AuditLogTable({ logs, users, isLoading, onViewDetail }: AuditLogTableProps) {
    // Filter states
    const [userFilter, setUserFilter] = useState<string>("all");
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [tableFilter, setTableFilter] = useState<string>("all");
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Apply filters
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            // User filter
            if (userFilter !== "all" && log.user_id !== userFilter) return false;

            // Action filter
            if (actionFilter !== "all" && log.action !== actionFilter) return false;

            // Table filter
            if (tableFilter !== "all" && log.table_name !== tableFilter) return false;

            // Date range filter
            const logDate = new Date(log.created_at);
            if (startDate && logDate < startDate) return false;
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                if (logDate > endOfDay) return false;
            }

            return true;
        });
    }, [logs, userFilter, actionFilter, tableFilter, startDate, endDate]);

    // Paginated logs
    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredLogs, currentPage]);

    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

    // Reset to page 1 when filters change
    const handleFilterChange = () => {
        setCurrentPage(1);
    };

    // Clear all filters
    const clearFilters = () => {
        setUserFilter("all");
        setActionFilter("all");
        setTableFilter("all");
        setStartDate(undefined);
        setEndDate(undefined);
        setCurrentPage(1);
    };

    const hasActiveFilters = userFilter !== "all" || actionFilter !== "all" || tableFilter !== "all" || startDate || endDate;

    // Export to Excel
    const handleExport = () => {
        const exportData = filteredLogs.map((log) => ({
            Waktu: format(new Date(log.created_at), "dd MMM yyyy HH:mm:ss", { locale: localeId }),
            User: log.user_email || "-",
            Role: log.user_role || "-",
            Aksi: ACTION_MAP[log.action]?.label || log.action,
            Tabel: TABLE_NAME_MAP[log.table_name] || log.table_name,
            "Record ID": log.record_id || "-",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Log");

        // Generate filename with current date
        const filename = `audit_log_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`;
        XLSX.writeFile(workbook, filename);
    };

    // Get unique table names from logs
    const tableNames = useMemo(() => {
        const uniqueTables = [...new Set(logs.map((log) => log.table_name))];
        return uniqueTables.sort();
    }, [logs]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Waktu</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Aksi</TableHead>
                                <TableHead>Tabel</TableHead>
                                <TableHead>Record ID</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <Skeleton className="h-4 w-32" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-40" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-6 w-16" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-20" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-8 w-8" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* User Filter */}
                <Select
                    value={userFilter}
                    onValueChange={(value) => {
                        setUserFilter(value);
                        handleFilterChange();
                    }}
                >
                    <SelectTrigger className="bg-white w-[200px]">
                        <SelectValue placeholder="Semua User" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua User</SelectItem>
                        {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                                {user.full_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Action Filter */}
                <Select
                    value={actionFilter}
                    onValueChange={(value) => {
                        setActionFilter(value);
                        handleFilterChange();
                    }}
                >
                    <SelectTrigger className="bg-white w-[140px]">
                        <SelectValue placeholder="Semua Aksi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Aksi</SelectItem>
                        <SelectItem value="create">Tambah</SelectItem>
                        <SelectItem value="update">Ubah</SelectItem>
                        <SelectItem value="delete">Hapus</SelectItem>
                    </SelectContent>
                </Select>

                {/* Table Filter */}
                <Select
                    value={tableFilter}
                    onValueChange={(value) => {
                        setTableFilter(value);
                        handleFilterChange();
                    }}
                >
                    <SelectTrigger className="bg-white w-[140px]">
                        <SelectValue placeholder="Semua Tabel" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Tabel</SelectItem>
                        {tableNames.map((table) => (
                            <SelectItem key={table} value={table}>
                                {TABLE_NAME_MAP[table] || table}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Date Range */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !startDate && !endDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate && endDate
                                ? `${format(startDate, "dd/MM/yy")} - ${format(endDate, "dd/MM/yy")}`
                                : startDate
                                ? `Dari ${format(startDate, "dd/MM/yy")}`
                                : endDate
                                ? `Sampai ${format(endDate, "dd/MM/yy")}`
                                : "Pilih Rentang Tanggal"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex">
                            <div className="p-3 border-r">
                                <p className="text-sm font-medium mb-2">Dari</p>
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={(date) => {
                                        setStartDate(date);
                                        handleFilterChange();
                                    }}
                                    initialFocus
                                />
                            </div>
                            <div className="p-3">
                                <p className="text-sm font-medium mb-2">Sampai</p>
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={(date) => {
                                        setEndDate(date);
                                        handleFilterChange();
                                    }}
                                />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                        <X className="w-4 h-4 mr-1" />
                        Reset Filter
                    </Button>
                )}

                {/* Export Button */}
                <div className="ml-auto">
                    <Button variant="outline" onClick={handleExport} disabled={filteredLogs.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
                Menampilkan {paginatedLogs.length} dari {filteredLogs.length} log
            </p>

            {/* Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Waktu</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Aksi</TableHead>
                            <TableHead>Tabel</TableHead>
                            <TableHead>Record ID</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Tidak ada data audit log yang ditemukan
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-sm">{format(new Date(log.created_at), "dd MMM yyyy HH:mm:ss", { locale: localeId })}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{log.user?.full_name || log.user_email || "-"}</span>
                                            <span className="text-xs text-muted-foreground">{log.user_role || "-"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={ACTION_MAP[log.action]?.variant || "default"}>{ACTION_MAP[log.action]?.label || log.action}</Badge>
                                    </TableCell>
                                    <TableCell>{TABLE_NAME_MAP[log.table_name] || log.table_name}</TableCell>
                                    <TableCell className="font-mono text-xs">{log.record_id?.substring(0, 8) || "-"}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => onViewDetail(log)} title="Lihat Detail">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Halaman {currentPage} dari {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
