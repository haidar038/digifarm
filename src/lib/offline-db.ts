import Dexie, { type Table } from "dexie";
import type { Land, Production, Activity } from "@/types/database";

// =====================================================
// Sync Queue Types
// =====================================================
export interface SyncQueueItem {
    id?: number;
    table: "lands" | "productions" | "activities";
    operation: "create" | "update" | "delete";
    recordId: string;
    data: Record<string, unknown>;
    timestamp: number;
    retryCount: number;
    lastError?: string;
}

// =====================================================
// Offline Cache Types (simplified versions for IndexedDB)
// =====================================================
export interface OfflineLand extends Omit<Land, "created_at" | "updated_at"> {
    created_at: number;
    updated_at: number;
    _synced: boolean;
    _localId?: string;
}

export interface OfflineProduction extends Omit<Production, "created_at" | "updated_at" | "land"> {
    created_at: number;
    updated_at: number;
    _synced: boolean;
    _localId?: string;
}

export interface OfflineActivity extends Omit<Activity, "created_at" | "updated_at" | "land" | "production"> {
    created_at: number;
    updated_at: number;
    _synced: boolean;
    _localId?: string;
}

// =====================================================
// Dexie Database Definition
// =====================================================
export class OfflineDatabase extends Dexie {
    syncQueue!: Table<SyncQueueItem>;
    lands!: Table<OfflineLand>;
    productions!: Table<OfflineProduction>;
    activities!: Table<OfflineActivity>;

    constructor() {
        super("rindang-offline");

        this.version(1).stores({
            // Sync queue for pending operations
            syncQueue: "++id, table, timestamp, retryCount",
            // Cached data tables
            lands: "id, user_id, _synced, updated_at",
            productions: "id, land_id, user_id, _synced, updated_at",
            activities: "id, production_id, user_id, _synced, updated_at",
        });
    }
}

// Singleton instance
export const offlineDb = new OfflineDatabase();

// =====================================================
// Sync Queue Operations
// =====================================================

/**
 * Add an operation to the sync queue
 */
export async function queueOperation(table: SyncQueueItem["table"], operation: SyncQueueItem["operation"], recordId: string, data: Record<string, unknown>): Promise<number> {
    return await offlineDb.syncQueue.add({
        table,
        operation,
        recordId,
        data,
        timestamp: Date.now(),
        retryCount: 0,
    });
}

/**
 * Get all pending sync operations
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return await offlineDb.syncQueue.orderBy("timestamp").toArray();
}

/**
 * Get count of pending sync operations
 */
export async function getPendingSyncCount(): Promise<number> {
    return await offlineDb.syncQueue.count();
}

/**
 * Remove a sync item after successful sync
 */
export async function removeSyncItem(id: number): Promise<void> {
    await offlineDb.syncQueue.delete(id);
}

/**
 * Mark a sync item as failed and increment retry count
 */
export async function markSyncItemFailed(id: number, error: string): Promise<void> {
    await offlineDb.syncQueue.update(id, {
        retryCount: (await offlineDb.syncQueue.get(id))?.retryCount ?? 0 + 1,
        lastError: error,
    });
}

/**
 * Clear all sync items (use with caution)
 */
export async function clearSyncQueue(): Promise<void> {
    await offlineDb.syncQueue.clear();
}

// =====================================================
// Cache Operations
// =====================================================

/**
 * Cache lands data from server
 */
export async function cacheLands(lands: Land[]): Promise<void> {
    const offlineLands: OfflineLand[] = lands.map((land) => ({
        ...land,
        created_at: new Date(land.created_at).getTime(),
        updated_at: new Date(land.updated_at).getTime(),
        _synced: true,
    }));
    await offlineDb.lands.bulkPut(offlineLands);
}

/**
 * Get cached lands
 */
export async function getCachedLands(userId?: string): Promise<OfflineLand[]> {
    if (userId) {
        return await offlineDb.lands.where("user_id").equals(userId).toArray();
    }
    return await offlineDb.lands.toArray();
}

/**
 * Cache productions data from server
 */
export async function cacheProductions(productions: Production[]): Promise<void> {
    const offlineProductions: OfflineProduction[] = productions.map((prod) => ({
        ...prod,
        created_at: new Date(prod.created_at).getTime(),
        updated_at: new Date(prod.updated_at).getTime(),
        _synced: true,
        land: undefined, // Remove relation objects
    }));
    await offlineDb.productions.bulkPut(offlineProductions);
}

/**
 * Get cached productions
 */
export async function getCachedProductions(landId?: string): Promise<OfflineProduction[]> {
    if (landId) {
        return await offlineDb.productions.where("land_id").equals(landId).toArray();
    }
    return await offlineDb.productions.toArray();
}

/**
 * Cache activities data from server
 */
export async function cacheActivities(activities: Activity[]): Promise<void> {
    const offlineActivities: OfflineActivity[] = activities.map((act) => ({
        ...act,
        created_at: new Date(act.created_at).getTime(),
        updated_at: new Date(act.updated_at).getTime(),
        _synced: true,
        land: undefined,
        production: undefined,
    }));
    await offlineDb.activities.bulkPut(offlineActivities);
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
    await Promise.all([offlineDb.lands.clear(), offlineDb.productions.clear(), offlineDb.activities.clear()]);
}
