/**
 * Conflict Detection and Resolution for Offline Sync
 *
 * When syncing offline changes back to the server, conflicts can occur
 * if the same record was modified both offline and on the server.
 * This module provides utilities to detect and resolve such conflicts.
 */

// =====================================================
// Types
// =====================================================

export interface ConflictField {
    field: string;
    localValue: unknown;
    serverValue: unknown;
}

export interface Conflict {
    recordId: string;
    table: string;
    localTimestamp: number;
    serverTimestamp: number;
    conflictingFields: ConflictField[];
    localData: Record<string, unknown>;
    serverData: Record<string, unknown>;
}

export type ConflictResolutionStrategy = "local_wins" | "server_wins" | "merge" | "manual";

export interface ConflictResolution {
    strategy: ConflictResolutionStrategy;
    resolvedData: Record<string, unknown>;
}

// =====================================================
// Detection Functions
// =====================================================

/**
 * Detect if there is a conflict between local and server data
 * A conflict occurs when both have been modified after the last sync
 */
export function detectConflict(localData: Record<string, unknown>, serverData: Record<string, unknown>, lastSyncTimestamp: number): Conflict | null {
    const localUpdatedAt = (localData.updated_at as number) || (localData._updated_at as number);
    const serverUpdatedAt = new Date(serverData.updated_at as string).getTime();

    // No conflict if server hasn't changed since last sync
    if (serverUpdatedAt <= lastSyncTimestamp) {
        return null;
    }

    // No conflict if local hasn't changed since last sync
    if (localUpdatedAt <= lastSyncTimestamp) {
        return null;
    }

    // Both have changed - find conflicting fields
    const conflictingFields = findConflictingFields(localData, serverData);

    if (conflictingFields.length === 0) {
        return null;
    }

    return {
        recordId: (localData.id as string) || (serverData.id as string),
        table: "", // To be set by caller
        localTimestamp: localUpdatedAt,
        serverTimestamp: serverUpdatedAt,
        conflictingFields,
        localData,
        serverData,
    };
}

/**
 * Find fields that have different values between local and server data
 */
export function findConflictingFields(localData: Record<string, unknown>, serverData: Record<string, unknown>): ConflictField[] {
    const conflicts: ConflictField[] = [];
    const ignoredFields = ["id", "created_at", "updated_at", "_synced", "_localId", "user_id", "created_by", "updated_by"];

    for (const field of Object.keys(localData)) {
        if (ignoredFields.includes(field)) continue;
        if (field.startsWith("_")) continue;

        const localValue = localData[field];
        const serverValue = serverData[field];

        if (!isEqual(localValue, serverValue)) {
            conflicts.push({
                field,
                localValue,
                serverValue,
            });
        }
    }

    return conflicts;
}

// =====================================================
// Resolution Functions
// =====================================================

/**
 * Resolve a conflict using the specified strategy
 */
export function resolveConflict(conflict: Conflict, strategy: ConflictResolutionStrategy, manualResolutions?: Record<string, unknown>): ConflictResolution {
    switch (strategy) {
        case "local_wins":
            return {
                strategy,
                resolvedData: {
                    ...conflict.serverData,
                    ...conflict.localData,
                    updated_at: new Date().toISOString(),
                },
            };

        case "server_wins":
            return {
                strategy,
                resolvedData: {
                    ...conflict.localData,
                    ...conflict.serverData,
                },
            };

        case "merge":
            return {
                strategy,
                resolvedData: mergeData(conflict),
            };

        case "manual":
            if (!manualResolutions) {
                throw new Error("Manual resolutions required for manual strategy");
            }
            return {
                strategy,
                resolvedData: {
                    ...conflict.serverData,
                    ...manualResolutions,
                    updated_at: new Date().toISOString(),
                },
            };

        default:
            throw new Error(`Unknown resolution strategy: ${strategy}`);
    }
}

/**
 * Merge data using a smart merge strategy
 * - Numeric fields: take the higher value (for things like counts)
 * - String fields: take the most recent change
 * - Boolean fields: take the local value
 * - Array fields: merge unique values
 */
export function mergeData(conflict: Conflict): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...conflict.serverData };

    for (const conflictField of conflict.conflictingFields) {
        const { field, localValue, serverValue } = conflictField;

        if (typeof localValue === "number" && typeof serverValue === "number") {
            // For numbers, take the higher value (suitable for counts, amounts)
            // This is a simplistic strategy - real apps might need more nuance
            merged[field] = Math.max(localValue, serverValue);
        } else if (Array.isArray(localValue) && Array.isArray(serverValue)) {
            // Merge arrays with unique values
            merged[field] = [...new Set([...serverValue, ...localValue])];
        } else if (typeof localValue === "boolean" && typeof serverValue === "boolean") {
            // For booleans, take the local value (user's explicit choice)
            merged[field] = localValue;
        } else if (conflict.localTimestamp > conflict.serverTimestamp) {
            // For other types, take the most recent change
            merged[field] = localValue;
        }
        // Otherwise keep serverValue (already in merged)
    }

    merged.updated_at = new Date().toISOString();
    return merged;
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Deep equality check for values
 */
function isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((val, idx) => isEqual(val, b[idx]));
    }

    if (typeof a === "object" && typeof b === "object") {
        const aKeys = Object.keys(a as object);
        const bKeys = Object.keys(b as object);
        if (aKeys.length !== bKeys.length) return false;
        return aKeys.every((key) => isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
    }

    return false;
}

/**
 * Format a conflict for display
 */
export function formatConflictForDisplay(conflict: Conflict): string {
    const lines = [
        `Record ID: ${conflict.recordId}`,
        `Table: ${conflict.table}`,
        "",
        "Conflicting Fields:",
        ...conflict.conflictingFields.map((f) => `  ${f.field}: Local = ${JSON.stringify(f.localValue)}, Server = ${JSON.stringify(f.serverValue)}`),
    ];
    return lines.join("\n");
}
