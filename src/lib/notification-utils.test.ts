import { describe, it, expect } from "vitest";
import {
    generateNotificationId,
    daysBetween,
    getPriorityByDays,
    generateHarvestReminders,
    isExtremeWeather,
    getExtremeWeatherDescription,
    generateWeatherAlerts,
    generateFertilizationReminders,
    generateWateringReminders,
    generateAllNotifications,
    sortNotificationsByPriority,
    filterUnreadNotifications,
    getNotificationIcon,
    getNotificationColor,
} from "@/lib/notification-utils";
import { Production, Land } from "@/types/database";
import { Notification } from "@/types/notifications";

// Helper function to create mock production data
// Helper function to create mock land data
function createMockLand(overrides: Partial<Land> = {}): Land {
    return {
        id: overrides.id || "land-1",
        name: overrides.name || "Test Land",
        area_m2: overrides.area_m2 || 1000,
        address: overrides.address || "Test Address",
        latitude: overrides.latitude ?? -6.2,
        longitude: overrides.longitude ?? 106.8,
        commodities: overrides.commodities || ["Cabai Merah"],
        custom_commodity: overrides.custom_commodity || null,
        photos: overrides.photos || [],
        status: overrides.status || "active",
        user_id: overrides.user_id || "user-1",
        created_at: overrides.created_at || "2024-01-15T00:00:00Z",
        updated_at: overrides.updated_at || "2024-01-15T00:00:00Z",
        created_by: overrides.created_by || "user-1",
        updated_by: overrides.updated_by || "user-1",
    };
}

// Helper function to create mock production data
function createMockProduction(overrides: Partial<Production> = {}): Production {
    const defaultProduction: Production = {
        id: "prod-1",
        user_id: "user-1",
        land_id: "land-1",
        commodity: "Cabai Merah",
        planting_date: "2024-01-15",
        seed_count: 100,
        estimated_harvest_date: "2024-04-15",
        harvest_date: null,
        harvest_yield_kg: null,
        status: "planted",
        notes: null,
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
        total_cost: null,
        selling_price_per_kg: null,
        created_by: null,
        updated_by: null,
    };

    return { ...defaultProduction, ...overrides };
}

// Helper function to create mock notification
function createMockNotification(overrides: Partial<Notification> = {}): Notification {
    return {
        id: overrides.id || "notif-1",
        type: overrides.type || "harvest_reminder",
        title: overrides.title || "Test Notification",
        message: overrides.message || "Test message",
        priority: overrides.priority || "medium",
        createdAt: overrides.createdAt || new Date("2024-03-15"),
        read: overrides.read ?? false,
        ...overrides,
    };
}

describe("generateNotificationId", () => {
    it("should generate ID with type and related ID", () => {
        const id = generateNotificationId("harvest_reminder", "prod-1");
        expect(id).toBe("harvest_reminder-prod-1");
    });

    it("should include suffix when provided", () => {
        const id = generateNotificationId("harvest_reminder", "prod-1", "7d");
        expect(id).toBe("harvest_reminder-prod-1-7d");
    });
});

describe("daysBetween", () => {
    it("should calculate positive days correctly", () => {
        const date1 = new Date("2024-03-01");
        const date2 = new Date("2024-03-08");
        expect(daysBetween(date1, date2)).toBe(7);
    });

    it("should return 0 for same date", () => {
        const date = new Date("2024-03-15");
        expect(daysBetween(date, date)).toBe(0);
    });

    it("should return negative for past dates", () => {
        const date1 = new Date("2024-03-15");
        const date2 = new Date("2024-03-10");
        expect(daysBetween(date1, date2)).toBe(-5);
    });
});

describe("getPriorityByDays", () => {
    it("should return high priority for 1 day or less", () => {
        expect(getPriorityByDays(1)).toBe("high");
        expect(getPriorityByDays(0)).toBe("high");
    });

    it("should return medium priority for 2-3 days", () => {
        expect(getPriorityByDays(2)).toBe("medium");
        expect(getPriorityByDays(3)).toBe("medium");
    });

    it("should return low priority for more than 3 days", () => {
        expect(getPriorityByDays(4)).toBe("low");
        expect(getPriorityByDays(7)).toBe("low");
    });
});

