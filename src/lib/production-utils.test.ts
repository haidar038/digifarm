import { describe, it, expect } from "vitest";
import {
    getHarvestedProductions,
    getUniqueCommodities,
    transformToBarChartData,
    transformToPieChartData,
    calculateTotalYield,
    calculateAverageYield,
    getProductionStatusCounts,
    filterEventsInDateRange,
    getUpcomingEvents,
    validateHarvestData,
    formatArea,
    calculateEfficiency,
} from "@/lib/production-utils";
import { Production } from "@/types/database";

// Helper function to create mock production data
function createMockProduction(overrides: Partial<Production> = {}): Production {
    return {
        id: overrides.id || "prod-1",
        land_id: overrides.land_id || "land-1",
        commodity: overrides.commodity || "Red Chili",
        planting_date: overrides.planting_date || "2024-01-15",
        seed_count: overrides.seed_count ?? 100,
        estimated_harvest_date: overrides.estimated_harvest_date || "2024-04-15",
        harvest_date: overrides.harvest_date || null,
        harvest_yield_kg: overrides.harvest_yield_kg ?? null,
        status: overrides.status || "planted",
        notes: overrides.notes || null,
        created_at: overrides.created_at || "2024-01-15T00:00:00Z",
        updated_at: overrides.updated_at || "2024-01-15T00:00:00Z",
    };
}

describe("getHarvestedProductions", () => {
    it("should return only harvested productions", () => {
        const productions: Production[] = [
            createMockProduction({ id: "1", status: "harvested" }),
            createMockProduction({ id: "2", status: "planted" }),
            createMockProduction({ id: "3", status: "harvested" }),
            createMockProduction({ id: "4", status: "growing" }),
        ];

        const result = getHarvestedProductions(productions);

        expect(result).toHaveLength(2);
        expect(result.map((p) => p.id)).toEqual(["1", "3"]);
    });

    it("should return empty array when no harvested productions", () => {
        const productions: Production[] = [createMockProduction({ status: "planted" }), createMockProduction({ status: "growing" })];

        const result = getHarvestedProductions(productions);

        expect(result).toHaveLength(0);
    });

    it("should return empty array for empty input", () => {
        expect(getHarvestedProductions([])).toEqual([]);
    });
});

describe("getUniqueCommodities", () => {
    it("should return unique commodities", () => {
        const productions: Production[] = [
            createMockProduction({ commodity: "Red Chili" }),
            createMockProduction({ commodity: "Tomatoes" }),
            createMockProduction({ commodity: "Red Chili" }),
            createMockProduction({ commodity: "Shallots" }),
        ];

        const result = getUniqueCommodities(productions);

        expect(result).toHaveLength(3);
        expect(result).toContain("Red Chili");
        expect(result).toContain("Tomatoes");
        expect(result).toContain("Shallots");
    });

    it("should return empty array for empty input", () => {
        expect(getUniqueCommodities([])).toEqual([]);
    });
});

describe("transformToBarChartData", () => {
    it("should transform harvested productions to bar chart data", () => {
        const productions: Production[] = [
            createMockProduction({
                id: "1",
                commodity: "Red Chili",
                planting_date: "2024-01-15",
                harvest_yield_kg: 50,
                status: "harvested",
            }),
            createMockProduction({
                id: "2",
                commodity: "Tomatoes",
                planting_date: "2024-01-20",
                harvest_yield_kg: 30,
                status: "harvested",
            }),
        ];

        const result = transformToBarChartData(productions);

        expect(result).toHaveLength(1);
        expect(result[0].period).toContain("Jan");
        expect(result[0].period).toContain("2024");
        expect(result[0]["Red Chili"]).toBe(50);
        expect(result[0]["Tomatoes"]).toBe(30);
    });

    it("should aggregate yields for same period and commodity", () => {
        const productions: Production[] = [
            createMockProduction({
                id: "1",
                commodity: "Red Chili",
                planting_date: "2024-01-15",
                harvest_yield_kg: 50,
                status: "harvested",
            }),
            createMockProduction({
                id: "2",
                commodity: "Red Chili",
                planting_date: "2024-01-20",
                harvest_yield_kg: 30,
                status: "harvested",
            }),
        ];

        const result = transformToBarChartData(productions);

        expect(result).toHaveLength(1);
        expect(result[0]["Red Chili"]).toBe(80);
    });

    it("should exclude non-harvested productions", () => {
        const productions: Production[] = [
            createMockProduction({
                status: "planted",
                harvest_yield_kg: 50,
            }),
            createMockProduction({
                status: "growing",
                harvest_yield_kg: 30,
            }),
        ];

        const result = transformToBarChartData(productions);

        expect(result).toHaveLength(0);
    });

    it("should limit to maxPeriods", () => {
        const productions: Production[] = [];
        for (let i = 0; i < 10; i++) {
            productions.push(
                createMockProduction({
                    id: `${i}`,
                    planting_date: `2024-${String(i + 1).padStart(2, "0")}-15`,
                    harvest_yield_kg: 10,
                    status: "harvested",
                })
            );
        }

        const result = transformToBarChartData(productions, 3);

        expect(result).toHaveLength(3);
    });
});

