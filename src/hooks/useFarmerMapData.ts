import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// =====================================================
// Types
// =====================================================

export interface FarmerMapMarker {
    id: string;
    full_name: string;
    avatar_url: string | null;
    regency_name: string | null;
    farmer_code: string;
    status: "active" | "inactive" | "pending" | "suspended";
    total_area_m2: number;
    land_count: number;
    commodities: string[];
    latitude: number;
    longitude: number;
}

// =====================================================
// Query Keys
// =====================================================

export const farmerMapKeys = {
    all: ["farmerMap"] as const,
    data: () => [...farmerMapKeys.all, "data"] as const,
};

// =====================================================
// Data Fetching Functions
// =====================================================

/**
 * Fetch farmer map data using RPC function
 * Uses a SECURITY DEFINER function to bypass RLS for public access
 */
async function fetchFarmerMapData(): Promise<FarmerMapMarker[]> {
    const { data, error } = await supabase.rpc("get_public_farmer_map_data");

    if (error) {
        console.error("Error fetching farmer map data:", error);
        return [];
    }

    // Parse the JSON response
    if (!data || !Array.isArray(data)) {
        return [];
    }

    return data.map((farmer: any) => ({
        id: farmer.id,
        full_name: farmer.full_name,
        avatar_url: farmer.avatar_url,
        regency_name: farmer.regency_name,
        farmer_code: farmer.farmer_code,
        status: farmer.status,
        total_area_m2: farmer.total_area_m2 ?? 0,
        land_count: farmer.land_count ?? 0,
        commodities: farmer.commodities ?? [],
        latitude: farmer.latitude,
        longitude: farmer.longitude,
    }));
}

// =====================================================
// React Query Hook
// =====================================================

/**
 * Hook to fetch farmer map data for the landing page
 * Works for both authenticated and anonymous users
 */
export function useFarmerMapData() {
    return useQuery({
        queryKey: farmerMapKeys.data(),
        queryFn: fetchFarmerMapData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
    });
}

// =====================================================
// Regency Stats Hook
// =====================================================

export interface RegencyStats {
    name: string;
    farmerCount: number;
    landCount: number;
}

/**
 * Hook to get farmer count and land count grouped by regency
 */
export function useRegencyStats(): RegencyStats[] {
    const { data: farmers = [] } = useFarmerMapData();

    // Group farmers by regency and aggregate land counts
    const regencyStats = farmers.reduce((acc, farmer) => {
        const regency = farmer.regency_name ?? "Tidak Diketahui";
        if (!acc[regency]) {
            acc[regency] = { name: regency, farmerCount: 0, landCount: 0 };
        }
        acc[regency].farmerCount++;
        acc[regency].landCount += farmer.land_count;
        return acc;
    }, {} as Record<string, RegencyStats>);

    return Object.values(regencyStats).sort((a, b) => b.farmerCount - a.farmerCount);
}
