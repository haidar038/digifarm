// =====================================================
// Commodity Price Types & Configuration
// =====================================================

/**
 * Commodity item definition
 */
export interface CommodityItem {
    id: string; // Format: "7_14" (category_subcategory)
    name: string;
    color: string;
    icon?: string;
}

/**
 * Commodity category definition
 */
export interface CommodityCategory {
    key: string;
    label: string;
    items: CommodityItem[];
}

/**
 * Price data for a single day
 */
export interface DailyPrice {
    date: string; // Format: "DD/MM/YYYY"
    dateDisplay: string; // Format: "11 Jan 2026"
    price: number; // Raw price in IDR
    priceFormatted: string; // "Rp 24.500"
}

/**
 * Commodity with price data
 */
export interface CommodityPrice {
    commodityId: string;
    commodityName: string;
    color: string;
    currentPrice: DailyPrice | null;
    previousPrice: DailyPrice | null;
    priceChange: number; // Difference in IDR
    priceChangePercent: number; // Percentage change
    trend: "up" | "down" | "stable";
}

/**
 * Trend data for charts (5 days)
 */
export interface CommodityTrendData {
    commodityId: string;
    commodityName: string;
    color: string;
    prices: DailyPrice[];
}

/**
 * API response from Bank Indonesia
 */
export interface BIAPIResponse {
    success: boolean;
    message: string;
    data: BIAPIDataItem[];
}

export interface BIAPIDataItem {
    Tanggal: string; // Format: "15 Jan 25"
    Komoditas: string;
    Nilai: number;
    Trend?: string;
    Perubahan?: string;
}

/**
 * Filter state for commodity prices
 */
export interface CommodityFilter {
    categoryKey: string | "all";
    commodityIds: string[];
}

// =====================================================
// Constants Configuration
// =====================================================

/**
 * API Configuration
 */
export const COMMODITY_API_CONFIG = {
    // Bank Indonesia API endpoint
    API_URL: "https://www.bi.go.id/hargapangan/WebSite/Home/GetGridData1",

    // Location parameters
    PROVINCE_ID: 32, // Maluku Utara
    REGENCY_ID: 1, // Ternate
    LOCATION_NAME: "Ternate, Maluku Utara",

    // Price type parameters
    PRICE_TYPE_ID: 1, // Retail/Eceran
    JENIS_ID: 1, // Harga Eceran
    PERIOD_ID: 1,
    IS_PASOKAN: 1,

    // Trend configuration
    TREND_DAYS: 5, // Number of days for trend chart

    // Chart configuration
    CHART_MIN_PRICE: 0,
    CHART_MAX_PRICE: 200000, // Rp 200.000
} as const;

/**
 * Commodity categories and items
 */
export const COMMODITY_CATEGORIES: CommodityCategory[] = [
    {
        key: "cabaiMerah",
        label: "Cabai Merah",
        items: [
            {
                id: "7_13",
                name: "Cabai Merah Besar",
                color: "#dc2626", // red-600
            },
            {
                id: "7_14",
                name: "Cabai Merah Keriting",
                color: "#ef4444", // red-500
            },
        ],
    },
    {
        key: "cabaiRawit",
        label: "Cabai Rawit",
        items: [
            {
                id: "8_15",
                name: "Cabai Rawit Hijau",
                color: "#16a34a", // green-600
            },
            {
                id: "8_16",
                name: "Cabai Rawit Merah",
                color: "#f97316", // orange-500
            },
        ],
    },
];

/**
 * Flattened list of all commodities
 */
export const ALL_COMMODITIES: CommodityItem[] = COMMODITY_CATEGORIES.flatMap((cat) => cat.items);

/**
 * Get commodity by ID
 */
export function getCommodityById(id: string): CommodityItem | undefined {
    return ALL_COMMODITIES.find((c) => c.id === id);
}

/**
 * Get category by key
 */
export function getCategoryByKey(key: string): CommodityCategory | undefined {
    return COMMODITY_CATEGORIES.find((c) => c.key === key);
}

/**
 * Indonesian month mapping for date parsing
 */
export const INDONESIAN_MONTHS: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    Mei: "05",
    Jun: "06",
    Jul: "07",
    Agu: "08",
    Sep: "09",
    Okt: "10",
    Nov: "11",
    Des: "12",
};

/**
 * Default selected commodities (all)
 */
export const DEFAULT_SELECTED_COMMODITIES = ALL_COMMODITIES.map((c) => c.id);
