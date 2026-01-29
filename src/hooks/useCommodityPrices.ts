import { useQuery } from "@tanstack/react-query";
import { COMMODITY_API_CONFIG, ALL_COMMODITIES, getCommodityById, type CommodityPrice, type CommodityTrendData, type DailyPrice, type BIAPIResponse } from "@/constants/commodities";
import { formatDateForAPI, formatDateForDisplay, formatDateDDMMYYYY, getTrendDates, parseBIResponseToPrice, calculatePriceChange, generateMockPriceData } from "@/lib/commodity-utils";

// =====================================================
// Query Keys
// =====================================================

export const commodityKeys = {
    all: ["commodity"] as const,
    prices: () => [...commodityKeys.all, "prices"] as const,
    trend: (commodityIds: string[]) => [...commodityKeys.all, "trend", commodityIds] as const,
};

// =====================================================
// API Fetching Functions
// =====================================================

/**
 * Fetch price for a single commodity on a specific date
 * Uses proxy chain: Supabase Edge Function -> Vercel API -> Mock data
 */
async function fetchCommodityPrice(commodityId: string, date: Date): Promise<DailyPrice | null> {
    // If configured to use mock data only, skip API calls
    if (COMMODITY_API_CONFIG.USE_MOCK_DATA_ONLY) {
        return null;
    }

    const dateStr = formatDateForAPI(date);

    // Try Supabase Edge Function first (primary)
    if (COMMODITY_API_CONFIG.SUPABASE_PROXY_URL) {
        try {
            const params = new URLSearchParams({
                commodityId,
                date: dateStr,
                provinceId: COMMODITY_API_CONFIG.PROVINCE_ID.toString(),
                priceType: COMMODITY_API_CONFIG.PRICE_TYPE_ID.toString(),
            });

            const response = await fetch(`${COMMODITY_API_CONFIG.SUPABASE_PROXY_URL}?${params.toString()}`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
            });

            if (response.ok) {
                const data: BIAPIResponse = await response.json();
                if (data.data && data.data.length > 0) {
                    return parseBIResponseToPrice(data.data[0]);
                }
            }
        } catch (error) {
            console.warn("Supabase proxy failed, trying Vercel fallback:", error);
        }
    }

    // Fallback to Vercel API route
    try {
        const params = new URLSearchParams({
            commodityId,
            date: dateStr,
            provinceId: COMMODITY_API_CONFIG.PROVINCE_ID.toString(),
            priceType: COMMODITY_API_CONFIG.PRICE_TYPE_ID.toString(),
        });

        const response = await fetch(`${COMMODITY_API_CONFIG.VERCEL_PROXY_URL}?${params.toString()}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });

        if (response.ok) {
            const data: BIAPIResponse = await response.json();
            if (data.data && data.data.length > 0) {
                return parseBIResponseToPrice(data.data[0]);
            }
        }
    } catch (error) {
        console.warn(`Vercel proxy also failed for ${commodityId}:`, error);
    }

    // All proxies failed - will use mock data
    return null;
}

/**
 * Fetch all commodity prices for today and yesterday
 */
/**
 * Fetch all commodity prices for today and yesterday
 */
async function fetchAllCommodityPrices(): Promise<CommodityPrice[]> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const prices: CommodityPrice[] = [];

    // Process each commodity independently so one failure doesn't break others
    await Promise.all(
        ALL_COMMODITIES.map(async (commodity) => {
            let currentPrice: DailyPrice | null = null;
            let previousPrice: DailyPrice | null = null;

            // Try to fetch real data
            try {
                // Fetch in parallel
                const [cur, prev] = await Promise.all([fetchCommodityPrice(commodity.id, today), fetchCommodityPrice(commodity.id, yesterday)]);
                currentPrice = cur;
                previousPrice = prev;
            } catch (err) {
                console.warn(`Failed to fetch prices for ${commodity.name}:`, err);
            }

            // Fallback to mock data ONLY if BOTH are missing
            // If we have at least one, we try to use what we have (though calculation might be limited)
            if (!currentPrice && !previousPrice) {
                const mockPrices = generateMockPriceData(commodity.id, 2);
                previousPrice = mockPrices[0];
                currentPrice = mockPrices[1];
            }

            const { change, percent, trend } = calculatePriceChange(currentPrice?.price ?? 0, previousPrice?.price ?? 0);

            prices.push({
                commodityId: commodity.id,
                commodityName: commodity.name,
                color: commodity.color,
                currentPrice,
                previousPrice,
                priceChange: change,
                priceChangePercent: percent,
                trend,
            });
        }),
    );

    // Sort to maintain order
    return prices.sort((a, b) => {
        const indexA = ALL_COMMODITIES.findIndex((c) => c.id === a.commodityId);
        const indexB = ALL_COMMODITIES.findIndex((c) => c.id === b.commodityId);
        return indexA - indexB;
    });
}

/**
 * Fetch trend data for selected commodities (5 days)
 */
async function fetchCommodityTrend(commodityIds: string[]): Promise<CommodityTrendData[]> {
    const dates = getTrendDates(COMMODITY_API_CONFIG.TREND_DAYS);
    const trendData: CommodityTrendData[] = [];

    await Promise.all(
        commodityIds.map(async (commodityId) => {
            const commodity = getCommodityById(commodityId);
            if (!commodity) return;

            // Fetch all dates in parallel
            const pricePromises = dates.map((date) => fetchCommodityPrice(commodityId, date));
            const results = await Promise.all(pricePromises);

            // Filter out nulls to see what we actually got
            const validPrices = results.filter((p): p is DailyPrice => p !== null);

            // If we have NO valid data, use completely mock data
            // This prevents showing an empty chart
            if (validPrices.length === 0) {
                const mockPrices = generateMockPriceData(commodityId, COMMODITY_API_CONFIG.TREND_DAYS);
                trendData.push({
                    commodityId,
                    commodityName: commodity.name,
                    color: commodity.color,
                    prices: mockPrices,
                });
                return;
            }

            // If we have partial data, we need to fill the gaps
            // Strategy: Fill missing dates with the nearest available price (Forward/Backward fill)
            const finalPrices: DailyPrice[] = dates.map((date, index) => {
                const existing = results[index];
                if (existing) return existing;

                // Find nearest non-null value
                // 1. Try to find previous value (most recent past)
                for (let i = index - 1; i >= 0; i--) {
                    if (results[i]) {
                        return {
                            ...results[i]!,
                            date: formatDateDDMMYYYY(date),
                            dateDisplay: formatDateForDisplay(date),
                        };
                    }
                }

                // 2. Try to find next value (future relative to this hole)
                for (let i = index + 1; i < dates.length; i++) {
                    if (results[i]) {
                        return {
                            ...results[i]!,
                            date: formatDateDDMMYYYY(date),
                            dateDisplay: formatDateForDisplay(date),
                        };
                    }
                }

                // Should not be reached because validPrices.length > 0
                // But as safety, return a zero/empty price
                return {
                    date: formatDateDDMMYYYY(date),
                    dateDisplay: formatDateForDisplay(date),
                    price: 0,
                    priceFormatted: "Rp 0",
                };
            });

            trendData.push({
                commodityId,
                commodityName: commodity.name,
                color: commodity.color,
                prices: finalPrices,
            });
        }),
    );

    return trendData;
}

// =====================================================
// React Query Hooks
// =====================================================

/**
 * Hook to fetch all commodity prices (today vs yesterday)
 */
export function useCommodityPrices() {
    return useQuery({
        queryKey: commodityKeys.prices(),
        queryFn: fetchAllCommodityPrices,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
        retry: 1,
    });
}

/**
 * Hook to fetch commodity trend data (5 days)
 */
export function useCommodityTrend(commodityIds: string[]) {
    return useQuery({
        queryKey: commodityKeys.trend(commodityIds),
        queryFn: () => fetchCommodityTrend(commodityIds),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
        enabled: commodityIds.length > 0,
        retry: 1,
    });
}

/**
 * Combined hook for both prices and trend
 */
export function useCommodityData(selectedCommodityIds: string[] = ALL_COMMODITIES.map((c) => c.id)) {
    const pricesQuery = useCommodityPrices();
    const trendQuery = useCommodityTrend(selectedCommodityIds);

    return {
        prices: pricesQuery.data ?? [],
        trend: trendQuery.data ?? [],
        isLoading: pricesQuery.isLoading || trendQuery.isLoading,
        isError: pricesQuery.isError || trendQuery.isError,
        error: pricesQuery.error || trendQuery.error,
        refetch: () => {
            pricesQuery.refetch();
            trendQuery.refetch();
        },
    };
}
