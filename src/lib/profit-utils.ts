/**
 * Profit/Loss utility functions for calculating financial trends
 * Supports monthly, quarterly, and yearly groupings
 */

import { Production } from "@/types/database";

export type PeriodType = "monthly" | "quarterly" | "yearly";

export interface ProfitData {
    period: string; // "Jan 2026", "Q1 2026", "2025"
    periodKey: string; // For sorting: "2026-01", "2026-Q1", "2026"
    revenue: number; // Total penjualan
    cost: number; // Total biaya
    profit: number; // revenue - cost (can be negative = loss)
    profitMargin: number; // (profit / revenue) * 100
    harvestCount: number;
}

/**
 * Get quarter from month (0-indexed)
 */
function getQuarter(month: number): number {
    return Math.floor(month / 3) + 1;
}

/**
 * Format month name in Indonesian
 */
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/**
 * Calculate revenue for a production record
 */
function calculateRevenue(production: Production): number {
    if (!production.harvest_yield_kg || !production.selling_price_per_kg) return 0;
    return production.harvest_yield_kg * production.selling_price_per_kg;
}

/**
 * Group productions by period and calculate profit/loss
 */
export function calculateProfitByPeriod(productions: Production[], periodType: PeriodType): ProfitData[] {
    // Only include harvested productions with harvest_date
    const harvestedProductions = productions.filter((p) => p.status === "harvested" && p.harvest_date);

    const periodMap = new Map<string, ProfitData>();

    harvestedProductions.forEach((p) => {
        const date = new Date(p.harvest_date!);
        const year = date.getFullYear();
        const month = date.getMonth();

        let periodKey: string;
        let period: string;

        switch (periodType) {
            case "monthly":
                periodKey = `${year}-${String(month + 1).padStart(2, "0")}`;
                period = `${MONTH_NAMES[month]} ${year}`;
                break;
            case "quarterly": {
                const quarter = getQuarter(month);
                periodKey = `${year}-Q${quarter}`;
                period = `Q${quarter} ${year}`;
                break;
            }
            case "yearly":
                periodKey = `${year}`;
                period = `${year}`;
                break;
        }

        const revenue = calculateRevenue(p);
        const cost = p.total_cost || 0;
        const profit = revenue - cost;

        const existing = periodMap.get(periodKey);
        if (existing) {
            existing.revenue += revenue;
            existing.cost += cost;
            existing.profit += profit;
            existing.harvestCount += 1;
        } else {
            periodMap.set(periodKey, {
                period,
                periodKey,
                revenue,
                cost,
                profit,
                profitMargin: 0, // Will be calculated later
                harvestCount: 1,
            });
        }
    });

    // Calculate profit margin and sort by period
    const results = Array.from(periodMap.values());
    results.forEach((data) => {
        data.profitMargin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
    });

    return results.sort((a, b) => a.periodKey.localeCompare(b.periodKey));
}

/**
 * Get summary statistics for profit/loss data
 */
export interface ProfitSummary {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    avgProfitMargin: number;
    profitPeriods: number; // Periods with profit
    lossPeriods: number; // Periods with loss
    bestPeriod: ProfitData | null;
    worstPeriod: ProfitData | null;
}

export function getProfitSummary(profitData: ProfitData[]): ProfitSummary {
    if (profitData.length === 0) {
        return {
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            avgProfitMargin: 0,
            profitPeriods: 0,
            lossPeriods: 0,
            bestPeriod: null,
            worstPeriod: null,
        };
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let profitPeriods = 0;
    let lossPeriods = 0;

    profitData.forEach((data) => {
        totalRevenue += data.revenue;
        totalCost += data.cost;
        if (data.profit >= 0) {
            profitPeriods++;
        } else {
            lossPeriods++;
        }
    });

    const totalProfit = totalRevenue - totalCost;
    const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Find best and worst periods
    const sorted = [...profitData].sort((a, b) => b.profit - a.profit);
    const bestPeriod = sorted[0] || null;
    const worstPeriod = sorted[sorted.length - 1] || null;

    return {
        totalRevenue,
        totalCost,
        totalProfit,
        avgProfitMargin,
        profitPeriods,
        lossPeriods,
        bestPeriod,
        worstPeriod,
    };
}

/**
 * Format currency (IDR)
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value / 100);
}
