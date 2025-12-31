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
    created_at: string;
    updated_at: string;
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
    created_at: string;
    updated_at: string;
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
    created_at: string;
    updated_at: string;
    land?: Land;
    production?: Production;
}

export const COMMODITIES = ["Red Chili", "Rawit Chili", "Tomatoes", "Shallots", "Garlic", "Others"] as const;

export type CommodityType = (typeof COMMODITIES)[number];
