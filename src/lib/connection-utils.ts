import { supabase } from "@/integrations/supabase/client";
import type { ManagerFarmerConnection, ConnectionStatus, ConnectionType } from "@/types/database";

// =====================================================
// Connection Management Functions
// =====================================================

/**
 * Request a connection to a farmer (Manager only)
 */
export async function requestConnection(farmerId: string, note?: string): Promise<ManagerFarmerConnection> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from("manager_farmer_connections")
        .insert({
            manager_id: user.id,
            farmer_id: farmerId,
            status: "pending" as ConnectionStatus,
            connection_type: "manager_requested" as ConnectionType,
            created_by: user.id,
            request_note: note || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data as ManagerFarmerConnection;
}

/**
 * Approve a pending connection request (Farmer only)
 */
export async function approveConnection(connectionId: string, note?: string): Promise<ManagerFarmerConnection> {
    const { data, error } = await supabase
        .from("manager_farmer_connections")
        .update({
            status: "active" as ConnectionStatus,
            responded_at: new Date().toISOString(),
            response_note: note || null,
        })
        .eq("id", connectionId)
        .select()
        .single();

    if (error) throw error;
    return data as ManagerFarmerConnection;
}

/**
 * Reject a pending connection request (Farmer only)
 */
export async function rejectConnection(connectionId: string, note?: string): Promise<ManagerFarmerConnection> {
    const { data, error } = await supabase
        .from("manager_farmer_connections")
        .update({
            status: "rejected" as ConnectionStatus,
            responded_at: new Date().toISOString(),
            response_note: note || null,
        })
        .eq("id", connectionId)
        .select()
        .single();

    if (error) throw error;
    return data as ManagerFarmerConnection;
}

/**
 * Revoke an active connection (Admin only)
 */
export async function revokeConnection(connectionId: string): Promise<ManagerFarmerConnection> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from("manager_farmer_connections")
        .update({
            status: "revoked" as ConnectionStatus,
            revoked_at: new Date().toISOString(),
            revoked_by: user.id,
        })
        .eq("id", connectionId)
        .select()
        .single();

    if (error) throw error;
    return data as ManagerFarmerConnection;
}

/**
 * Assign a farmer to a manager (Admin only)
 */
export async function assignConnection(managerId: string, farmerId: string, note?: string): Promise<ManagerFarmerConnection> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from("manager_farmer_connections")
        .insert({
            manager_id: managerId,
            farmer_id: farmerId,
            status: "active" as ConnectionStatus, // Admin assigned = immediately active
            connection_type: "admin_assigned" as ConnectionType,
            created_by: user.id,
            responded_at: new Date().toISOString(),
            request_note: note || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data as ManagerFarmerConnection;
}

// =====================================================
// Query Functions
// =====================================================

/**
 * Get all connections for the current user (as manager or farmer)
 */
export async function getMyConnections(): Promise<ManagerFarmerConnection[]> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from("manager_farmer_connections")
        .select(
            `
            *,
            manager:user_profiles!manager_farmer_connections_manager_id_fkey(id, full_name, phone),
            farmer:user_profiles!manager_farmer_connections_farmer_id_fkey(id, full_name, phone, province_name, regency_name)
        `
        )
        .or(`manager_id.eq.${user.id},farmer_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data as ManagerFarmerConnection[];
}

/**
 * Get all connections (Admin only)
 */
export async function getAllConnections(): Promise<ManagerFarmerConnection[]> {
    const { data, error } = await supabase
        .from("manager_farmer_connections")
        .select(
            `
            *,
            manager:user_profiles!manager_farmer_connections_manager_id_fkey(id, full_name, phone),
            farmer:user_profiles!manager_farmer_connections_farmer_id_fkey(id, full_name, phone, province_name, regency_name)
        `
        )
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data as ManagerFarmerConnection[];
}

/**
 * Get pending connection requests for the current farmer
 */
export async function getPendingRequests(): Promise<ManagerFarmerConnection[]> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from("manager_farmer_connections")
        .select(
            `
            *,
            manager:user_profiles!manager_farmer_connections_manager_id_fkey(id, full_name, phone)
        `
        )
        .eq("farmer_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data as ManagerFarmerConnection[];
}

/**
 * Get the current farmer's manager (if connected)
 */
export async function getMyManager(): Promise<ManagerFarmerConnection | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from("manager_farmer_connections")
        .select(
            `
            *,
            manager:user_profiles!manager_farmer_connections_manager_id_fkey(id, full_name, phone)
        `
        )
        .eq("farmer_id", user.id)
        .eq("status", "active")
        .maybeSingle();

    if (error) throw error;
    return data as ManagerFarmerConnection | null;
}

/**
 * Check if a farmer already has an active or pending connection
 */
export async function checkFarmerConnectionStatus(farmerId: string): Promise<{
    hasActiveConnection: boolean;
    hasPendingRequest: boolean;
    connection: ManagerFarmerConnection | null;
}> {
    const { data, error } = await supabase.from("manager_farmer_connections").select("*").eq("farmer_id", farmerId).in("status", ["active", "pending"]).maybeSingle();

    if (error) throw error;

    return {
        hasActiveConnection: data?.status === "active",
        hasPendingRequest: data?.status === "pending",
        connection: data as ManagerFarmerConnection | null,
    };
}

// =====================================================
// Revoke Request Functions
// =====================================================

/**
 * Request to revoke a connection (Farmer only)
 */
export async function requestRevoke(connectionId: string, reason?: string): Promise<void> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase.from("connection_revoke_requests").insert({
        connection_id: connectionId,
        requested_by: user.id,
        reason: reason || null,
    });

    if (error) throw error;
}

/**
 * Approve a revoke request (Admin only)
 */
export async function approveRevokeRequest(requestId: string, note?: string): Promise<void> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Get the revoke request to find the connection
    const { data: request, error: fetchError } = await supabase.from("connection_revoke_requests").select("connection_id").eq("id", requestId).single();

    if (fetchError) throw fetchError;

    // Update the revoke request
    const { error: updateError } = await supabase
        .from("connection_revoke_requests")
        .update({
            status: "approved",
            responded_by: user.id,
            response_note: note || null,
            responded_at: new Date().toISOString(),
        })
        .eq("id", requestId);

    if (updateError) throw updateError;

    // Revoke the connection
    await revokeConnection(request.connection_id);
}

/**
 * Reject a revoke request (Admin only)
 */
export async function rejectRevokeRequest(requestId: string, note?: string): Promise<void> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
        .from("connection_revoke_requests")
        .update({
            status: "rejected",
            responded_by: user.id,
            response_note: note || null,
            responded_at: new Date().toISOString(),
        })
        .eq("id", requestId);

    if (error) throw error;
}

/**
 * Get pending revoke requests (Admin only)
 */
export async function getPendingRevokeRequests(): Promise<any[]> {
    const { data, error } = await supabase
        .from("connection_revoke_requests")
        .select(
            `
            *,
            connection:manager_farmer_connections(
                *,
                manager:user_profiles!manager_farmer_connections_manager_id_fkey(id, full_name),
                farmer:user_profiles!manager_farmer_connections_farmer_id_fkey(id, full_name)
            )
        `
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}
