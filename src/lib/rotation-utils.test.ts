import { describe, it, expect } from "vitest";
import { getCommodityFamily, getLastHarvestedForLand, getRotationRecommendations, getRotationWarnings, daysSinceHarvest, formatTimeSinceHarvest } from "@/lib/rotation-utils";
import { Production } from "@/types/database";

// Helper to create mock production
function createMockProduction(overrides: Partial<Production> = {}): Production {
    return {
        id: overrides.id || "prod-1",
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
    };
}

describe("getCommodityFamily", () => {
    it("should return solanaceae for chili varieties", () => {
        expect(getCommodityFamily("Red Chili")).toBe("solanaceae");
        expect(getCommodityFamily("Rawit Chili")).toBe("solanaceae");
    });

    it("should return solanaceae for tomatoes", () => {
        expect(getCommodityFamily("Tomatoes")).toBe("solanaceae");
    });

    it("should return allium for onions and garlic", () => {
        expect(getCommodityFamily("Shallots")).toBe("allium");
        expect(getCommodityFamily("Garlic")).toBe("allium");
    });

    it("should return other for unknown commodities", () => {
        expect(getCommodityFamily("Others")).toBe("other");
        expect(getCommodityFamily("Unknown Crop")).toBe("other");
    });
});

describe("getLastHarvestedForLand", () => {
    it("should return the most recently harvested production for a land", () => {
        const productions = [
            createMockProduction({
                id: "p1",
                land_id: "land-1",
                commodity: "Red Chili",
                harvest_date: "2024-01-01",
                status: "harvested",
            }),
            createMockProduction({
                id: "p2",
                land_id: "land-1",
                commodity: "Shallots",
                harvest_date: "2024-03-01",
                status: "harvested",
            }),
            createMockProduction({
                id: "p3",
                land_id: "land-1",
                commodity: "Tomatoes",
                harvest_date: "2024-02-01",
                status: "harvested",
            }),
        ];

        const result = getLastHarvestedForLand(productions, "land-1");

        expect(result?.id).toBe("p2");
        expect(result?.commodity).toBe("Shallots");
    });

    it("should return null if no harvested productions for land", () => {
        const productions = [
            createMockProduction({
                land_id: "land-1",
                status: "planted",
            }),
        ];

        const result = getLastHarvestedForLand(productions, "land-1");

        expect(result).toBeNull();
    });

    it("should only return productions for the specified land", () => {
        const productions = [
            createMockProduction({
                id: "p1",
                land_id: "land-1",
                commodity: "Red Chili",
                harvest_date: "2024-01-01",
                status: "harvested",
            }),
            createMockProduction({
                id: "p2",
                land_id: "land-2",
                commodity: "Shallots",
                harvest_date: "2024-03-01",
                status: "harvested",
            }),
        ];

        const result = getLastHarvestedForLand(productions, "land-1");

        expect(result?.id).toBe("p1");
        expect(result?.commodity).toBe("Red Chili");
    });
});

describe("getRotationRecommendations", () => {
    it("should recommend allium after red chili", () => {
        const recommendations = getRotationRecommendations("Red Chili");

        expect(recommendations.length).toBeGreaterThan(0);
        expect(recommendations[0].commodity).toBe("Shallots");
        expect(recommendations[0].priority).toBe("high");
    });

    it("should recommend solanaceae after shallots", () => {
        const recommendations = getRotationRecommendations("Shallots");

        const hasSolanaceae = recommendations.some((r) => r.commodity === "Red Chili" || r.commodity === "Tomatoes");
        expect(hasSolanaceae).toBe(true);
    });

    it("should return generic recommendations when no history", () => {
        const recommendations = getRotationRecommendations(null);

        expect(recommendations.length).toBeGreaterThan(0);
        expect(recommendations.every((r) => r.priority === "medium")).toBe(true);
    });

    it("should include reason for each recommendation", () => {
        const recommendations = getRotationRecommendations("Tomatoes");

        recommendations.forEach((r) => {
            expect(r.reason).toBeDefined();
            expect(r.reason.length).toBeGreaterThan(0);
        });
    });
});

describe("getRotationWarnings", () => {
    it("should warn when planting same commodity consecutively", () => {
        const warnings = getRotationWarnings("Red Chili", "Red Chili");

        expect(warnings.length).toBe(1);
        expect(warnings[0].severity).toBe("warning");
        expect(warnings[0].message).toContain("berturutan");
    });

    it("should warn when planting solanaceae after solanaceae", () => {
        const warnings = getRotationWarnings("Tomatoes", "Red Chili");

        expect(warnings.length).toBe(1);
        expect(warnings[0].severity).toBe("info");
        expect(warnings[0].message).toContain("Solanaceae");
    });

    it("should not warn for good rotation", () => {
        const warnings = getRotationWarnings("Shallots", "Red Chili");

        expect(warnings.length).toBe(0);
    });

    it("should not warn when no previous commodity", () => {
        const warnings = getRotationWarnings("Red Chili", null);

        expect(warnings.length).toBe(0);
    });
});

describe("daysSinceHarvest", () => {
    it("should calculate days correctly", () => {
        const today = new Date();
        const tenDaysAgo = new Date(today);
        tenDaysAgo.setDate(today.getDate() - 10);

        const days = daysSinceHarvest(tenDaysAgo.toISOString().split("T")[0]);

        expect(days).toBe(10);
    });
});

describe("formatTimeSinceHarvest", () => {
    it("should format days for recent harvests", () => {
        const today = new Date();
        const fiveDaysAgo = new Date(today);
        fiveDaysAgo.setDate(today.getDate() - 5);

        const result = formatTimeSinceHarvest(fiveDaysAgo.toISOString().split("T")[0]);

        expect(result).toBe("5 hari lalu");
    });

    it("should format weeks for older harvests", () => {
        const today = new Date();
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(today.getDate() - 14);

        const result = formatTimeSinceHarvest(twoWeeksAgo.toISOString().split("T")[0]);

        expect(result).toBe("2 minggu lalu");
    });

    it("should format months for much older harvests", () => {
        const today = new Date();
        const twoMonthsAgo = new Date(today);
        twoMonthsAgo.setDate(today.getDate() - 60);

        const result = formatTimeSinceHarvest(twoMonthsAgo.toISOString().split("T")[0]);

        expect(result).toBe("2 bulan lalu");
    });
});
