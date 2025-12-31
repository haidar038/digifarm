/**
 * Notification utility functions for generating reminders and alerts
 * These functions are pure and extracted for better testability
 */

import { Production } from "@/types/database";
import { Notification, NotificationType, NotificationPriority, ReminderConfig, DEFAULT_REMINDER_CONFIG, EXTREME_WEATHER_CODES, ExtremeWeatherCode } from "@/types/notifications";

/**
 * Generate a unique notification ID
 */
export function generateNotificationId(type: NotificationType, relatedId: string, suffix?: string): string {
    return `${type}-${relatedId}${suffix ? `-${suffix}` : ""}`;
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2.getTime() - date1.getTime()) / oneDay);
}

/**
 * Determine priority based on days until event
 */
export function getPriorityByDays(daysUntil: number): NotificationPriority {
    if (daysUntil <= 1) return "high";
    if (daysUntil <= 3) return "medium";
    return "low";
}

/**
 * Generate harvest reminder notifications for productions approaching harvest date
 */
export function generateHarvestReminders(productions: Production[], currentDate: Date = new Date(), config: ReminderConfig = DEFAULT_REMINDER_CONFIG): Notification[] {
    const notifications: Notification[] = [];

    productions.forEach((production) => {
        // Skip already harvested or productions without estimated harvest date
        if (production.status === "harvested" || !production.estimated_harvest_date) {
            return;
        }

        const harvestDate = new Date(production.estimated_harvest_date);
        const daysUntil = daysBetween(currentDate, harvestDate);

        // Check if days until harvest matches any reminder day
        config.harvestReminderDays.forEach((reminderDay) => {
            if (daysUntil === reminderDay) {
                notifications.push({
                    id: generateNotificationId("harvest_reminder", production.id, `${daysUntil}d`),
                    type: "harvest_reminder",
                    title: `Persiapan Panen: ${production.commodity}`,
                    message: daysUntil === 1 ? `${production.commodity} akan siap panen besok!` : `${production.commodity} akan siap panen dalam ${daysUntil} hari.`,
                    priority: getPriorityByDays(daysUntil),
                    createdAt: currentDate,
                    read: false,
                    productionId: production.id,
                    landId: production.land_id,
                    daysUntil,
                });
            }
        });

        // Also notify if harvest is overdue (negative days)
        if (daysUntil < 0 && daysUntil >= -3) {
            notifications.push({
                id: generateNotificationId("harvest_reminder", production.id, "overdue"),
                type: "harvest_reminder",
                title: `Panen Tertunda: ${production.commodity}`,
                message: `${production.commodity} sudah melewati perkiraan panen ${Math.abs(daysUntil)} hari!`,
                priority: "high",
                createdAt: currentDate,
                read: false,
                productionId: production.id,
                landId: production.land_id,
                daysUntil,
            });
        }
    });

    return notifications;
}

/**
 * Check if weather code is extreme
 */
export function isExtremeWeather(weatherCode: number): boolean {
    return weatherCode in EXTREME_WEATHER_CODES;
}

/**
 * Get extreme weather description
 */
export function getExtremeWeatherDescription(weatherCode: number): string {
    return EXTREME_WEATHER_CODES[weatherCode as ExtremeWeatherCode] || "Cuaca Ekstrem";
}

/**
 * Generate weather alert notifications based on current/forecast weather
 */
export function generateWeatherAlerts(weatherCode: number, currentDate: Date = new Date()): Notification[] {
    const notifications: Notification[] = [];

    if (isExtremeWeather(weatherCode)) {
        const description = getExtremeWeatherDescription(weatherCode);
        notifications.push({
            id: generateNotificationId("weather_alert", `${weatherCode}`, currentDate.toISOString().split("T")[0]),
            type: "weather_alert",
            title: `⚠️ Peringatan Cuaca: ${description}`,
            message: `Kondisi cuaca saat ini: ${description}. Lindungi tanaman dan pertimbangkan untuk menunda aktivitas di luar ruangan.`,
            priority: "high",
            createdAt: currentDate,
            read: false,
            weatherCode,
        });
    }

    return notifications;
}

/**
 * Generate fertilization reminders based on planting age
 */
