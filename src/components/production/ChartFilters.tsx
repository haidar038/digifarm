import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { Land, COMMODITIES } from "@/types/database";

export interface ChartFilterValues {
    landId: string;
    commodity: string;
    startDate: string;
    endDate: string;
}

interface ChartFiltersProps {
    lands: Land[];
    filters: ChartFilterValues;
    onFiltersChange: (filters: ChartFilterValues) => void;
}

export function ChartFilters({ lands, filters, onFiltersChange }: ChartFiltersProps) {
    const handleChange = (field: keyof ChartFilterValues, value: string) => {
        onFiltersChange({
            ...filters,
            [field]: value,
        });
    };

    const handleClear = () => {
        onFiltersChange({
            landId: "",
            commodity: "",
            startDate: "",
            endDate: "",
        });
    };

    const hasActiveFilters = filters.landId || filters.commodity || filters.startDate || filters.endDate;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter Grafik
                    </CardTitle>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 px-2 text-muted-foreground">
                            <X className="w-4 h-4 mr-1" />
                            Hapus
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Land Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="land-filter">Lahan</Label>
                        <Select value={filters.landId} onValueChange={(value) => handleChange("landId", value)}>
                            <SelectTrigger id="land-filter">
                                <SelectValue placeholder="Semua Lahan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Lahan</SelectItem>
                                {lands.map((land) => (
                                    <SelectItem key={land.id} value={land.id}>
                                        {land.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Commodity Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="commodity-filter">Komoditas</Label>
                        <Select value={filters.commodity} onValueChange={(value) => handleChange("commodity", value)}>
                            <SelectTrigger id="commodity-filter">
                                <SelectValue placeholder="Semua Komoditas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Komoditas</SelectItem>
                                {COMMODITIES.map((commodity) => (
                                    <SelectItem key={commodity} value={commodity}>
                                        {commodity}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Start Date Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="start-date">Tanggal Mulai</Label>
                        <Input id="start-date" type="date" value={filters.startDate} onChange={(e) => handleChange("startDate", e.target.value)} />
                    </div>

                    {/* End Date Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="end-date">Tanggal Akhir</Label>
                        <Input id="end-date" type="date" value={filters.endDate} onChange={(e) => handleChange("endDate", e.target.value)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