describe("generateHarvestReminders", () => {
    const currentDate = new Date("2024-04-08");

    it("should generate reminder for 7 days before harvest", () => {
        const productions = [
            createMockProduction({
                id: "prod-1",
                commodity: "Red Chili",
                estimated_harvest_date: "2024-04-15",
                status: "growing",
            }),
        ];

        const reminders = generateHarvestReminders(productions, currentDate);

        expect(reminders).toHaveLength(1);
        expect(reminders[0].type).toBe("harvest_reminder");
        expect(reminders[0].daysUntil).toBe(7);
        expect(reminders[0].priority).toBe("low");
    });

    it("should generate reminder for 3 days before harvest", () => {
        const productions = [
            createMockProduction({
                estimated_harvest_date: "2024-04-11",
                status: "growing",
            }),
        ];

        const reminders = generateHarvestReminders(productions, currentDate);

        expect(reminders).toHaveLength(1);
        expect(reminders[0].daysUntil).toBe(3);
        expect(reminders[0].priority).toBe("medium");
    });

    it("should generate high priority reminder for 1 day before harvest", () => {
        const productions = [
            createMockProduction({
                estimated_harvest_date: "2024-04-09",
                status: "growing",
            }),
        ];

        const reminders = generateHarvestReminders(productions, currentDate);

        expect(reminders).toHaveLength(1);
        expect(reminders[0].daysUntil).toBe(1);
        expect(reminders[0].priority).toBe("high");
        expect(reminders[0].message).toContain("besok");
    });

    it("should generate overdue notification within 3 days", () => {
        const productions = [
            createMockProduction({
                estimated_harvest_date: "2024-04-06", // 2 days ago
                status: "growing",
            }),
        ];

        const reminders = generateHarvestReminders(productions, currentDate);

        expect(reminders).toHaveLength(1);
        expect(reminders[0].daysUntil).toBe(-2);
        expect(reminders[0].priority).toBe("high");
        expect(reminders[0].title).toContain("Tertunda");
    });

    it("should skip harvested productions", () => {
        const productions = [
            createMockProduction({
                estimated_harvest_date: "2024-04-15",
                status: "harvested",
            }),
        ];

        const reminders = generateHarvestReminders(productions, currentDate);

        expect(reminders).toHaveLength(0);
    });

    it("should skip productions without estimated harvest date", () => {
        const productions = [
            createMockProduction({
                estimated_harvest_date: null,
                status: "planted",
            }),
        ];

        const reminders = generateHarvestReminders(productions, currentDate);

        expect(reminders).toHaveLength(0);
    });

    it("should return empty array for empty productions", () => {
        expect(generateHarvestReminders([], currentDate)).toEqual([]);
    });
});

describe("isExtremeWeather", () => {
    it("should return true for heavy rain codes", () => {
        expect(isExtremeWeather(65)).toBe(true);
        expect(isExtremeWeather(82)).toBe(true);
    });

    it("should return true for thunderstorm codes", () => {
        expect(isExtremeWeather(95)).toBe(true);
        expect(isExtremeWeather(99)).toBe(true);
    });

    it("should return false for normal weather codes", () => {
        expect(isExtremeWeather(0)).toBe(false); // Clear sky
        expect(isExtremeWeather(1)).toBe(false); // Mainly clear
        expect(isExtremeWeather(51)).toBe(false); // Light drizzle
    });
});

describe("getExtremeWeatherDescription", () => {
    it("should return correct description for known codes", () => {
        expect(getExtremeWeatherDescription(65)).toBe("Hujan Lebat");
        expect(getExtremeWeatherDescription(95)).toBe("Badai Petir");
    });

    it("should return default for unknown codes", () => {
        expect(getExtremeWeatherDescription(999)).toBe("Cuaca Ekstrem");
    });
});

