import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Eye, Edit, MapPin, Loader2 } from "lucide-react";
import type { FarmerWithStats } from "@/types/database";

interface FarmerTableProps {
    farmers: FarmerWithStats[];
    loading?: boolean;
    showActions?: boolean;
}

export function FarmerTable({ farmers, loading, showActions = true }: FarmerTableProps) {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    const filteredFarmers = farmers.filter(
        (farmer) => farmer.full_name.toLowerCase().includes(search.toLowerCase()) || farmer.province_name?.toLowerCase().includes(search.toLowerCase()) || farmer.regency_name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (farmers.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Belum ada petani yang terhubung</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari petani atau lokasi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Petani</TableHead>
                            <TableHead>Lokasi</TableHead>
                            <TableHead className="text-center">Lahan</TableHead>
                            <TableHead className="text-center">Produksi</TableHead>
                            <TableHead className="text-right">Total Panen</TableHead>
                            <TableHead className="text-right">Produktivitas</TableHead>
                            {showActions && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredFarmers.map((farmer) => {
                            const productivity = farmer.total_area_m2 > 0 ? (farmer.total_yield / farmer.total_area_m2).toFixed(2) : "0.00";

                            return (
                                <TableRow key={farmer.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{farmer.full_name}</span>
                                            {farmer.phone && <span className="text-xs text-muted-foreground">{farmer.phone}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            <span>{farmer.regency_name || farmer.province_name || "-"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{farmer.land_count}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <Badge variant={farmer.active_production_count > 0 ? "default" : "secondary"}>{farmer.active_production_count} aktif</Badge>
                                            <span className="text-xs text-muted-foreground">{farmer.production_count} total</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{farmer.total_yield.toLocaleString("id-ID")} kg</TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-muted-foreground">{productivity} kg/m²</span>
                                    </TableCell>
                                    {showActions && (
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => navigate(`/manager/farmers/${farmer.id}`)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Lihat Detail
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => navigate(`/manager/farmers/${farmer.id}?action=manage`)}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Kelola Data
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {filteredFarmers.length === 0 && farmers.length > 0 && <p className="text-center text-muted-foreground py-4">Tidak ada petani yang cocok dengan pencarian "{search}"</p>}
        </div>
    );
}
