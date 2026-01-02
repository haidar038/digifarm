/**
 * Season Calendar Component
 * Gantt-chart style timeline visualization for production schedules
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, MapPin } from "lucide-react";
import { Production, Land } from "@/types/database";
import { groupProductionsByLand, getProductionBarPosition, getProductionStatusColor, getAllConflicts, MONTHS, LandProductionGroup, ProductionWithRange } from "@/lib/conflict-utils";
import { translateCommodity } from "@/lib/i18n";
import { formatDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

interface SeasonCalendarProps {
    productions: Production[];
    lands: Land[];
    onProductionClick?: (production: Production) => void;
}

export function SeasonCalendar({ productions, lands, onProductionClick }: SeasonCalendarProps) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    // Group productions by land
    const landGroups = useMemo(() => groupProductionsByLand(productions, lands), [productions, lands]);

    // Get all conflicts
    const conflictsMap = useMemo(() => getAllConflicts(productions), [productions]);

    // Available years (current year ± 2)
    const availableYears = useMemo(() => {
        const years = [];
        for (let y = currentYear - 2; y <= currentYear + 2; y++) {
            years.push(y);
        }
        return years;
    }, [currentYear]);

    const handlePrevYear = () => setSelectedYear((y) => y - 1);
    const handleNextYear = () => setSelectedYear((y) => y + 1);

    // Filter groups to only show those with productions in the selected year
    const visibleGroups = useMemo(() => {
        return landGroups.filter((group) =>
            group.productions.some((p) => {
                const pos = getProductionBarPosition(p.dateRange, selectedYear);
                return pos.visible;
            })
        );
    }, [landGroups, selectedYear]);

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Kalender Musim Tanam
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrevYear}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableYears.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={handleNextYear}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Month Headers */}
                <div className="flex border-b mb-2">
                    <div className="w-40 shrink-0 px-2 py-1 text-sm font-medium text-muted-foreground">Lahan</div>
                    <div className="flex-1 flex">
                        {MONTHS.map((month, index) => (
                            <div key={month} className={cn("flex-1 text-center text-xs font-medium py-1 border-l", index === new Date().getMonth() && selectedYear === currentYear && "bg-primary/10 text-primary")}>
                                {month}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Calendar Rows */}
                {visibleGroups.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Tidak ada produksi pada tahun {selectedYear}</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {visibleGroups.map((group) => (
                            <CalendarRow key={group.land.id} group={group} year={selectedYear} conflictsMap={conflictsMap} onProductionClick={onProductionClick} />
                        ))}
                    </div>
                )}

                {/* Legend */}
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span>Ditanam</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span>Tumbuh</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gray-400" />
                        <span>Dipanen</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500/30 border-2 border-red-500" />
                        <span>Konflik</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface CalendarRowProps {
    group: LandProductionGroup;
    year: number;
    conflictsMap: Map<string, import("@/lib/conflict-utils").Conflict[]>;
    onProductionClick?: (production: Production) => void;
}

function CalendarRow({ group, year, conflictsMap, onProductionClick }: CalendarRowProps) {
    return (
        <div className="flex items-stretch min-h-[40px] border-b last:border-b-0">
            {/* Land Name */}
            <div className="w-40 shrink-0 px-2 py-2 flex items-center gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate" title={group.land.name}>
                    {group.land.name}
                </span>
                {group.hasConflicts && <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />}
            </div>

            {/* Timeline */}
            <div className="flex-1 relative">
                {/* Month grid lines */}
                <div className="absolute inset-0 flex">
                    {MONTHS.map((_, idx) => (
                        <div key={idx} className="flex-1 border-l border-dashed border-gray-200" />
                    ))}
                </div>

                {/* Production bars */}
                {group.productions.map((production) => (
                    <ProductionBar key={production.id} production={production} year={year} hasConflict={conflictsMap.has(production.id)} onClick={onProductionClick} />
                ))}
            </div>
        </div>
    );
}

interface ProductionBarProps {
    production: ProductionWithRange;
    year: number;
    hasConflict: boolean;
    onClick?: (production: Production) => void;
}

function ProductionBar({ production, year, hasConflict, onClick }: ProductionBarProps) {
    const position = getProductionBarPosition(production.dateRange, year);

    if (!position.visible) return null;

    const statusColor = getProductionStatusColor(production.status);
    const commodityName = translateCommodity(production.commodity);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        className={cn(
                            "absolute top-1 h-[calc(100%-8px)] rounded-md text-white text-xs font-medium px-2 truncate transition-all hover:opacity-80",
                            statusColor,
                            hasConflict && "ring-2 ring-red-500 ring-offset-1",
                            onClick && "cursor-pointer"
                        )}
                        style={{
                            left: `${position.left}%`,
                            width: `${position.width}%`,
                            minWidth: "30px",
                        }}
                        onClick={() => onClick?.(production)}
                    >
                        {commodityName}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                    <div className="space-y-1">
                        <p className="font-medium">{commodityName}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDate(production.dateRange.start, "d MMM yyyy")} - {formatDate(production.dateRange.end, "d MMM yyyy")}
                        </p>
                        <p className="text-xs capitalize">{production.status}</p>
                        {hasConflict && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Terdapat konflik jadwal
                            </p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