describe("generateWeatherAlerts", () => {
    const currentDate = new Date("2024-03-15");

    it("should generate alert for extreme weather", () => {
        const alerts = generateWeatherAlerts(95, currentDate);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe("weather_alert");
        expect(alerts[0].priority).toBe("high");
        expect(alerts[0].title).toContain("Badai Petir");
    });

    it("should not generate alert for normal weather", () => {
        const alerts = generateWeatherAlerts(0, currentDate);
        expect(alerts).toHaveLength(0);
    });

    it("should include weather code in notification", () => {
        const alerts = generateWeatherAlerts(65, currentDate);
        expect(alerts[0].weatherCode).toBe(65);
    });
});

describe("generateFertilizationReminders", () => {
    it("should generate reminder at fertilization interval", () => {
        const currentDate = new Date("2024-01-29"); // 14 days after planting
        const productions = [
            createMockProduction({
                planting_date: "2024-01-15",
                status: "growing",
            }),
        ];

        const reminders = generateFertilizationReminders(productions, currentDate);

        expect(reminders).toHaveLength(1);
        expect(reminders[0].type).toBe("fertilization_reminder");
        expect(reminders[0].message).toContain("14 hari");
    });

    it("should generate reminder at multiple intervals", () => {
        const currentDate = new Date("2024-02-12"); // 28 days after planting
        const productions = [
            createMockProduction({
                planting_date: "2024-01-15",
                status: "growing",
            }),
        ];

        const reminders = generateFertilizationReminders(productions, currentDate);

        expect(reminders).toHaveLength(1);
        expect(reminders[0].message).toContain("28 hari");
    });

    it("should not generate reminder on non-interval days", () => {
        const currentDate = new Date("2024-01-25"); // 10 days after planting
        const productions = [
            createMockProduction({
                planting_date: "2024-01-15",
                status: "growing",
            }),
        ];

        const reminders = generateFertilizationReminders(productions, currentDate);

        expect(reminders).toHaveLength(0);
    });

    it("should skip harvested productions", () => {
        const currentDate = new Date("2024-01-29");
        const productions = [
            createMockProduction({
                planting_date: "2024-01-15",
                status: "harvested",
            }),
        ];

        const reminders = generateFertilizationReminders(productions, currentDate);

        expect(reminders).toHaveLength(0);
    });
});

describe("generateWateringReminders", () => {
    const currentDate = new Date("2024-03-15");
    const productions = [createMockProduction({ status: "growing" }), createMockProduction({ id: "prod-2", status: "planted" })];

    it("should generate reminder when humidity is low", () => {
        const reminders = generateWateringReminders(productions, 40, 20, currentDate);

        expect(reminders).toHaveLength(1);
        expect(reminders[0].type).toBe("watering_reminder");
        expect(reminders[0].priority).toBe("high"); // humidity < 50
    });

    it("should not generate reminder when humidity is high", () => {
        const reminders = generateWateringReminders(productions, 80, 20, currentDate);
        expect(reminders).toHaveLength(0);
    });

    it("should not generate reminder when rain probability is high", () => {
        const reminders = generateWateringReminders(productions, 40, 80, currentDate);
        expect(reminders).toHaveLength(0);
    });

    it("should have medium priority when humidity is moderate", () => {
        const reminders = generateWateringReminders(productions, 55, 20, currentDate);
        expect(reminders[0].priority).toBe("medium");
    });

    it("should not generate reminder for empty productions", () => {
        const reminders = generateWateringReminders([], 40, 20, currentDate);
        expect(reminders).toHaveLength(0);
    });

    it("should include count of active productions in message", () => {
        const reminders = generateWateringReminders(productions, 40, 20, currentDate);
        expect(reminders[0].message).toContain("2 tanaman aktif");
    });
});

