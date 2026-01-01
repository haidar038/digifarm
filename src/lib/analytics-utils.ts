import { Production, Land } from "@/types/database";

// Types for analytics data
export interface LandProductivity {
    landId: string;
    landName: string;
    totalYield: number;
    area: number;
    productivity: number; // kg per m²
    harvestCount: number;
}

export interface CommodityStats {
    commodity: string;
    totalYield: number;
    totalRevenue: number;
    totalCost: number;
    profit: number;
    harvestCount: number;
    avgYieldPerHarvest: number;
}

export interface MonthlyStats {
    month: string;
    year: number;
    yield: number;
    revenue: number;
    cost: number;
    harvestCount: number;
}

export interface AnalyticsSummary {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    totalYield: number;
    avgProductivity: number; // kg per m²
    bestLand: LandProductivity | null;
    mostProfitableCommodity: CommodityStats | null;
    harvestCount: number;
}

/**
 * Calculate revenue for a production record
 */
export function calculateRevenue(production: Production): number {
    if (!production.harvest_yield_kg || !production.selling_price_per_kg) return 0;
    return production.harvest_yield_kg * production.selling_price_per_kg;
}

/**
 * Calculate profit for a production record
 */
export function calculateProfit(production: Production): number {
    const revenue = calculateRevenue(production);
    const cost = production.total_cost || 0;
    return revenue - cost;
}

/**
 * Get productivity stats per land
 */
export function getLandProductivity(productions: Production[], lands: Land[]): LandProductivity[] {
    const harvestedProductions = productions.filter((p) => p.status === "harvested" && p.harvest_yield_kg);

    const landMap = new Map<string, Land>();
    lands.forEach((land) => landMap.set(land.id, land));

    const productivityMap = new Map<string, LandProductivity>();

    harvestedProductions.forEach((p) => {
        const land = landMap.get(p.land_id);
        if (!land) return;

        const existing = productivityMap.get(p.land_id);
        if (existing) {
            existing.totalYield += p.harvest_yield_kg || 0;
            existing.harvestCount += 1;
        } else {
            productivityMap.set(p.land_id, {
                landId: p.land_id,
                landName: land.name,
                totalYield: p.harvest_yield_kg || 0,
                area: land.area_m2,
                productivity: 0,
                harvestCount: 1,
            });
        }
    });

    // Calculate productivity (kg/m²)
    const results = Array.from(productivityMap.values());
    results.forEach((lp) => {
        lp.productivity = lp.area > 0 ? lp.totalYield / lp.area : 0;
    });

    return results.sort((a, b) => b.productivity - a.productivity);
}

/**
 * Get stats per commodity
 */
export function getCommodityStats(productions: Production[]): CommodityStats[] {
    const harvestedProductions = productions.filter((p) => p.status === "harvested");

    const statsMap = new Map<string, CommodityStats>();

    harvestedProductions.forEach((p) => {
        const revenue = calculateRevenue(p);
        const cost = p.total_cost || 0;

        const existing = statsMap.get(p.commodity);
        if (existing) {
            existing.totalYield += p.harvest_yield_kg || 0;
            existing.totalRevenue += revenue;
            existing.totalCost += cost;
            existing.profit += revenue - cost;
            existing.harvestCount += 1;
        } else {
            statsMap.set(p.commodity, {
                commodity: p.commodity,
                totalYield: p.harvest_yield_kg || 0,
                totalRevenue: revenue,
                totalCost: cost,
                profit: revenue - cost,
                harvestCount: 1,
                avgYieldPerHarvest: 0,
            });
        }
    });

    const results = Array.from(statsMap.values());
    results.forEach((cs) => {
        cs.avgYieldPerHarvest = cs.harvestCount > 0 ? cs.totalYield / cs.harvestCount : 0;
    });

    return results.sort((a, b) => b.profit - a.profit);
}

/**
 * Get monthly stats
 */
export function getMonthlyStats(productions: Production[]): MonthlyStats[] {
    const harvestedProductions = productions.filter((p) => p.status === "harvested" && p.harvest_date);

    const statsMap = new Map<string, MonthlyStats>();

    harvestedProductions.forEach((p) => {
        const date = new Date(p.harvest_date!);
        const month = date.toLocaleString("id-ID", { month: "short" });
        const year = date.getFullYear();
        const key = `${year}-${date.getMonth()}`;

        const revenue = calculateRevenue(p);
        const cost = p.total_cost || 0;

        const existing = statsMap.get(key);
        if (existing) {
            existing.yield += p.harvest_yield_kg || 0;
            existing.revenue += revenue;
            existing.cost += cost;
            existing.harvestCount += 1;
        } else {
            statsMap.set(key, {
                month,
                year,
                yield: p.harvest_yield_kg || 0,
                revenue,
                cost,
                harvestCount: 1,
            });
        }
    });

    return Array.from(statsMap.values()).sort((a, b) => a.year - b.year || a.month.localeCompare(b.month));
}

/**
 * Get overall analytics summary
 */
export function getAnalyticsSummary(productions: Production[], lands: Land[]): AnalyticsSummary {
    const harvestedProductions = productions.filter((p) => p.status === "harvested");

    let totalRevenue = 0;
    let totalCost = 0;
    let totalYield = 0;

    harvestedProductions.forEach((p) => {
        totalRevenue += calculateRevenue(p);
        totalCost += p.total_cost || 0;
        totalYield += p.harvest_yield_kg || 0;
    });

    const landProductivity = getLandProductivity(productions, lands);
    const commodityStats = getCommodityStats(productions);

    const totalArea = lands.filter((l) => l.status === "active").reduce((sum, l) => sum + l.area_m2, 0);

    return {
        totalRevenue,
        totalCost,
        totalProfit: totalRevenue - totalCost,
        totalYield,
        avgProductivity: totalArea > 0 ? totalYield / totalArea : 0,
        bestLand: landProductivity[0] || null,
        mostProfitableCommodity: commodityStats[0] || null,
        harvestCount: harvestedProductions.length,
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
 * Format number with thousand separator
 */
export function formatNumber(value: number, decimals = 1): string {
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(value);
}