describe("transformToPieChartData", () => {
    it("should transform productions to pie chart data", () => {
        const productions: Production[] = [
            createMockProduction({
                commodity: "Red Chili",
                harvest_yield_kg: 100,
                status: "harvested",
            }),
            createMockProduction({
                commodity: "Tomatoes",
                harvest_yield_kg: 50,
                status: "harvested",
            }),
        ];

        const result = transformToPieChartData(productions);

        expect(result).toHaveLength(2);
        expect(result).toContainEqual({ name: "Red Chili", value: 100 });
        expect(result).toContainEqual({ name: "Tomatoes", value: 50 });
    });

    it("should aggregate values for same commodity", () => {
        const productions: Production[] = [
            createMockProduction({
                id: "1",
                commodity: "Red Chili",
                harvest_yield_kg: 60,
                status: "harvested",
            }),
            createMockProduction({
                id: "2",
                commodity: "Red Chili",
                harvest_yield_kg: 40,
                status: "harvested",
            }),
        ];

        const result = transformToPieChartData(productions);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ name: "Red Chili", value: 100 });
    });

    it("should handle null harvest_yield_kg as 0", () => {
        const productions: Production[] = [
            createMockProduction({
                commodity: "Red Chili",
                harvest_yield_kg: null,
                status: "harvested",
            }),
        ];

        const result = transformToPieChartData(productions);

        expect(result[0].value).toBe(0);
    });
});

describe("calculateTotalYield", () => {
    it("should calculate total yield from harvested productions", () => {
        const productions: Production[] = [
            createMockProduction({ harvest_yield_kg: 50, status: "harvested" }),
            createMockProduction({ harvest_yield_kg: 30, status: "harvested" }),
            createMockProduction({ harvest_yield_kg: 20, status: "planted" }), // Should be excluded
        ];

        const result = calculateTotalYield(productions);

        expect(result).toBe(80);
    });

    it("should return 0 for empty productions", () => {
        expect(calculateTotalYield([])).toBe(0);
    });

    it("should handle null yields as 0", () => {
        const productions: Production[] = [createMockProduction({ harvest_yield_kg: null, status: "harvested" }), createMockProduction({ harvest_yield_kg: 50, status: "harvested" })];

        const result = calculateTotalYield(productions);

        expect(result).toBe(50);
    });
});

describe("calculateAverageYield", () => {
    it("should calculate average yield", () => {
        const productions: Production[] = [createMockProduction({ harvest_yield_kg: 60, status: "harvested" }), createMockProduction({ harvest_yield_kg: 40, status: "harvested" })];

        const result = calculateAverageYield(productions);

        expect(result).toBe(50);
    });

    it("should return 0 for no harvested productions", () => {
        const productions: Production[] = [createMockProduction({ status: "planted" })];

        const result = calculateAverageYield(productions);

        expect(result).toBe(0);
    });

    it("should return 0 for empty array", () => {
        expect(calculateAverageYield([])).toBe(0);
    });
});

describe("getProductionStatusCounts", () => {
    it("should count productions by status", () => {
        const productions: Production[] = [createMockProduction({ status: "planted" }), createMockProduction({ status: "planted" }), createMockProduction({ status: "growing" }), createMockProduction({ status: "harvested" })];

        const result = getProductionStatusCounts(productions);

        expect(result).toEqual({
            planted: 2,
            growing: 1,
            harvested: 1,
        });
    });

    it("should return empty object for empty array", () => {
        expect(getProductionStatusCounts([])).toEqual({});
    });
});