describe("generateAllNotifications", () => {
    const currentDate = new Date("2024-04-08");

    it("should combine all notification types", () => {
        const productions = [
            createMockProduction({
                estimated_harvest_date: "2024-04-15", // 7 days
                planting_date: "2024-03-25", // 14 days ago
                status: "growing",
            }),
        ];

        const notifications = generateAllNotifications(
            productions,
            95, // Extreme weather
            40, // Low humidity
            20, // Low rain probability
            currentDate
        );

        // Should have: weather alert, harvest reminder, fertilization reminder, watering reminder
        expect(notifications.length).toBeGreaterThanOrEqual(3);
        expect(notifications.some((n) => n.type === "weather_alert")).toBe(true);
        expect(notifications.some((n) => n.type === "harvest_reminder")).toBe(true);
        expect(notifications.some((n) => n.type === "watering_reminder")).toBe(true);
    });

    it("should put weather alerts first", () => {
        const productions = [
            createMockProduction({
                estimated_harvest_date: "2024-04-15",
                status: "growing",
            }),
        ];

        const notifications = generateAllNotifications(productions, 95, 40, 20, currentDate);

        expect(notifications[0].type).toBe("weather_alert");
    });
});

describe("sortNotificationsByPriority", () => {
    it("should sort high priority first", () => {
        const notifications = [
            createMockNotification({ priority: "low", createdAt: new Date("2024-03-15") }),
            createMockNotification({ priority: "high", createdAt: new Date("2024-03-14") }),
            createMockNotification({ priority: "medium", createdAt: new Date("2024-03-15") }),
        ];

        const sorted = sortNotificationsByPriority(notifications);

        expect(sorted[0].priority).toBe("high");
        expect(sorted[1].priority).toBe("medium");
        expect(sorted[2].priority).toBe("low");
    });

    it("should sort by date within same priority (newest first)", () => {
        const notifications = [
            createMockNotification({ id: "1", priority: "high", createdAt: new Date("2024-03-14") }),
            createMockNotification({ id: "2", priority: "high", createdAt: new Date("2024-03-16") }),
            createMockNotification({ id: "3", priority: "high", createdAt: new Date("2024-03-15") }),
        ];

        const sorted = sortNotificationsByPriority(notifications);

        expect(sorted[0].id).toBe("2");
        expect(sorted[1].id).toBe("3");
        expect(sorted[2].id).toBe("1");
    });

    it("should not mutate original array", () => {
        const notifications = [createMockNotification({ priority: "low" }), createMockNotification({ priority: "high" })];

        const sorted = sortNotificationsByPriority(notifications);

        expect(sorted).not.toBe(notifications);
        expect(notifications[0].priority).toBe("low");
    });
});

describe("filterUnreadNotifications", () => {
    it("should return only unread notifications", () => {
        const notifications = [createMockNotification({ id: "1", read: false }), createMockNotification({ id: "2", read: true }), createMockNotification({ id: "3", read: false })];

        const unread = filterUnreadNotifications(notifications);

        expect(unread).toHaveLength(2);
        expect(unread.map((n) => n.id)).toEqual(["1", "3"]);
    });

    it("should return empty array when all are read", () => {
        const notifications = [createMockNotification({ read: true }), createMockNotification({ read: true })];

        expect(filterUnreadNotifications(notifications)).toHaveLength(0);
    });

    it("should return empty array for empty input", () => {
        expect(filterUnreadNotifications([])).toEqual([]);
    });
});

describe("getNotificationIcon", () => {
    it("should return correct icon for each type", () => {
        expect(getNotificationIcon("harvest_reminder")).toBe("Wheat");
        expect(getNotificationIcon("weather_alert")).toBe("CloudRain");
        expect(getNotificationIcon("fertilization_reminder")).toBe("Leaf");
        expect(getNotificationIcon("watering_reminder")).toBe("Droplets");
    });
});

describe("getNotificationColor", () => {
    it("should return correct color for each priority", () => {
        expect(getNotificationColor("high")).toBe("text-red-500");
        expect(getNotificationColor("medium")).toBe("text-yellow-500");
        expect(getNotificationColor("low")).toBe("text-blue-500");
    });
});
