/**
 * Conflict Detection Utilities for Season Planning
 * Detects overlapping production schedules on the same land
 */

import { Production, Land } from "@/types/database";

export interface Conflict {
    production: Production;
    type: "overlap" | "adjacent";
    overlapDays: number;
}

export interface DateRange {
    start: Date;
    end: Date;
}

export interface ProductionWithRange extends Production {
    dateRange: DateRange;
}

/**
 * Get the date range for a production (planting to harvest)
 */
export function getProductionDateRange(production: Production): DateRange {
    const start = new Date(production.planting_date);
    let end: Date;

    if (production.harvest_date) {
        end = new Date(production.harvest_date);
    } else if (production.estimated_harvest_date) {
        end = new Date(production.estimated_harvest_date);
    } else {
        // Default to 90 days if no harvest date
        end = new Date(start);
        end.setDate(end.getDate() + 90);
    }

    return { start, end };
}

/**
 * Check if two date ranges overlap
 */
export function doRangesOverlap(range1: DateRange, range2: DateRange): boolean {
    return range1.start <= range2.end && range1.end >= range2.start;
}

/**
 * Calculate the number of overlapping days between two ranges
 */
export function calculateOverlapDays(range1: DateRange, range2: DateRange): number {
    if (!doRangesOverlap(range1, range2)) return 0;

    const overlapStart = range1.start > range2.start ? range1.start : range2.start;
    const overlapEnd = range1.end < range2.end ? range1.end : range2.end;

    const diffTime = overlapEnd.getTime() - overlapStart.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Detect conflicts for a given land and date range
 */
export function detectConflicts(landId: string, startDate: Date, endDate: Date, existingProductions: Production[], excludeProductionId?: string): Conflict[] {
    const newRange: DateRange = { start: startDate, end: endDate };

    return existingProductions
        .filter((p) => p.land_id === landId)
        .filter((p) => (excludeProductionId ? p.id !== excludeProductionId : true))
        .filter((p) => p.status !== "harvested") // Only check active productions
        .map((p) => {
            const existingRange = getProductionDateRange(p);
            const overlapDays = calculateOverlapDays(newRange, existingRange);

            if (overlapDays > 0) {
                return {
                    production: p,
                    type: "overlap",
                    overlapDays,
                } as Conflict;
            }
            return null;
        })
        .filter((conflict): conflict is Conflict => conflict !== null);
}

/**
 * Get all conflicts across all productions for a given set of productions
 */
export function getAllConflicts(productions: Production[]): Map<string, Conflict[]> {
    const conflictsMap = new Map<string, Conflict[]>();

    productions.forEach((production) => {
        if (production.status === "harvested") return;

        const range = getProductionDateRange(production);
        const conflicts = detectConflicts(production.land_id, range.start, range.end, productions, production.id);

        if (conflicts.length > 0) {
            conflictsMap.set(production.id, conflicts);
        }
    });

    return conflictsMap;
}

/**
 * Group productions by land for calendar display
 */
export interface LandProductionGroup {
    land: Land;
    productions: ProductionWithRange[];
    hasConflicts: boolean;
}

export function groupProductionsByLand(productions: Production[], lands: Land[]): LandProductionGroup[] {
    const landMap = new Map<string, Land>();
    lands.forEach((land) => landMap.set(land.id, land));

    const conflictsMap = getAllConflicts(productions);

    const groups = new Map<string, LandProductionGroup>();

    productions.forEach((production) => {
        const land = landMap.get(production.land_id);
        if (!land) return;

        let group = groups.get(land.id);
        if (!group) {
            group = {
                land,
                productions: [],
                hasConflicts: false,
            };
            groups.set(land.id, group);
        }

        group.productions.push({
            ...production,
            dateRange: getProductionDateRange(production),
        });

        if (conflictsMap.has(production.id)) {
            group.hasConflicts = true;
        }
    });

    // Sort productions within each group by start date
    groups.forEach((group) => {
        group.productions.sort((a, b) => a.dateRange.start.getTime() - b.dateRange.start.getTime());
    });

    return Array.from(groups.values()).sort((a, b) => a.land.name.localeCompare(b.land.name));
}

/**
 * Format conflict message for display
 */
export function formatConflictMessage(conflict: Conflict): string {
    const { production, overlapDays } = conflict;
    return `Tumpang tindih ${overlapDays} hari dengan ${production.commodity}`;
}

/**
 * Get months in a year for calendar header
 */
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/**
 * Get the position and width of a production bar in the calendar
 * Returns percentage values for left position and width
 */
export function getProductionBarPosition(dateRange: DateRange, year: number): { left: number; width: number; visible: boolean } {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const totalDays = 365;

    // Check if production is visible in this year
    if (dateRange.end < yearStart || dateRange.start > yearEnd) {
        return { left: 0, width: 0, visible: false };
    }

    // Clamp dates to the year
    const visibleStart = dateRange.start < yearStart ? yearStart : dateRange.start;
    const visibleEnd = dateRange.end > yearEnd ? yearEnd : dateRange.end;

    const startDay = Math.floor((visibleStart.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    const endDay = Math.floor((visibleEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));

    const left = (startDay / totalDays) * 100;
    const width = ((endDay - startDay + 1) / totalDays) * 100;

    return { left, width: Math.max(width, 1), visible: true };
}

/**
 * Get status color for production bar
 */
export function getProductionStatusColor(status: Production["status"]): string {
    switch (status) {
        case "planted":
            return "bg-blue-500";
        case "growing":
            return "bg-green-500";
        case "harvested":
            return "bg-gray-400";
        default:
            return "bg-gray-300";
    }
}