describe("filterEventsInDateRange", () => {
    const today = new Date("2024-03-15");
    const futureDate = new Date("2024-04-15");

    it("should filter harvest events within date range", () => {
        const productions: Production[] = [
            createMockProduction({
                id: "1",
                status: "growing",
                estimated_harvest_date: "2024-03-20",
            }),
            createMockProduction({
                id: "2",
                status: "growing",
                estimated_harvest_date: "2024-05-01", // Outside range
            }),
        ];

        const result = filterEventsInDateRange(productions, today, futureDate);

        expect(result.harvestEvents).toHaveLength(1);
        expect(result.harvestEvents[0].id).toBe("1");
    });

    it("should exclude harvested productions from events", () => {
        const productions: Production[] = [
            createMockProduction({
                id: "1",
                status: "harvested",
                estimated_harvest_date: "2024-03-20",
            }),
        ];

        const result = filterEventsInDateRange(productions, today, futureDate);

        expect(result.harvestEvents).toHaveLength(0);
        expect(result.plantingEvents).toHaveLength(0);
    });

    it("should filter planting events within date range", () => {
        const productions: Production[] = [
            createMockProduction({
                id: "1",
                status: "planted",
                planting_date: "2024-03-20",
            }),
            createMockProduction({
                id: "2",
                status: "planted",
                planting_date: "2024-01-01", // Outside range
            }),
        ];

        const result = filterEventsInDateRange(productions, today, futureDate);

        expect(result.plantingEvents).toHaveLength(1);
        expect(result.plantingEvents[0].id).toBe("1");
    });
});

describe("getUpcomingEvents", () => {
    it("should combine and sort events by date", () => {
        const harvestEvents = [{ id: "1", date: "2024-03-25", commodity: "Red Chili", type: "harvest" as const, status: "growing" }];
        const plantingEvents = [{ id: "2", date: "2024-03-20", commodity: "Tomatoes", type: "planting" as const, status: "planted" }];

        const result = getUpcomingEvents(harvestEvents, plantingEvents);

        expect(result[0].id).toBe("2"); // Earlier date comes first
        expect(result[1].id).toBe("1");
    });

    it("should limit results", () => {
        const harvestEvents = [
            { id: "1", date: "2024-03-25", commodity: "Red Chili", type: "harvest" as const, status: "growing" },
            { id: "2", date: "2024-03-26", commodity: "Tomatoes", type: "harvest" as const, status: "growing" },
            { id: "3", date: "2024-03-27", commodity: "Shallots", type: "harvest" as const, status: "growing" },
        ];

        const result = getUpcomingEvents(harvestEvents, [], 2);

        expect(result).toHaveLength(2);
    });
});

describe("validateHarvestData", () => {
    it("should return valid for correct data", () => {
        const data = {
            harvest_date: "2024-03-15",
            harvest_yield_kg: 50,
        };

        const result = validateHarvestData(data);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it("should return error for empty harvest date", () => {
        const data = {
            harvest_date: "",
            harvest_yield_kg: 50,
        };

        const result = validateHarvestData(data);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Harvest date is required");
    });

    it("should return error for zero yield", () => {
        const data = {
            harvest_date: "2024-03-15",
            harvest_yield_kg: 0,
        };

        const result = validateHarvestData(data);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Harvest yield must be greater than 0");
    });

    it("should return error for negative yield", () => {
        const data = {
            harvest_date: "2024-03-15",
            harvest_yield_kg: -10,
        };

        const result = validateHarvestData(data);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Harvest yield must be greater than 0");
    });

    it("should return multiple errors", () => {
        const data = {
            harvest_date: "",
            harvest_yield_kg: 0,
        };

        const result = validateHarvestData(data);

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(2);
    });
});

describe("formatArea", () => {
    it("should format small areas in square meters", () => {
        expect(formatArea(500)).toBe("500 m²");
        expect(formatArea(9999)).toBe("9,999 m²");
    });

    it("should format large areas in hectares", () => {
        expect(formatArea(10000)).toBe("1.00 ha");
        expect(formatArea(25000)).toBe("2.50 ha");
        expect(formatArea(100000)).toBe("10.00 ha");
    });
});

describe("calculateEfficiency", () => {
    it("should calculate yield per seed", () => {
        expect(calculateEfficiency(100, 50)).toBe(2);
        expect(calculateEfficiency(75, 100)).toBe(0.75);
    });

    it("should return 0 for null harvest yield", () => {
        expect(calculateEfficiency(null, 100)).toBe(0);
    });

    it("should return 0 for zero seed count", () => {
        expect(calculateEfficiency(100, 0)).toBe(0);
    });
});
