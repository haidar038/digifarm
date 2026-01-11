import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Filter, Check } from "lucide-react";
import { COMMODITY_CATEGORIES, ALL_COMMODITIES, type CommodityFilter as FilterType } from "@/constants/commodities";

interface CommodityFilterProps {
    filter: FilterType;
    onChange: (filter: FilterType) => void;
}

/**
 * Filter dropdown for selecting commodities to display
 */
export function CommodityFilter({ filter, onChange }: CommodityFilterProps) {
    const selectedCount = filter.commodityIds.length;
    const totalCount = ALL_COMMODITIES.length;

    const handleCategoryChange = (categoryKey: string) => {
        if (categoryKey === "all") {
            // Select all commodities
            onChange({
                categoryKey: "all",
                commodityIds: ALL_COMMODITIES.map((c) => c.id),
            });
        } else {
            // Select only commodities from specific category
            const category = COMMODITY_CATEGORIES.find((c) => c.key === categoryKey);
            if (category) {
                onChange({
                    categoryKey,
                    commodityIds: category.items.map((c) => c.id),
                });
            }
        }
    };

    const handleCommodityToggle = (commodityId: string) => {
        const isSelected = filter.commodityIds.includes(commodityId);
        let newIds: string[];

        if (isSelected) {
            // Remove commodity (but keep at least one)
            newIds = filter.commodityIds.filter((id) => id !== commodityId);
            if (newIds.length === 0) {
                newIds = [commodityId]; // Keep at least one selected
            }
        } else {
            // Add commodity
            newIds = [...filter.commodityIds, commodityId];
        }

        onChange({
            categoryKey: newIds.length === totalCount ? "all" : "custom",
            commodityIds: newIds,
        });
    };

    const handleSelectAll = () => {
        onChange({
            categoryKey: "all",
            commodityIds: ALL_COMMODITIES.map((c) => c.id),
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filter Komoditas
                    {selectedCount < totalCount && (
                        <Badge variant="secondary" className="ml-1">
                            {selectedCount}/{totalCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Pilih Komoditas</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Select All Option */}
                <DropdownMenuCheckboxItem checked={selectedCount === totalCount} onCheckedChange={handleSelectAll}>
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Pilih Semua
                    </div>
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                {/* Category-based selection */}
                {COMMODITY_CATEGORIES.map((category) => (
                    <div key={category.key}>
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">{category.label}</DropdownMenuLabel>
                        {category.items.map((commodity) => (
                            <DropdownMenuCheckboxItem key={commodity.id} checked={filter.commodityIds.includes(commodity.id)} onCheckedChange={() => handleCommodityToggle(commodity.id)}>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: commodity.color }} />
                                    {commodity.name}
                                </div>
                            </DropdownMenuCheckboxItem>
                        ))}
                    </div>
                ))}

                <DropdownMenuSeparator />

                {/* Quick category filters */}
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Filter Cepat</DropdownMenuLabel>
                {COMMODITY_CATEGORIES.map((category) => (
                    <DropdownMenuCheckboxItem key={`quick-${category.key}`} checked={filter.categoryKey === category.key && filter.commodityIds.length === category.items.length} onCheckedChange={() => handleCategoryChange(category.key)}>
                        Hanya {category.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
