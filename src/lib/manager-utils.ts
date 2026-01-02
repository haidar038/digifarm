import { supabase } from "@/integrations/supabase/client";
import type { FarmerWithStats, ManagerStats, RegionalBreakdown, Land, Production } from "@/types/database";

// =====================================================
// Stats & Analytics Functions
// =====================================================

/**
 * Get aggregated stats for connected farmers (Manager view)
 */
export async function getManagerStats(): Promise<ManagerStats> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Get connected farmer IDs
    const { data: connections, error: connError } = await supabase.from("manager_farmer_connections").select("farmer_id").eq("manager_id", user.id).eq("status", "active");

    if (connError) throw connError;

    const farmerIds = connections?.map((c) => c.farmer_id) || [];

    if (farmerIds.length === 0) {
        return {
            connected_farmers: 0,
            total_lands: 0,
            total_area_m2: 0,
            active_productions: 0,
            total_harvested: 0,
            total_yield_kg: 0,
            estimated_revenue: null,
        };
    }

    // Get lands stats
    const { data: lands, error: landsError } = await supabase.from("lands").select("id, area_m2").in("user_id", farmerIds);

    if (landsError) throw landsError;

    // Get productions stats
    const { data: productions, error: prodsError } = await supabase.from("productions").select("id, status, harvest_yield_kg, selling_price_per_kg").in("user_id", farmerIds);

    if (prodsError) throw prodsError;

    const activeProductions = productions?.filter((p) => p.status !== "harvested") || [];
    const harvestedProductions = productions?.filter((p) => p.status === "harvested") || [];
    const totalYield = harvestedProductions.reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0);

    // Calculate estimated revenue from harvested productions with selling price
    const estimatedRevenue = harvestedProductions.reduce((sum, p) => {
        if (p.harvest_yield_kg && p.selling_price_per_kg) {
            return sum + p.harvest_yield_kg * p.selling_price_per_kg;
        }
        return sum;
    }, 0);

    return {
        connected_farmers: farmerIds.length,
        total_lands: lands?.length || 0,
        total_area_m2: lands?.reduce((sum, l) => sum + (l.area_m2 || 0), 0) || 0,
        active_productions: activeProductions.length,
        total_harvested: harvestedProductions.length,
        total_yield_kg: totalYield,
        estimated_revenue: estimatedRevenue > 0 ? estimatedRevenue : null,
    };
}

/**
 * Get list of connected farmers with their stats
 */
export async function getConnectedFarmers(): Promise<FarmerWithStats[]> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Get connections with farmer profiles
    const { data: connections, error: connError } = await supabase
        .from("manager_farmer_connections")
        .select(
            `
            farmer_id,
            status,
            created_at,
            farmer:user_profiles!manager_farmer_connections_farmer_id_fkey(
                id, full_name, phone, province_name, regency_name
            )
        `
        )
        .eq("manager_id", user.id)
        .eq("status", "active");

    if (connError) throw connError;
    if (!connections || connections.length === 0) return [];

    const farmerIds = connections.map((c) => c.farmer_id);

    // Get lands per farmer
    const { data: lands } = await supabase.from("lands").select("user_id, area_m2").in("user_id", farmerIds);

    // Get productions per farmer
    const { data: productions } = await supabase.from("productions").select("user_id, status, harvest_yield_kg").in("user_id", farmerIds);

    // Aggregate stats per farmer
    return connections.map((conn) => {
        const farmerLands = lands?.filter((l) => l.user_id === conn.farmer_id) || [];
        const farmerProds = productions?.filter((p) => p.user_id === conn.farmer_id) || [];
        const harvestedProds = farmerProds.filter((p) => p.status === "harvested");
        const activeProds = farmerProds.filter((p) => p.status !== "harvested");

        const farmer = conn.farmer as any;

        return {
            id: farmer.id,
            full_name: farmer.full_name,
            phone: farmer.phone,
            province_name: farmer.province_name,
            regency_name: farmer.regency_name,
            connection_status: conn.status,
            connected_since: conn.created_at,
            land_count: farmerLands.length,
            production_count: farmerProds.length,
            active_production_count: activeProds.length,
            total_yield: harvestedProds.reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0),
            total_area_m2: farmerLands.reduce((sum, l) => sum + (l.area_m2 || 0), 0),
        } as FarmerWithStats;
    });
}

/**
 * Get regional breakdown of connected farmers' data
 */
