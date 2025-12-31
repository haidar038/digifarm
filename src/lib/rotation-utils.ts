/**
 * Crop rotation utilities for sustainable farming
 * Provides recommendations for next crop based on rotation rules
 */

import { Production } from "@/types/database";

/**
 * Plant families for rotation grouping
 */
export type PlantFamily = "solanaceae" | "allium" | "other";

/**
 * Commodity to family mapping
 */
const COMMODITY_FAMILIES: Record<string, PlantFamily> = {
    "Red Chili": "solanaceae",
    "Rawit Chili": "solanaceae",
    Tomatoes: "solanaceae",
    Shallots: "allium",
    Garlic: "allium",
    Others: "other",
};

/**
 * Get plant family for a commodity
 */
export function getCommodityFamily(commodity: string): PlantFamily {
    return COMMODITY_FAMILIES[commodity] || "other";
}

/**
 * Rotation recommendation with reason
 */
export interface RotationRecommendation {
    commodity: string;
    reason: string;
    priority: "high" | "medium" | "low";
}

/**
 * Rotation warning
 */
export interface RotationWarning {
    message: string;
    severity: "warning" | "info";
}

/**
 * Rotation rules: which commodities are good after which
 */
const GOOD_SUCCESSORS: Record<string, { commodity: string; reason: string }[]> = {
    "Red Chili": [
        { commodity: "Shallots", reason: "Bawang mengembalikan nitrogen tanah" },
        { commodity: "Garlic", reason: "Memutus siklus hama cabai" },
    ],
    "Rawit Chili": [
        { commodity: "Shallots", reason: "Bawang mengembalikan nitrogen tanah" },
        { commodity: "Garlic", reason: "Memutus siklus hama cabai" },
    ],
    Tomatoes: [
        { commodity: "Shallots", reason: "Allium baik setelah Solanaceae" },
        { commodity: "Garlic", reason: "Mengurangi patogen tanah" },
    ],
    Shallots: [
        { commodity: "Red Chili", reason: "Cabai tumbuh baik setelah bawang" },
        { commodity: "Tomatoes", reason: "Solanaceae cocok setelah Allium" },
        { commodity: "Rawit Chili", reason: "Tanah sudah diperkaya nitrogen" },
    ],
    Garlic: [
        { commodity: "Red Chili", reason: "Cabai tumbuh baik setelah bawang putih" },
        { commodity: "Tomatoes", reason: "Solanaceae cocok setelah Allium" },
        { commodity: "Rawit Chili", reason: "Tanah sudah diperkaya nitrogen" },
    ],
};

/**
 * Get the last harvested production for a specific land
 */
export function getLastHarvestedForLand(productions: Production[], landId: string): Production | null {
    const harvested = productions.filter((p) => p.land_id === landId && p.status === "harvested" && p.harvest_date).sort((a, b) => new Date(b.harvest_date!).getTime() - new Date(a.harvest_date!).getTime());

    return harvested[0] || null;
}

/**
 * Get rotation recommendations based on last commodity
 */
export function getRotationRecommendations(lastCommodity: string | null): RotationRecommendation[] {
    if (!lastCommodity) {
        // No history - return all as equal options
        return [
            { commodity: "Red Chili", reason: "Komoditas populer dengan nilai tinggi", priority: "medium" },
            { commodity: "Shallots", reason: "Permintaan pasar stabil", priority: "medium" },
            { commodity: "Tomatoes", reason: "Siklus tanam relatif pendek", priority: "medium" },
        ];
    }

    const recommendations: RotationRecommendation[] = [];

    // Get good successors for the last commodity
    const successors = GOOD_SUCCESSORS[lastCommodity] || [];
    successors.forEach((s, index) => {
        recommendations.push({
            commodity: s.commodity,
            reason: s.reason,
            priority: index === 0 ? "high" : "medium",
        });
    });

    // Add a "safe" generic option if not many recommendations
    if (recommendations.length < 2) {
        const lastFamily = getCommodityFamily(lastCommodity);
        // Suggest something from a different family
        if (lastFamily === "solanaceae") {
            if (!recommendations.find((r) => r.commodity === "Shallots")) {
                recommendations.push({
                    commodity: "Shallots",
                    reason: "Berbeda family, baik untuk rotasi",
                    priority: "medium",
                });
            }
        } else if (lastFamily === "allium") {
            if (!recommendations.find((r) => r.commodity === "Red Chili")) {
                recommendations.push({
                    commodity: "Red Chili",
                    reason: "Berbeda family, baik untuk rotasi",
                    priority: "medium",
                });
            }
        }
    }

    return recommendations;
}

/**
 * Get warnings if selected commodity is not ideal
 */
export function getRotationWarnings(selectedCommodity: string, lastCommodity: string | null): RotationWarning[] {
    const warnings: RotationWarning[] = [];

    if (!lastCommodity) return warnings;

    // Warning: Same commodity
    if (selectedCommodity === lastCommodity) {
        warnings.push({
            message: `Menanam ${selectedCommodity} berturutan dapat menurunkan hasil. Pertimbangkan rotasi.`,
            severity: "warning",
        });
    }

    // Warning: Same family (Solanaceae back-to-back)
    const selectedFamily = getCommodityFamily(selectedCommodity);
    const lastFamily = getCommodityFamily(lastCommodity);

    if (selectedFamily === "solanaceae" && lastFamily === "solanaceae" && selectedCommodity !== lastCommodity) {
        warnings.push({
            message: `Kedua tanaman dari family Solanaceae. Risiko hama dan penyakit meningkat.`,
            severity: "info",
        });
    }

    return warnings;
}

/**
 * Calculate days since last harvest
 */
export function daysSinceHarvest(harvestDate: string): number {
    const harvest = new Date(harvestDate);
    const today = new Date();
    const diffTime = today.getTime() - harvest.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format days since harvest as human readable
 */
export function formatTimeSinceHarvest(harvestDate: string): string {
    const days = daysSinceHarvest(harvestDate);

    if (days < 7) {
        return `${days} hari lalu`;
    } else if (days < 30) {
        const weeks = Math.floor(days / 7);
        return `${weeks} minggu lalu`;
    } else {
        const months = Math.floor(days / 30);
        return `${months} bulan lalu`;
    }
}
