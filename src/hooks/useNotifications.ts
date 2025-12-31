/**
 * Custom hook for managing notifications in DigiFarm
 * Combines production data and weather data to generate contextual notifications
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Production } from "@/types/database";
import { Notification, NotificationState, DEFAULT_REMINDER_CONFIG } from "@/types/notifications";
import { generateAllNotifications, sortNotificationsByPriority, filterUnreadNotifications } from "@/lib/notification-utils";
import { useWeather } from "@/hooks/useWeather";

const STORAGE_KEY = "digifarm_notification_read_status";

/**
 * Load read status from localStorage
 */
function loadReadStatus(): Record<string, boolean> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

/**
 * Save read status to localStorage
 */
function saveReadStatus(readStatus: Record<string, boolean>): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(readStatus));
    } catch {
        console.error("Failed to save notification read status");
    }
}

export function useNotifications() {
    const [readStatus, setReadStatus] = useState<Record<string, boolean>>(loadReadStatus);

    // Fetch productions
    const { data: productions = [], isLoading: isLoadingProductions } = useQuery({
        queryKey: ["productions-for-notifications"],
        queryFn: async () => {
            const { data, error } = await supabase.from("productions").select("*").neq("status", "harvested");

            if (error) throw error;
            return data as Production[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // 10 minutes
    });

    // Use weather hook
    const { data: weatherData, isLoading: isLoadingWeather } = useWeather();

    // Generate notifications
    const notifications = useMemo<Notification[]>(() => {
        if (!weatherData) {
            return [];
        }

        const weatherCode = weatherData.current.weatherCode;
        const humidity = weatherData.current.humidity;
        const rainProbability = weatherData.hourly?.[0]?.precipitationProbability ?? 0;
        const currentDate = new Date();

        const allNotifications = generateAllNotifications(productions, weatherCode, humidity, rainProbability, currentDate, DEFAULT_REMINDER_CONFIG);

        // Apply read status from localStorage
        const notificationsWithReadStatus = allNotifications.map((notification) => ({
            ...notification,
            read: readStatus[notification.id] ?? false,
        }));

        return sortNotificationsByPriority(notificationsWithReadStatus);
    }, [productions, weatherData, readStatus]);

    // Get unread notifications
    const unreadNotifications = useMemo(() => {
        return filterUnreadNotifications(notifications);
    }, [notifications]);

    // State
    const state: NotificationState = {
        notifications,
        unreadCount: unreadNotifications.length,
    };

    // Mark single notification as read
    const markAsRead = useCallback((notificationId: string) => {
        setReadStatus((prev) => {
            const newStatus = { ...prev, [notificationId]: true };
            saveReadStatus(newStatus);
            return newStatus;
        });
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(() => {
        setReadStatus((prev) => {
            const newStatus = { ...prev };
            notifications.forEach((n) => {
                newStatus[n.id] = true;
            });
            saveReadStatus(newStatus);
            return newStatus;
        });
    }, [notifications]);

    // Clear old read status (notifications older than 7 days)
    useEffect(() => {
        const cleanup = () => {
            const currentNotificationIds = new Set(notifications.map((n) => n.id));
            const storedStatus = loadReadStatus();
            const cleanedStatus: Record<string, boolean> = {};

            // Only keep read status for current notifications
            Object.keys(storedStatus).forEach((id) => {
                if (currentNotificationIds.has(id)) {
                    cleanedStatus[id] = storedStatus[id];
                }
            });

            if (Object.keys(cleanedStatus).length !== Object.keys(storedStatus).length) {
                saveReadStatus(cleanedStatus);
                setReadStatus(cleanedStatus);
            }
        };

        // Run cleanup periodically
        const timer = setInterval(cleanup, 60 * 60 * 1000); // Every hour
        return () => clearInterval(timer);
    }, [notifications]);

    return {
        ...state,
        isLoading: isLoadingProductions || isLoadingWeather,
        markAsRead,
        markAllAsRead,
        unreadNotifications,
    };
}