export async function getRegionalBreakdown(): Promise<RegionalBreakdown[]> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Get connected farmers with location
    const { data: connections, error } = await supabase
        .from("manager_farmer_connections")
        .select(
            `
            farmer:user_profiles!manager_farmer_connections_farmer_id_fkey(
                id, province_name, regency_name
            )
        `
        )
        .eq("manager_id", user.id)
        .eq("status", "active");

    if (error) throw error;
    if (!connections) return [];

    const farmerIds = connections.map((c) => (c.farmer as any).id);

    // Get lands and productions
    const [landsResult, prodsResult] = await Promise.all([supabase.from("lands").select("user_id, id").in("user_id", farmerIds), supabase.from("productions").select("user_id, id, harvest_yield_kg, status").in("user_id", farmerIds)]);

    // Group by region
    const regionMap = new Map<string, RegionalBreakdown>();

    connections.forEach((conn) => {
        const farmer = conn.farmer as any;
        const key = `${farmer.province_name || "Unknown"}|${farmer.regency_name || "Unknown"}`;

        if (!regionMap.has(key)) {
            regionMap.set(key, {
                province_name: farmer.province_name || "Unknown",
                regency_name: farmer.regency_name || "Unknown",
                farmer_count: 0,
                land_count: 0,
                production_count: 0,
                total_yield: 0,
            });
        }

        const region = regionMap.get(key)!;
        region.farmer_count++;

        // Count lands for this farmer
        const farmerLands = landsResult.data?.filter((l) => l.user_id === farmer.id) || [];
        region.land_count += farmerLands.length;

        // Count productions for this farmer
        const farmerProds = prodsResult.data?.filter((p) => p.user_id === farmer.id) || [];
        region.production_count += farmerProds.length;
        region.total_yield += farmerProds.filter((p) => p.status === "harvested").reduce((sum, p) => sum + (p.harvest_yield_kg || 0), 0);
    });

    return Array.from(regionMap.values());
}

/**
 * Get top performing farmers by yield
 */
export async function getTopPerformers(limit: number = 10): Promise<FarmerWithStats[]> {
    const farmers = await getConnectedFarmers();
    return farmers.sort((a, b) => b.total_yield - a.total_yield).slice(0, limit);
}

// =====================================================
// CRUD Operations for Connected Farmers
// =====================================================

/**
 * Create a land on behalf of a connected farmer
 */
export async function createLandForFarmer(farmerId: string, landData: Omit<Land, "id" | "user_id" | "created_at" | "updated_at" | "created_by" | "updated_by">): Promise<Land> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from("lands")
        .insert({
            ...landData,
            user_id: farmerId,
            created_by: user.id, // Audit trail - manager created this
        })
        .select()
        .single();

    if (error) throw error;
    return data as Land;
}

/**
 * Create a production on behalf of a connected farmer
 */
export async function createProductionForFarmer(farmerId: string, productionData: Omit<Production, "id" | "user_id" | "created_at" | "updated_at" | "created_by" | "updated_by" | "land">): Promise<Production> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from("productions")
        .insert({
            ...productionData,
            user_id: farmerId,
            created_by: user.id,
        })
        .select()
        .single();

    if (error) throw error;
    return data as Production;
}

/**
 * Get all lands for a connected farmer
 */
export async function getFarmerLands(farmerId: string): Promise<Land[]> {
    const { data, error } = await supabase.from("lands").select("*").eq("user_id", farmerId).order("created_at", { ascending: false });

    if (error) throw error;
    return data as Land[];
}

/**
 * Get all productions for a connected farmer
 */
export async function getFarmerProductions(farmerId: string): Promise<Production[]> {
    const { data, error } = await supabase.from("productions").select("*, land:lands(*)").eq("user_id", farmerId).order("created_at", { ascending: false });

    if (error) throw error;
    return data as Production[];
}

/**
 * Get all farmers (for managers to see and request connection)
 */
export async function getAllFarmers(): Promise<
    {
        id: string;
        full_name: string;
        phone: string | null;
        province_name: string | null;
        regency_name: string | null;
    }[]
> {
    const { data, error } = await supabase.from("user_profiles").select("id, full_name, phone, province_name, regency_name").eq("role", "farmer").order("full_name");

    if (error) throw error;
    return data;
}

/**
 * Get all managers (for admin to assign connections)
 */
export async function getAllManagers(): Promise<
    {
        id: string;
        full_name: string;
        phone: string | null;
    }[]
> {
    const { data, error } = await supabase.from("user_profiles").select("id, full_name, phone").eq("role", "manager").order("full_name");

    if (error) throw error;
    return data;
}
