import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// =====================================================
// Types
// =====================================================

export interface ActivityStats {
    totalProduction: number; // Total harvest yield in kg
    totalLandArea: number; // Total land area in m²
    landCount: number; // Number of lands/gardens
    farmerCount: number; // Number of users with farmer role
}

// =====================================================
// Query Keys
// =====================================================

export const activityStatsKeys = {
    all: ["activityStats"] as const,
    stats: () => [...activityStatsKeys.all, "stats"] as const,
};

// =====================================================
// Data Fetching Functions
// =====================================================

/**
 * Fetch aggregated activity statistics using RPC function
 * Uses a SECURITY DEFINER function to bypass RLS for public access
 */
async function fetchActivityStats(): Promise<ActivityStats> {
    // Call the RPC function that returns aggregated stats
    const { data, error } = await supabase.rpc("get_public_activity_stats");

    if (error) {
        console.error("Error fetching activity stats:", error);
        // Return default values on error
        return {
            totalProduction: 0,
            totalLandArea: 0,
            landCount: 0,
            farmerCount: 0,
        };
    }

    // Parse the JSON response
    const stats = data as {
        totalProduction: number;
        totalLandArea: number;
        landCount: number;
        farmerCount: number;
    };

    return {
        totalProduction: stats.totalProduction ?? 0,
        totalLandArea: stats.totalLandArea ?? 0,
        landCount: stats.landCount ?? 0,
        farmerCount: stats.farmerCount ?? 0,
    };
}

// =====================================================
// React Query Hook
// =====================================================

/**
 * Hook to fetch aggregated activity statistics
 * Works for both authenticated and anonymous users
 */
export function useActivityStats() {
    return useQuery({
        queryKey: activityStatsKeys.stats(),
        queryFn: fetchActivityStats,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
    });
}
