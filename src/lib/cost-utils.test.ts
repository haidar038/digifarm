import { describe, it, expect } from "vitest";
import {
    calculateRevenue,
    calculateProfit,
    calculateROI,
    getProfitStatus,
    formatCurrency,
    formatCurrencyCompact,
    getSmartCostDefault,
    getSmartPriceDefault,
    calculateFinancialSummary,
    DEFAULT_COST_ESTIMATES,
    DEFAULT_PRICE_ESTIMATES,
} from "@/lib/cost-utils";
import { Production } from "@/types/database";

// Helper function to create mock production
function createMockProduction(overrides: Partial<Production> = {}): Production {
    return {
        id: overrides.id || "prod-1",
        user_id: overrides.user_id || "user-1",
        land_id: overrides.land_id || "land-1",
        commodity: overrides.commodity || "Red Chili",
        planting_date: overrides.planting_date || "2024-01-15",
        seed_count: overrides.seed_count ?? 100,
        estimated_harvest_date: overrides.estimated_harvest_date ?? "2024-04-15",
        harvest_date: overrides.harvest_date || null,
        harvest_yield_kg: overrides.harvest_yield_kg ?? null,
        status: overrides.status || "planted",
        notes: overrides.notes || null,
        total_cost: overrides.total_cost ?? null,
        selling_price_per_kg: overrides.selling_price_per_kg ?? null,
        created_at: overrides.created_at || "2024-01-15T00:00:00Z",
        updated_at: overrides.updated_at || "2024-01-15T00:00:00Z",
        // Audit trail fields
        created_by: overrides.created_by || null,
        updated_by: overrides.updated_by || null,
    };
}

describe("calculateRevenue", () => {
    it("should calculate revenue correctly", () => {
        expect(calculateRevenue(50, 35000)).toBe(1750000);
        expect(calculateRevenue(100, 50000)).toBe(5000000);
    });

    it("should return 0 for null harvest yield", () => {
        expect(calculateRevenue(null, 35000)).toBe(0);
    });

    it("should return 0 for null selling price", () => {
        expect(calculateRevenue(50, null)).toBe(0);
    });

    it("should return 0 for both null", () => {
        expect(calculateRevenue(null, null)).toBe(0);
    });
});

describe("calculateProfit", () => {
    it("should calculate profit correctly", () => {
        expect(calculateProfit(1000000, 500000)).toBe(500000);
    });

    it("should calculate loss correctly", () => {
        expect(calculateProfit(300000, 500000)).toBe(-200000);
    });

    it("should return revenue when cost is null", () => {
        expect(calculateProfit(1000000, null)).toBe(1000000);
    });

    it("should handle zero cost", () => {
        expect(calculateProfit(1000000, 0)).toBe(1000000);
    });
});

describe("calculateROI", () => {
    it("should calculate positive ROI correctly", () => {
        // Profit 500000 on cost 500000 = 100% ROI
        expect(calculateROI(500000, 500000)).toBe(100);
    });

    it("should calculate negative ROI correctly", () => {
        // Loss -200000 on cost 500000 = -40% ROI
        expect(calculateROI(-200000, 500000)).toBe(-40);
    });

    it("should return 0 for null cost", () => {
        expect(calculateROI(500000, null)).toBe(0);
    });

    it("should return 0 for zero cost", () => {
        expect(calculateROI(500000, 0)).toBe(0);
    });
});

describe("getProfitStatus", () => {
    it("should return profit for positive value", () => {
        expect(getProfitStatus(100000)).toBe("profit");
    });

    it("should return loss for negative value", () => {
        expect(getProfitStatus(-100000)).toBe("loss");
    });

    it("should return neutral for zero", () => {
        expect(getProfitStatus(0)).toBe("neutral");
    });
});

describe("formatCurrency", () => {
    it("should format positive numbers correctly", () => {
        const result = formatCurrency(1500000);
        expect(result).toContain("1.500.000");
        expect(result).toContain("Rp");
    });

    it("should format negative numbers correctly", () => {
        const result = formatCurrency(-500000);
        expect(result).toContain("500.000");
    });

    it("should format zero correctly", () => {
        const result = formatCurrency(0);
        expect(result).toContain("0");
    });
});

