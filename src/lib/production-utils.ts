/**
 * Production data utilities for chart processing and data transformation
 * These functions are extracted from components for better testability
 */

import { Production } from "@/types/database";

export interface BarChartDataItem {
    period: string;
    [commodity: string]: string | number;
}

export interface PieChartDataItem {
    name: string;
    value: number;
}

export interface CalendarEvent {
    id: string;
    date: string;
    commodity: string;
    type: "harvest" | "planting";
    status: string;
}

/**
 * Filters productions to only include harvested ones
 */
export function getHarvestedProductions(productions: Production[]): Production[] {
    return productions.filter((p) => p.status === "harvested");
}

/**
 * Gets unique commodities from a list of productions
 */
export function getUniqueCommodities(productions: Production[]): string[] {
    return [...new Set(productions.map((p) => p.commodity))];
}

/**
 * Transforms production data into bar chart format
 * Groups by period (Month Year) and aggregates harvest yield by commodity
 */
export function transformToBarChartData(productions: Production[], maxPeriods: number = 6): BarChartDataItem[] {
    const harvestedProductions = getHarvestedProductions(productions);
    const commodities = getUniqueCommodities(harvestedProductions);

    return harvestedProductions
        .reduce((acc, p) => {
            const year = new Date(p.planting_date).getFullYear();
            const month = new Date(p.planting_date).toLocaleString("default", {
                month: "short",
            });
            const period = `${month} ${year}`;

            const existing = acc.find((d) => d.period === period);
            if (existing) {
                existing[p.commodity] = ((existing[p.commodity] as number) || 0) + (p.harvest_yield_kg || 0);
            } else {
                const newEntry: BarChartDataItem = { period };
                commodities.forEach((c) => (newEntry[c] = 0));
                newEntry[p.commodity] = p.harvest_yield_kg || 0;
                acc.push(newEntry);
            }
            return acc;
        }, [] as BarChartDataItem[])
        .slice(-maxPeriods);
}

/**
 * Transforms production data into pie chart format
 * Aggregates total harvest yield by commodity
 */
export function transformToPieChartData(productions: Production[]): PieChartDataItem[] {
    const harvestedProductions = getHarvestedProductions(productions);

    return harvestedProductions.reduce((acc, p) => {
        const existing = acc.find((d) => d.name === p.commodity);
        if (existing) {
            existing.value += p.harvest_yield_kg || 0;
        } else {
            acc.push({ name: p.commodity, value: p.harvest_yield_kg || 0 });
        }
        return acc;
    }, [] as PieChartDataItem[]);
}

/**
 * Calculates total harvest yield for a list of productions
 */
export function calculateTotalYield(productions: Production[]): number {
    return getHarvestedProductions(productions).reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0);
}

/**
 * Calculates average yield per production
 */
export function calculateAverageYield(productions: Production[]): number {
    const harvested = getHarvestedProductions(productions);
    if (harvested.length === 0) return 0;
    return calculateTotalYield(productions) / harvested.length;
}

/**
 * Groups productions by status and returns counts
 */
export function getProductionStatusCounts(productions: Production[]): Record<string, number> {
    return productions.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}

/**
 * Filters calendar events within a date range
 */
export function filterEventsInDateRange(productions: Production[], startDate: Date, endDate: Date): { harvestEvents: CalendarEvent[]; plantingEvents: CalendarEvent[] } {
    const isWithinRange = (date: Date): boolean => {
        return date >= startDate && date <= endDate;
    };

    const harvestEvents: CalendarEvent[] = productions
        .filter((p) => {
            if (p.status === "harvested") return false;
            if (!p.estimated_harvest_date) return false;
            return isWithinRange(new Date(p.estimated_harvest_date));
        })
        .map((p) => ({
            id: p.id,
            date: p.estimated_harvest_date!,
            commodity: p.commodity,
            type: "harvest" as const,
            status: p.status,
        }));

    const plantingEvents: CalendarEvent[] = productions
        .filter((p) => {
            if (p.status === "harvested") return false;
            return isWithinRange(new Date(p.planting_date));
        })
        .map((p) => ({
            id: p.id,
            date: p.planting_date,
            commodity: p.commodity,
            type: "planting" as const,
            status: p.status,
        }));

    return { harvestEvents, plantingEvents };
}

/**
 * Sorts and limits calendar events by date
 */
export function getUpcomingEvents(harvestEvents: CalendarEvent[], plantingEvents: CalendarEvent[], limit: number = 5): CalendarEvent[] {
    return [...harvestEvents, ...plantingEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, limit);
}

/**
 * Validates harvest form data
 */
export function validateHarvestData(data: { harvest_date: string; harvest_yield_kg: number }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.harvest_date || data.harvest_date.trim() === "") {
        errors.push("Harvest date is required");
    }

    if (data.harvest_yield_kg <= 0) {
        errors.push("Harvest yield must be greater than 0");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Formats area from square meters to display string
 */
export function formatArea(areaM2: number): string {
    if (areaM2 >= 10000) {
        return `${(areaM2 / 10000).toFixed(2)} ha`;
    }
    return `${areaM2.toLocaleString()} m²`;
}

/**
 * Calculates production efficiency (yield per seed)
 */
export function calculateEfficiency(harvestYieldKg: number | null, seedCount: number): number {
    if (!harvestYieldKg || seedCount === 0) return 0;
    return harvestYieldKg / seedCount;
}
