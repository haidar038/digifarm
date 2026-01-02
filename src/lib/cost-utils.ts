/**
 * Cost and Revenue tracking utilities
 * Pure functions for calculating profit, ROI, and smart defaults
 */

import { Production } from "@/types/database";

/**
 * Calculate revenue from harvest
 */
export function calculateRevenue(harvestYieldKg: number | null, sellingPricePerKg: number | null): number {
    if (!harvestYieldKg || !sellingPricePerKg) return 0;
    return harvestYieldKg * sellingPricePerKg;
}

/**
 * Calculate profit/loss
 */
export function calculateProfit(revenue: number, totalCost: number | null): number {
    if (!totalCost) return revenue;
    return revenue - totalCost;
}

/**
 * Calculate Return on Investment (ROI) as percentage
 */
export function calculateROI(profit: number, totalCost: number | null): number {
    if (!totalCost || totalCost === 0) return 0;
    return (profit / totalCost) * 100;
}

/**
 * Get profit status
 */
export function getProfitStatus(profit: number): "profit" | "loss" | "neutral" {
    if (profit > 0) return "profit";
    if (profit < 0) return "loss";
    return "neutral";
}

/**
 * Format number as Indonesian Rupiah currency
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format currency in compact form (e.g., Rp 1,5 jt)
 */
export function formatCurrencyCompact(amount: number): string {
    if (Math.abs(amount) >= 1000000) {
        return `Rp ${(amount / 1000000).toFixed(1).replace(".", ",")} jt`;
    }
    if (Math.abs(amount) >= 1000) {
        return `Rp ${(amount / 1000).toFixed(0)} rb`;
    }
    return formatCurrency(amount);
}

/**
 * Default cost estimates per commodity (in IDR)
 * Based on typical farming costs in Indonesia
 */
export const DEFAULT_COST_ESTIMATES: Record<string, number> = {
    "Cabai Merah": 500000,
    "Cabai Rawit": 400000,
    Tomat: 350000,
    "Bawang Merah": 600000,
    "Bawang Putih": 550000,
    Lainnya: 400000,
};

/**
 * Default selling price per kg estimates (in IDR)
 * Based on typical market prices in Indonesia
 */
export const DEFAULT_PRICE_ESTIMATES: Record<string, number> = {
    "Cabai Merah": 35000,
    "Cabai Rawit": 50000,
    Tomat: 15000,
    "Bawang Merah": 25000,
    "Bawang Putih": 40000,
    Lainnya: 20000,
};

/**
 * Get smart default cost based on commodity history or default estimate
 */
export function getSmartCostDefault(commodity: string, historicalProductions: Production[]): { value: number; source: "history" | "estimate" } {
    // Filter productions with cost data for the same commodity
    const withCosts = historicalProductions.filter((p) => p.commodity === commodity && p.total_cost !== null && p.total_cost > 0);

    if (withCosts.length > 0) {
        // Calculate average from history
        const totalCost = withCosts.reduce((sum, p) => sum + (p.total_cost || 0), 0);
        const avgCost = Math.round(totalCost / withCosts.length);
        return { value: avgCost, source: "history" };
    }

    // Fall back to default estimates
    const estimate = DEFAULT_COST_ESTIMATES[commodity] || DEFAULT_COST_ESTIMATES["Lainnya"];
    return { value: estimate, source: "estimate" };
}

/**
 * Get smart default price based on commodity history or default estimate
 */
export function getSmartPriceDefault(commodity: string, historicalProductions: Production[]): { value: number; source: "history" | "estimate" } {
    // Filter productions with price data for the same commodity
    const withPrices = historicalProductions.filter((p) => p.commodity === commodity && p.selling_price_per_kg !== null && p.selling_price_per_kg > 0);

    if (withPrices.length > 0) {
        // Calculate average from history
        const totalPrice = withPrices.reduce((sum, p) => sum + (p.selling_price_per_kg || 0), 0);
        const avgPrice = Math.round(totalPrice / withPrices.length);
        return { value: avgPrice, source: "history" };
    }

    // Fall back to default estimates
    const estimate = DEFAULT_PRICE_ESTIMATES[commodity] || DEFAULT_PRICE_ESTIMATES["Lainnya"];
    return { value: estimate, source: "estimate" };
}

/**
 * Calculate complete financial summary for a production
 */
export function calculateFinancialSummary(production: Production): {
    revenue: number;
    cost: number;
    profit: number;
    roi: number;
    status: "profit" | "loss" | "neutral";
    hasData: boolean;
} {
    const revenue = calculateRevenue(production.harvest_yield_kg, production.selling_price_per_kg);
    const cost = production.total_cost || 0;
    const profit = calculateProfit(revenue, production.total_cost);
    const roi = calculateROI(profit, production.total_cost);
    const status = getProfitStatus(profit);
    const hasData = production.total_cost !== null || production.selling_price_per_kg !== null;

    return { revenue, cost, profit, roi, status, hasData };
}