describe("formatCurrencyCompact", () => {
    it("should format millions as jt", () => {
        expect(formatCurrencyCompact(1500000)).toBe("Rp 1,5 jt");
        expect(formatCurrencyCompact(2000000)).toBe("Rp 2,0 jt");
    });

    it("should format thousands as rb", () => {
        expect(formatCurrencyCompact(500000)).toBe("Rp 500 rb");
        expect(formatCurrencyCompact(750000)).toBe("Rp 750 rb");
    });

    it("should format small numbers normally", () => {
        expect(formatCurrencyCompact(500)).toContain("Rp");
    });
});

describe("getSmartCostDefault", () => {
    it("should return average from history when available", () => {
        const history = [createMockProduction({ commodity: "Red Chili", total_cost: 400000 }), createMockProduction({ commodity: "Red Chili", total_cost: 600000 })];

        const result = getSmartCostDefault("Red Chili", history);

        expect(result.value).toBe(500000);
        expect(result.source).toBe("history");
    });

    it("should return estimate when no history", () => {
        const result = getSmartCostDefault("Red Chili", []);

        expect(result.value).toBe(DEFAULT_COST_ESTIMATES["Red Chili"]);
        expect(result.source).toBe("estimate");
    });

    it("should skip null cost values in history", () => {
        const history = [createMockProduction({ commodity: "Red Chili", total_cost: null }), createMockProduction({ commodity: "Red Chili", total_cost: 500000 })];

        const result = getSmartCostDefault("Red Chili", history);

        expect(result.value).toBe(500000);
        expect(result.source).toBe("history");
    });

    it("should return Others default for unknown commodity", () => {
        const result = getSmartCostDefault("Unknown Crop", []);

        expect(result.value).toBe(DEFAULT_COST_ESTIMATES["Others"]);
        expect(result.source).toBe("estimate");
    });
});

describe("getSmartPriceDefault", () => {
    it("should return average from history when available", () => {
        const history = [createMockProduction({ commodity: "Red Chili", selling_price_per_kg: 30000 }), createMockProduction({ commodity: "Red Chili", selling_price_per_kg: 40000 })];

        const result = getSmartPriceDefault("Red Chili", history);

        expect(result.value).toBe(35000);
        expect(result.source).toBe("history");
    });

    it("should return estimate when no history", () => {
        const result = getSmartPriceDefault("Rawit Chili", []);

        expect(result.value).toBe(DEFAULT_PRICE_ESTIMATES["Rawit Chili"]);
        expect(result.source).toBe("estimate");
    });
});

describe("calculateFinancialSummary", () => {
    it("should calculate complete summary for profitable production", () => {
        const production = createMockProduction({
            harvest_yield_kg: 50,
            selling_price_per_kg: 35000,
            total_cost: 500000,
        });

        const summary = calculateFinancialSummary(production);

        expect(summary.revenue).toBe(1750000);
        expect(summary.cost).toBe(500000);
        expect(summary.profit).toBe(1250000);
        expect(summary.roi).toBe(250);
        expect(summary.status).toBe("profit");
        expect(summary.hasData).toBe(true);
    });

    it("should calculate summary for loss", () => {
        const production = createMockProduction({
            harvest_yield_kg: 10,
            selling_price_per_kg: 35000,
            total_cost: 500000,
        });

        const summary = calculateFinancialSummary(production);

        expect(summary.revenue).toBe(350000);
        expect(summary.profit).toBe(-150000);
        expect(summary.status).toBe("loss");
    });

    it("should handle production without financial data", () => {
        const production = createMockProduction({
            harvest_yield_kg: 50,
            total_cost: null,
            selling_price_per_kg: null,
        });

        const summary = calculateFinancialSummary(production);

        expect(summary.hasData).toBe(false);
        expect(summary.revenue).toBe(0);
    });
});
