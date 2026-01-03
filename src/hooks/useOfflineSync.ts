import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { offlineDb, queueOperation, getPendingSyncItems, getPendingSyncCount, removeSyncItem, markSyncItemFailed, type SyncQueueItem } from "@/lib/offline-db";
import { toast } from "sonner";

const MAX_RETRY_COUNT = 3;

interface UseOfflineSyncReturn {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
    lastSyncTime: Date | null;
    queueCreate: (table: SyncQueueItem["table"], recordId: string, data: Record<string, unknown>) => Promise<void>;
    queueUpdate: (table: SyncQueueItem["table"], recordId: string, data: Record<string, unknown>) => Promise<void>;
    queueDelete: (table: SyncQueueItem["table"], recordId: string) => Promise<void>;
    syncNow: () => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    // Update pending count
    const updatePendingCount = useCallback(async () => {
        const count = await getPendingSyncCount();
        setPendingCount(count);
    }, []);

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Kembali online! Data akan disinkronkan...");
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning("Anda sedang offline. Perubahan akan disimpan lokal.");
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Initial count
        updatePendingCount();

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [updatePendingCount]);

    // Auto-sync when coming back online
    useEffect(() => {
        if (isOnline && pendingCount > 0) {
            syncNow();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline]);

    // Process a single sync item
    const processSyncItem = async (item: SyncQueueItem): Promise<boolean> => {
        try {
            const { table, operation, recordId, data } = item;

            switch (operation) {
                case "create": {
                    const { error } = await supabase.from(table).insert(data as never);
                    if (error) throw error;
                    break;
                }
                case "update": {
                    const { error } = await supabase
                        .from(table)
                        .update(data as never)
                        .eq("id", recordId);
                    if (error) throw error;
                    break;
                }
                case "delete": {
                    const { error } = await supabase.from(table).delete().eq("id", recordId);
                    if (error) throw error;
                    break;
                }
            }

            // Mark as synced in local cache
            const localTable = offlineDb.table(table);
            if (operation === "delete") {
                await localTable.delete(recordId);
            } else {
                await localTable.update(recordId, { _synced: true });
            }

            return true;
        } catch (error) {
            console.error("Sync item failed:", error);
            return false;
        }
    };

    // Sync all pending items
    const syncNow = useCallback(async () => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);
        const items = await getPendingSyncItems();
        let successCount = 0;
        let failCount = 0;

        for (const item of items) {
            if (item.retryCount >= MAX_RETRY_COUNT) {
                // Skip items that have failed too many times
                failCount++;
                continue;
            }

            const success = await processSyncItem(item);

            if (success && item.id) {
                await removeSyncItem(item.id);
                successCount++;
            } else if (item.id) {
                await markSyncItemFailed(item.id, "Sync failed");
                failCount++;
            }
        }

        await updatePendingCount();
        setIsSyncing(false);
        setLastSyncTime(new Date());

        if (successCount > 0) {
            toast.success(`${successCount} perubahan berhasil disinkronkan`);
        }
        if (failCount > 0) {
            toast.error(`${failCount} perubahan gagal disinkronkan`);
        }
    }, [isOnline, isSyncing, updatePendingCount]);

    // Queue a create operation
    const queueCreate = useCallback(
        async (table: SyncQueueItem["table"], recordId: string, data: Record<string, unknown>) => {
            // Save to local cache first
            const localTable = offlineDb.table(table);
            await localTable.put({
                ...data,
                id: recordId,
                _synced: false,
                created_at: Date.now(),
                updated_at: Date.now(),
            });

            // Add to sync queue
            await queueOperation(table, "create", recordId, data);
            await updatePendingCount();

            // Try immediate sync if online
            if (isOnline) {
                syncNow();
            }
        },
        [isOnline, syncNow, updatePendingCount]
    );

    // Queue an update operation
    const queueUpdate = useCallback(
        async (table: SyncQueueItem["table"], recordId: string, data: Record<string, unknown>) => {
            // Update local cache
            const localTable = offlineDb.table(table);
            await localTable.update(recordId, {
                ...data,
                _synced: false,
                updated_at: Date.now(),
            });

            // Add to sync queue
            await queueOperation(table, "update", recordId, data);
            await updatePendingCount();

            if (isOnline) {
                syncNow();
            }
        },
        [isOnline, syncNow, updatePendingCount]
    );

    // Queue a delete operation
    const queueDelete = useCallback(
        async (table: SyncQueueItem["table"], recordId: string) => {
            // Mark as deleted in local cache (don't actually delete yet)
            const localTable = offlineDb.table(table);
            await localTable.update(recordId, { _synced: false });

            // Add to sync queue
            await queueOperation(table, "delete", recordId, {});
            await updatePendingCount();

            if (isOnline) {
                syncNow();
            }
        },
        [isOnline, syncNow, updatePendingCount]
    );

    return {
        isOnline,
        pendingCount,
        isSyncing,
        lastSyncTime,
        queueCreate,
        queueUpdate,
        queueDelete,
        syncNow,
    };
}
