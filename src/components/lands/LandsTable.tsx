import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, MapPin, Image, Eye } from "lucide-react";
import { Land } from "@/types/database";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { translateCommodity } from "@/lib/i18n";

interface LandsTableProps {
    lands: Land[];
    onEdit: (land: Land) => void;
    onDelete: (land: Land) => void;
    onViewDetails: (land: Land) => void;
    loading?: boolean;
}

export function LandsTable({ lands, onEdit, onDelete, onViewDetails, loading }: LandsTableProps) {
    const { t } = useTranslation();
    const statusStyles = {
        active: "bg-primary/10 text-primary",
        vacant: "bg-muted text-muted-foreground",
        archived: "bg-destructive/10 text-destructive",
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (lands.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Belum ada lahan terdaftar</p>
                <p className="text-sm">Tambahkan lahan pertama Anda untuk memulai</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Nama Lahan</TableHead>
                        <TableHead className="font-semibold">Luas (m²)</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Komoditas</TableHead>
                        <TableHead className="font-semibold hidden lg:table-cell">Lokasi</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lands.map((land) => (
                        <TableRow key={land.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    {land.photos.length > 0 ? (
                                        <img src={land.photos[0]} alt={land.name} className="w-10 h-10 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                            <Image className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-foreground">{land.name}</p>
                                        {land.address && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{land.address}</p>}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="font-medium">{land.area_m2.toLocaleString()}</TableCell>
                            <TableCell className="hidden md:table-cell">
                                <div className="flex flex-wrap gap-1">
                                    {land.commodities.slice(0, 2).map((c) => (
                                        <Badge key={c} variant="secondary" className="text-xs">
                                            {translateCommodity(c === "Lainnya" && land.custom_commodity ? land.custom_commodity : c)}
                                        </Badge>
                                    ))}
                                    {land.commodities.length > 2 && (
                                        <Badge variant="secondary" className="text-xs">
                                            +{land.commodities.length - 2}
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                                {land.latitude && land.longitude ? (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        <span>
                                            {land.latitude.toFixed(4)}, {land.longitude.toFixed(4)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge className={cn(statusStyles[land.status], "capitalize")}>{t(`status.${land.status}`)}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onViewDetails(land)}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            Lihat Detail
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit(land)}>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDelete(land)} className="text-destructive focus:text-destructive">
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
    );
}
