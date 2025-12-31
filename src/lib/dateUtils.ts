import { format as dateFnsFormat, formatDistance as dateFnsFormatDistance } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Format a date with Indonesian locale
 * @param date - Date to format
 * @param formatStr - date-fns format string
 * @returns Formatted date string in Indonesian
 */
export function formatDate(date: Date | string | number, formatStr: string = "d MMMM yyyy"): string {
    const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    return dateFnsFormat(dateObj, formatStr, { locale: id });
}

/**
 * Format relative time distance with Indonesian locale
 * @param date - Date to compare
 * @param baseDate - Base date (defaults to now)
 * @returns Relative time string in Indonesian
 */
export function formatDistance(date: Date | string | number, baseDate: Date = new Date()): string {
    const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    return dateFnsFormatDistance(dateObj, baseDate, { locale: id, addSuffix: true });
}

/**
 * Format date for display in tables and cards
 * @param date - Date to format
 * @returns Short formatted date (e.g., "30 Des 2024")
 */
export function formatShortDate(date: Date | string | number): string {
    return formatDate(date, "d MMM yyyy");
}

/**
 * Format date for charts and reports
 * @param date - Date to format
 * @returns Month and year (e.g., "Desember 2024")
 */
export function formatMonthYear(date: Date | string | number): string {
    return formatDate(date, "MMMM yyyy");
}

/**
 * Format date with time
 * @param date - Date to format
 * @returns Date with time (e.g., "30 Des 2024 pukul 14:30")
 */
export function formatDateTime(date: Date | string | number): string {
    return formatDate(date, "d MMM yyyy 'pukul' HH:mm");
}

// Re-export the original format for cases where we need ISO format or custom formatting
export { dateFnsFormat as format };
