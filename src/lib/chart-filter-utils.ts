import { ChartFilterValues } from "@/components/production/ChartFilters";

/**
 * Apply chart filters to productions array
 */
export function applyChartFilters<T extends { land_id: string; commodity: string; planting_date: string }>(productions: T[], filters: ChartFilterValues): T[] {
    return productions.filter((p) => {
        // Land filter
        if (filters.landId && filters.landId !== "all" && p.land_id !== filters.landId) {
            return false;
        }

        // Commodity filter
        if (filters.commodity && filters.commodity !== "all" && p.commodity !== filters.commodity) {
            return false;
        }

        // Date range filter
        const plantingDate = new Date(p.planting_date);

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            if (plantingDate < startDate) {
                return false;
            }
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            if (plantingDate > endDate) {
                return false;
            }
        }

        return true;
    });
}
