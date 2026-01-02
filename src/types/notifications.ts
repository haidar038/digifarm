/**
 * Notification system types and interfaces
 * For reminder and alert functionality in DigiFarm
 */

export type NotificationType = "harvest_reminder" | "weather_alert" | "fertilization_reminder" | "watering_reminder";

export type NotificationPriority = "high" | "medium" | "low";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    priority: NotificationPriority;
    createdAt: Date;
    read: boolean;
    productionId?: string;
    landId?: string;
    /** Days until event (for harvest reminders) */
    daysUntil?: number;
    /** Weather code for weather alerts */
    weatherCode?: number;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
}

/**
 * Configuration for reminder generation
 */
export interface ReminderConfig {
    /** Days before harvest to trigger reminders */
    harvestReminderDays: number[];
    /** Days since planting to suggest fertilization */
    fertilizationIntervalDays: number;
    /** Minimum humidity to skip watering reminder */
    skipWateringHumidityThreshold: number;
}

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
    harvestReminderDays: [7, 3, 1, 0],
    fertilizationIntervalDays: 14,
    skipWateringHumidityThreshold: 70,
};

/**
 * Weather codes that trigger alerts
 * Based on WMO Weather interpretation codes
 */
export const EXTREME_WEATHER_CODES = {
    // Heavy rain
    65: "Hujan Lebat",
    66: "Hujan Es Ringan",
    67: "Hujan Es Lebat",
    80: "Hujan Lebat Sesaat",
    81: "Hujan Lebat",
    82: "Hujan Sangat Lebat",
    // Thunderstorms
    95: "Badai Petir",
    96: "Badai Petir Hujan Es Ringan",
    99: "Badai Petir Hujan Es",
} as const;

export type ExtremeWeatherCode = keyof typeof EXTREME_WEATHER_CODES;
