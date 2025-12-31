import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, CheckCircle, Sprout, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Production } from "@/types/database";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/dateUtils";
import { useTranslation } from "react-i18next";
import { translateCommodity } from "@/lib/i18n";

interface ProductionsTableProps {
    productions: Production[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onEdit: (production: Production) => void;
    onHarvest: (production: Production) => void;
    onDelete: (production: Production) => void;
    loading?: boolean;
}

const ITEMS_PER_PAGE = 10;

// Status order for sorting (outside component to avoid dependency warning)
const STATUS_ORDER = { planted: 0, growing: 1, harvested: 2 } as const;

type SortField = "commodity" | "land" | "planting_date" | "seed_count" | "harvest_date" | "harvest_yield_kg" | "status" | null;
type SortDirection = "asc" | "desc";

export function ProductionsTable({ productions, selectedIds, onSelectionChange, onEdit, onHarvest, onDelete, loading }: ProductionsTableProps) {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const statusStyles = {
        planted: "bg-secondary text-secondary-foreground",
        growing: "bg-primary/10 text-primary",
        harvested: "bg-primary/20 text-primary",
    };

    // Sort productions
    const sortedProductions = useMemo(() => {
        if (!sortField) return productions;

        return [...productions].sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case "commodity":
                    comparison = a.commodity.localeCompare(b.commodity);
                    break;
                case "land":
                    comparison = (a.land?.name || "").localeCompare(b.land?.name || "");
                    break;
                case "planting_date":
                    comparison = new Date(a.planting_date).getTime() - new Date(b.planting_date).getTime();
                    break;
                case "seed_count":
                    comparison = a.seed_count - b.seed_count;
                    break;
                case "harvest_date": {
                    const aDate = a.harvest_date ? new Date(a.harvest_date).getTime() : 0;
                    const bDate = b.harvest_date ? new Date(b.harvest_date).getTime() : 0;
                    comparison = aDate - bDate;
                    break;
                }
                case "harvest_yield_kg":
                    comparison = (a.harvest_yield_kg || 0) - (b.harvest_yield_kg || 0);
                    break;
                case "status":
                    comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
                    break;
            }

            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [productions, sortField, sortDirection]);

    // Pagination calculations
    const totalPages = Math.ceil(sortedProductions.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedProductions = sortedProductions.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction if same field
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            // New field, start with ascending
            setSortField(field);
            setSortDirection("asc");
        }
        setCurrentPage(1); // Reset to first page when sorting
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
        }
        return sortDirection === "asc" ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />;
    };

    // Get IDs of items on current page
    const currentPageIds = paginatedProductions.map((p) => p.id);
    const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));

    const toggleAll = () => {
        if (allCurrentPageSelected) {
            // Deselect only current page items
            onSelectionChange(selectedIds.filter((id) => !currentPageIds.includes(id)));
        } else {
            // Select current page items (add to existing selection)
            const newSelection = [...new Set([...selectedIds, ...currentPageIds])];
            onSelectionChange(newSelection);
        }
    };

    const toggleOne = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter((i) => i !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (productions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Sprout className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Belum ada produksi tercatat</p>
                <p className="text-sm">Mulai dengan menambahkan produksi pertama Anda</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-12">
                                <Checkbox checked={allCurrentPageSelected && currentPageIds.length > 0} onCheckedChange={toggleAll} />
                            </TableHead>
                            <TableHead className="font-semibold">
                                <button onClick={() => handleSort("commodity")} className="flex items-center hover:text-primary transition-colors">
                                    Komoditas
                                    {getSortIcon("commodity")}
                                </button>
                            </TableHead>
                            <TableHead className="font-semibold hidden md:table-cell">
                                <button onClick={() => handleSort("land")} className="flex items-center hover:text-primary transition-colors">
                                    Lahan
                                    {getSortIcon("land")}
                                </button>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <button onClick={() => handleSort("planting_date")} className="flex items-center hover:text-primary transition-colors">
                                    Tgl Tanam
                                    {getSortIcon("planting_date")}
                                </button>
                            </TableHead>
                            <TableHead className="font-semibold hidden lg:table-cell">
                                <button onClick={() => handleSort("seed_count")} className="flex items-center hover:text-primary transition-colors">
                                    Benih
                                    {getSortIcon("seed_count")}
                                </button>
                            </TableHead>
                            <TableHead className="font-semibold hidden lg:table-cell">
                                <button onClick={() => handleSort("harvest_date")} className="flex items-center hover:text-primary transition-colors">
                                    Tgl Panen
                                    {getSortIcon("harvest_date")}
                                </button>
                            </TableHead>
                            <TableHead className="font-semibold hidden md:table-cell">
                                <button onClick={() => handleSort("harvest_yield_kg")} className="flex items-center hover:text-primary transition-colors">
                                    Hasil (kg)
                                    {getSortIcon("harvest_yield_kg")}
                                </button>
                            </TableHead>
                            <TableHead className="font-semibold">
                                <button onClick={() => handleSort("status")} className="flex items-center hover:text-primary transition-colors">
                                    Status
                                    {getSortIcon("status")}
                                </button>
                            </TableHead>
                            <TableHead className="font-semibold text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedProductions.map((production) => (
                            <TableRow key={production.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <Checkbox checked={selectedIds.includes(production.id)} onCheckedChange={() => toggleOne(production.id)} />
                                </TableCell>
                                <TableCell className="font-medium">{translateCommodity(production.commodity)}</TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground">{production.land?.name || "-"}</TableCell>
                                <TableCell>{formatShortDate(production.planting_date)}</TableCell>
                                <TableCell className="hidden lg:table-cell">{production.seed_count.toLocaleString()}</TableCell>
                                <TableCell className="hidden lg:table-cell">{production.harvest_date ? formatShortDate(production.harvest_date) : "-"}</TableCell>
                                <TableCell className="hidden md:table-cell font-medium">{production.harvest_yield_kg ? `${production.harvest_yield_kg.toLocaleString()} kg` : "-"}</TableCell>
                                <TableCell>
                                    <Badge className={cn(statusStyles[production.status], "capitalize")}>{t(`status.${production.status}`)}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(production)}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            {production.status !== "harvested" && (
                                                <DropdownMenuItem onClick={() => onHarvest(production)}>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Catat Panen
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => onDelete(production)} className="text-destructive focus:text-destructive">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">
                        Menampilkan {startIndex + 1}-{Math.min(endIndex, productions.length)} dari {productions.length} produksi
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((page) => {
                                    // Show first, last, current, and adjacent pages
                                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                                })
                                .map((page, index, arr) => (
                                    <span key={page} className="flex items-center">
                                        {index > 0 && arr[index - 1] !== page - 1 && <span className="px-1 text-muted-foreground">...</span>}
                                        <Button variant={currentPage === page ? "default" : "outline"} size="sm" className="w-8 h-8 p-0" onClick={() => goToPage(page)}>
                                            {page}
                                        </Button>
                                    </span>
                                ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
