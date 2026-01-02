// =====================================================
// Manager-Farmer Connection Types
// =====================================================
export type ConnectionStatus = "pending" | "active" | "rejected" | "revoked";
export type ConnectionType = "admin_assigned" | "manager_requested";

export interface ManagerFarmerConnection {
    id: string;
    manager_id: string;
    farmer_id: string;
    status: ConnectionStatus;
    connection_type: ConnectionType;
    created_by: string;
    created_at: string;
    updated_at: string;
    responded_at: string | null;
    revoked_at: string | null;
    revoked_by: string | null;
    request_note: string | null;
    response_note: string | null;
    // Relations (when joined)
    manager?: {
        id: string;
        full_name: string;
        phone: string | null;
    };
    farmer?: {
        id: string;
        full_name: string;
        phone: string | null;
        province_name: string | null;
        regency_name: string | null;
    };
}

export interface ConnectionRevokeRequest {
    id: string;
    connection_id: string;
    requested_by: string;
    reason: string | null;
    status: "pending" | "approved" | "rejected";
    responded_by: string | null;
    response_note: string | null;
    created_at: string;
    responded_at: string | null;
    // Relations
    connection?: ManagerFarmerConnection;
}

// =====================================================
// Core Data Types
// =====================================================
export interface Land {
    id: string;
    name: string;
    area_m2: number;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    commodities: string[];
    custom_commodity: string | null;
    photos: string[];
    status: "active" | "vacant" | "archived";
    user_id: string | null;
    created_at: string;
    updated_at: string;
    // Audit trail
    created_by: string | null;
    updated_by: string | null;
}

export interface Production {
    id: string;
    land_id: string;
    commodity: string;
    planting_date: string;
    seed_count: number;
    estimated_harvest_date: string | null;
    harvest_date: string | null;
    harvest_yield_kg: number | null;
    status: "planted" | "growing" | "harvested";
    notes: string | null;
    // Cost & Revenue tracking (optional)
    total_cost: number | null;
    selling_price_per_kg: number | null;
    user_id: string | null;
    created_at: string;
    updated_at: string;
    // Audit trail
    created_by: string | null;
    updated_by: string | null;
    land?: Land;
}

export interface Activity {
    id: string;
    land_id: string | null;
    production_id: string | null;
    activity_type: string;
    description: string;
    scheduled_date: string | null;
    completed_at: string | null;
    status: "pending" | "in_progress" | "completed";
    user_id: string | null;
    created_at: string;
    updated_at: string;
    // Audit trail
    created_by: string | null;
    updated_by: string | null;
    land?: Land;
    production?: Production;
}

// =====================================================
// Manager Dashboard Types
// =====================================================
export interface FarmerWithStats {
    id: string;
    full_name: string;
    phone: string | null;
    province_name: string | null;
    regency_name: string | null;
    connection_status: ConnectionStatus;
    connected_since: string | null;
    land_count: number;
    production_count: number;
    active_production_count: number;
    total_yield: number;
    total_area_m2: number;
}

export interface ManagerStats {
    connected_farmers: number;
    total_lands: number;
    total_area_m2: number;
    active_productions: number;
    total_harvested: number;
    total_yield_kg: number;
    estimated_revenue: number | null;
}

export interface RegionalBreakdown {
    province_name: string;
    regency_name: string;
    farmer_count: number;
    land_count: number;
    production_count: number;
    total_yield: number;
}

// =====================================================
// Constants
// =====================================================
export const COMMODITIES = ["Red Chili", "Rawit Chili", "Tomatoes", "Shallots", "Garlic", "Others"] as const;

export type CommodityType = (typeof COMMODITIES)[number];
