import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

export interface RealtimePayload<T = Record<string, unknown>> {
    eventType: RealtimeEvent;
    new: T;
    old: T;
}

interface UseRealtimeSubscriptionOptions<T> {
    /** Table name to subscribe to */
    table: string;
    /** Schema name (default: "public") */
    schema?: string;
    /** Optional filter expression (e.g., "user_id=eq.123") */
    filter?: string;
    /** Callback for INSERT events */
    onInsert?: (payload: RealtimePayload<T>) => void;
    /** Callback for UPDATE events */
    onUpdate?: (payload: RealtimePayload<T>) => void;
    /** Callback for DELETE events */
    onDelete?: (payload: RealtimePayload<T>) => void;
    /** Callback for any change (INSERT, UPDATE, DELETE) */
    onChange?: (payload: RealtimePayload<T>) => void;
    /** Whether the subscription is enabled (default: true) */
    enabled?: boolean;
}

/**
 * Hook for subscribing to Supabase Realtime changes on a table.
 *
 * @example
 * ```tsx
 * // Basic usage - refresh data on any change
 * useRealtimeSubscription({
 *   table: "lands",
 *   onChange: () => fetchLands(),
 * });
 *
 * // With specific event handlers
 * useRealtimeSubscription({
 *   table: "productions",
 *   onInsert: (payload) => console.log("New production:", payload.new),
 *   onUpdate: (payload) => console.log("Updated:", payload.new),
 *   onDelete: (payload) => console.log("Deleted:", payload.old),
 * });
 *
 * // With filter
 * useRealtimeSubscription({
 *   table: "notifications",
 *   filter: `user_id=eq.${userId}`,
 *   onChange: () => refetchNotifications(),
 * });
 * ```
 */
export function useRealtimeSubscription<T = Record<string, unknown>>(options: UseRealtimeSubscriptionOptions<T>) {
    const { table, schema = "public", filter, onInsert, onUpdate, onDelete, onChange, enabled = true } = options;

    // Use refs to avoid recreating subscription on callback changes
    const onInsertRef = useRef(onInsert);
    const onUpdateRef = useRef(onUpdate);
    const onDeleteRef = useRef(onDelete);
    const onChangeRef = useRef(onChange);

    // Update refs when callbacks change
    useEffect(() => {
        onInsertRef.current = onInsert;
        onUpdateRef.current = onUpdate;
        onDeleteRef.current = onDelete;
        onChangeRef.current = onChange;
    }, [onInsert, onUpdate, onDelete, onChange]);

    const handlePayload = useCallback((rawPayload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        const payload: RealtimePayload<T> = {
            eventType: rawPayload.eventType as RealtimeEvent,
            new: rawPayload.new as T,
            old: rawPayload.old as T,
        };

        // Call specific event handler
        switch (payload.eventType) {
            case "INSERT":
                onInsertRef.current?.(payload);
                break;
            case "UPDATE":
                onUpdateRef.current?.(payload);
                break;
            case "DELETE":
                onDeleteRef.current?.(payload);
                break;
        }

        // Call general onChange handler
        onChangeRef.current?.(payload);
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // Generate unique channel name
        const channelName = `${schema}_${table}_changes_${Date.now()}`;

        // Build the subscription options
        const subscriptionOptions: {
            event: "*";
            schema: string;
            table: string;
            filter?: string;
        } = {
            event: "*",
            schema,
            table,
        };

        if (filter) {
            subscriptionOptions.filter = filter;
        }

        // Create the channel and subscribe
        const channel: RealtimeChannel = supabase
            .channel(channelName)
            .on("postgres_changes", subscriptionOptions, handlePayload)
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.debug(`[Realtime] Subscribed to ${table}`);
                } else if (status === "CHANNEL_ERROR") {
                    console.error(`[Realtime] Error subscribing to ${table}`);
                }
            });

        // Cleanup on unmount or when dependencies change
        return () => {
            console.debug(`[Realtime] Unsubscribing from ${table}`);
            supabase.removeChannel(channel);
        };
    }, [table, schema, filter, enabled, handlePayload]);
}

/**
 * Simplified hook that just triggers a callback on any table change.
 * Useful for simple "refresh on change" scenarios.
 *
 * @example
 * ```tsx
 * useRealtimeRefresh("lands", fetchLands);
 * ```
 */
export function useRealtimeRefresh(table: string, onRefresh: () => void, enabled = true) {
    useRealtimeSubscription({
        table,
        onChange: onRefresh,
        enabled,
    });
}
