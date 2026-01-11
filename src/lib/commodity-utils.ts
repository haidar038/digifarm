import { INDONESIAN_MONTHS, COMMODITY_API_CONFIG, getCommodityById, type DailyPrice, type CommodityPrice, type BIAPIDataItem } from "@/constants/commodities";

// =====================================================
// Date Formatting Utilities
// =====================================================

/**
 * Format date for Bank Indonesia API request
 * Output: "Jan 15, 2026"
 */
export function formatDateForAPI(date: Date): string {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/**
 * Format date for display (Indonesian)
 * Output: "11 Jan 2026"
 */
export function formatDateForDisplay(date: Date): string {
    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatDateDDMMYYYY(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Parse Bank Indonesia date format to Date object
 * Input: "15 Jan 25" or "15 Mei 25"
 * Output: Date object
 */
export function parseBIDate(dateStr: string): Date | null {
    try {
        const parts = dateStr.trim().split(" ");
        if (parts.length !== 3) return null;

        const [day, monthId, yearShort] = parts;
        const month = INDONESIAN_MONTHS[monthId];
        if (!month) return null;

        const year = parseInt(`20${yearShort}`);
        const monthNum = parseInt(month) - 1; // 0-indexed
        const dayNum = parseInt(day);

        return new Date(year, monthNum, dayNum);
    } catch {
        return null;
    }
}

/**
 * Get array of dates for trend (last N days)
 */
export function getTrendDates(days: number = COMMODITY_API_CONFIG.TREND_DAYS): Date[] {
    const dates: Date[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date);
    }

    return dates;
}

// =====================================================
// Price Formatting Utilities
// =====================================================

/**
 * Format price to Indonesian Rupiah
 * Output: "Rp 24.500"
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

/**
 * Format price change with sign
 * Output: "+Rp 2.500" or "-Rp 1.000"
 */
export function formatPriceChange(change: number): string {
    const sign = change > 0 ? "+" : "";
    return `${sign}${formatPrice(change)}`;
}

/**
 * Format percentage change
 * Output: "+10.5%" or "-5.2%"
 */
export function formatPercentChange(percent: number): string {
    const sign = percent > 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
}

/**
 * Calculate price change between two prices
 */
export function calculatePriceChange(currentPrice: number, previousPrice: number): { change: number; percent: number; trend: "up" | "down" | "stable" } {
    const change = currentPrice - previousPrice;
    const percent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

    let trend: "up" | "down" | "stable" = "stable";
    if (change > 0) trend = "up";
    if (change < 0) trend = "down";

    return { change, percent, trend };
}

// =====================================================
// Data Processing Utilities
// =====================================================

/**
 * Parse Bank Indonesia API response to DailyPrice
 */
export function parseBIResponseToPrice(item: BIAPIDataItem): DailyPrice | null {
    try {
        const date = parseBIDate(item.Tanggal);
        if (!date) return null;

        return {
            date: formatDateDDMMYYYY(date),
            dateDisplay: formatDateForDisplay(date),
            price: item.Nilai,
            priceFormatted: formatPrice(item.Nilai),
        };
    } catch {
        return null;
    }
}

/**
 * Build CommodityPrice object from current and previous day data
 */
export function buildCommodityPrice(commodityId: string, currentData: BIAPIDataItem | null, previousData: BIAPIDataItem | null): CommodityPrice | null {
    const commodity = getCommodityById(commodityId);
    if (!commodity) return null;

    const currentPrice = currentData ? parseBIResponseToPrice(currentData) : null;
    const previousPrice = previousData ? parseBIResponseToPrice(previousData) : null;

    const { change, percent, trend } = calculatePriceChange(currentPrice?.price ?? 0, previousPrice?.price ?? 0);

    return {
        commodityId,
        commodityName: commodity.name,
        color: commodity.color,
        currentPrice,
        previousPrice,
        priceChange: change,
        priceChangePercent: percent,
        trend,
    };
}

// =====================================================
// Chart Data Utilities
// =====================================================

/**
 * Get trend color class based on trend direction
 */
export function getTrendColorClass(trend: "up" | "down" | "stable"): string {
    switch (trend) {
        case "up":
            return "text-red-600 dark:text-red-400"; // Price up = bad for buyers
        case "down":
            return "text-green-600 dark:text-green-400"; // Price down = good for buyers
        default:
            return "text-muted-foreground";
    }
}

/**
 * Get trend icon name
 */
export function getTrendIcon(trend: "up" | "down" | "stable"): string {
    switch (trend) {
        case "up":
            return "TrendingUp";
        case "down":
            return "TrendingDown";
        default:
            return "Minus";
    }
}

/**
 * Get trend background class for badges
 */
export function getTrendBadgeClass(trend: "up" | "down" | "stable"): string {
    switch (trend) {
        case "up":
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
        case "down":
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
}

// =====================================================
// Mock Data for Development/Fallback
// =====================================================

/**
 * Generate mock price data for a commodity
 * Used when API is unavailable
 */
export function generateMockPriceData(commodityId: string, days: number = COMMODITY_API_CONFIG.TREND_DAYS): DailyPrice[] {
    const prices: DailyPrice[] = [];
    const basePrice = getBasePriceForCommodity(commodityId);

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Add some random variation (±15%)
        const variation = (Math.random() - 0.5) * 0.3 * basePrice;
        const price = Math.round(basePrice + variation);

        prices.push({
            date: formatDateDDMMYYYY(date),
            dateDisplay: formatDateForDisplay(date),
            price,
            priceFormatted: formatPrice(price),
        });
    }

    return prices;
}

/**
 * Get base price for mock data generation
 */
function getBasePriceForCommodity(commodityId: string): number {
    const basePrices: Record<string, number> = {
        "7_13": 55000, // Cabai Merah Besar
        "7_14": 48000, // Cabai Merah Keriting
        "8_15": 42000, // Cabai Rawit Hijau
        "8_16": 65000, // Cabai Rawit Merah
    };
    return basePrices[commodityId] ?? 50000;
}