export function generateFertilizationReminders(productions: Production[], currentDate: Date = new Date(), config: ReminderConfig = DEFAULT_REMINDER_CONFIG): Notification[] {
    const notifications: Notification[] = [];

    productions.forEach((production) => {
        // Skip harvested productions
        if (production.status === "harvested") {
            return;
        }

        const plantingDate = new Date(production.planting_date);
        const daysSincePlanting = daysBetween(plantingDate, currentDate);

        // Check if it's time for fertilization (every interval days)
        if (daysSincePlanting > 0 && daysSincePlanting % config.fertilizationIntervalDays === 0) {
            notifications.push({
                id: generateNotificationId("fertilization_reminder", production.id, `${daysSincePlanting}d`),
                type: "fertilization_reminder",
                title: `Jadwal Pemupukan: ${production.commodity}`,
                message: `Sudah ${daysSincePlanting} hari sejak penanaman. Waktunya pemupukan untuk ${production.commodity}.`,
                priority: "medium",
                createdAt: currentDate,
                read: false,
                productionId: production.id,
                landId: production.land_id,
            });
        }
    });

    return notifications;
}

/**
 * Generate watering reminders based on humidity and rain probability
 */
export function generateWateringReminders(productions: Production[], humidity: number, rainProbability: number, currentDate: Date = new Date(), config: ReminderConfig = DEFAULT_REMINDER_CONFIG): Notification[] {
    const notifications: Notification[] = [];

    // Skip if humidity is high enough or rain is expected
    if (humidity >= config.skipWateringHumidityThreshold || rainProbability >= 70) {
        return notifications;
    }

    // Get unique active productions to avoid duplicate reminders
    const activeProductions = productions.filter((p) => p.status !== "harvested");

    if (activeProductions.length > 0) {
        // Create a single reminder for all active productions
        notifications.push({
            id: generateNotificationId("watering_reminder", "daily", currentDate.toISOString().split("T")[0]),
            type: "watering_reminder",
            title: "💧 Pengingat Penyiraman",
            message: `Kelembaban rendah (${humidity}%) dan kemungkinan hujan kecil (${rainProbability}%). ${activeProductions.length} tanaman aktif perlu disiram.`,
            priority: humidity < 50 ? "high" : "medium",
            createdAt: currentDate,
            read: false,
        });
    }

    return notifications;
}

/**
 * Combine all notification generators
 */
export function generateAllNotifications(productions: Production[], weatherCode: number, humidity: number, rainProbability: number, currentDate: Date = new Date(), config: ReminderConfig = DEFAULT_REMINDER_CONFIG): Notification[] {
    const harvestReminders = generateHarvestReminders(productions, currentDate, config);
    const weatherAlerts = generateWeatherAlerts(weatherCode, currentDate);
    const fertilizationReminders = generateFertilizationReminders(productions, currentDate, config);
    const wateringReminders = generateWateringReminders(productions, humidity, rainProbability, currentDate, config);

    return [
        ...weatherAlerts, // Weather alerts first (highest priority)
        ...harvestReminders,
        ...fertilizationReminders,
        ...wateringReminders,
    ];
}

/**
 * Sort notifications by priority and date
 */
export function sortNotificationsByPriority(notifications: Notification[]): Notification[] {
    const priorityOrder: Record<NotificationPriority, number> = {
        high: 0,
        medium: 1,
        low: 2,
    };

    return [...notifications].sort((a, b) => {
        // First sort by priority
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then sort by date (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

/**
 * Filter unread notifications
 */
export function filterUnreadNotifications(notifications: Notification[]): Notification[] {
    return notifications.filter((n) => !n.read);
}

/**
 * Get notification icon name based on type
 */
export function getNotificationIcon(type: NotificationType): string {
    switch (type) {
        case "harvest_reminder":
            return "Wheat";
        case "weather_alert":
            return "CloudRain";
        case "fertilization_reminder":
            return "Leaf";
        case "watering_reminder":
            return "Droplets";
        default:
            return "Bell";
    }
}

/**
 * Get notification color based on priority
 */
export function getNotificationColor(priority: NotificationPriority): string {
    switch (priority) {
        case "high":
            return "text-red-500";
        case "medium":
            return "text-yellow-500";
        case "low":
            return "text-blue-500";
        default:
            return "text-gray-500";
    }
}
