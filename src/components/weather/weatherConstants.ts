import type { LucideIcon } from "lucide-react";
import { Sun, Cloud, CloudSun, CloudFog, CloudRain, CloudSnow, CloudLightning, Snowflake, CloudDrizzle, HelpCircle, Thermometer, ThermometerSnowflake, Droplets, Wind, CheckCircle, Ban, Warehouse } from "lucide-react";
import type { RecommendationType } from "@/hooks/useWeather";

export type WeatherIconType = "sun" | "cloud-sun" | "cloud-sun-partial" | "cloud" | "fog" | "drizzle" | "rain" | "snow-rain" | "snow" | "thunderstorm" | "unknown";

// Map weather codes to icon types
export const weatherCodeToIconType: Record<number, WeatherIconType> = {
    0: "sun",
    1: "cloud-sun",
    2: "cloud-sun-partial",
    3: "cloud",
    45: "fog",
    48: "fog",
    51: "drizzle",
    53: "drizzle",
    55: "drizzle",
    56: "drizzle",
    57: "drizzle",
    61: "rain",
    63: "rain",
    65: "rain",
    66: "snow-rain",
    67: "snow-rain",
    71: "snow",
    73: "snow",
    75: "snow",
    77: "snow",
    80: "rain",
    81: "rain",
    82: "thunderstorm",
    85: "snow-rain",
    86: "snow-rain",
    95: "thunderstorm",
    96: "thunderstorm",
    99: "thunderstorm",
};

// Map icon types to actual Lucide components
export const iconComponentMap: Record<WeatherIconType, LucideIcon> = {
    sun: Sun,
    "cloud-sun": CloudSun,
    "cloud-sun-partial": CloudSun,
    cloud: Cloud,
    fog: CloudFog,
    drizzle: CloudDrizzle,
    rain: CloudRain,
    "snow-rain": CloudSnow,
    snow: Snowflake,
    thunderstorm: CloudLightning,
    unknown: HelpCircle,
};

// Color mapping for different weather conditions
export const iconColorMap: Record<WeatherIconType, string> = {
    sun: "text-amber-400",
    "cloud-sun": "text-amber-300",
    "cloud-sun-partial": "text-sky-300",
    cloud: "text-slate-400",
    fog: "text-slate-300",
    drizzle: "text-sky-400",
    rain: "text-blue-500",
    "snow-rain": "text-blue-300",
    snow: "text-sky-200",
    thunderstorm: "text-purple-500",
    unknown: "text-muted-foreground",
};

// Size classes for icons
export const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
    "2xl": "w-16 h-16",
};

// Map recommendation types to icons
export const recommendationIconMap: Record<RecommendationType, LucideIcon> = {
    "rain-high": CloudRain,
    "no-spray": Ban,
    "rain-medium": CloudSun,
    sunny: Sun,
    hot: Thermometer,
    cold: ThermometerSnowflake,
    humid: Droplets,
    dry: Warehouse,
    windy: Wind,
    ideal: CheckCircle,
    normal: CheckCircle,
};

// Recommendation icon colors
export const recommendationColorMap: Record<RecommendationType, string> = {
    "rain-high": "text-blue-500",
    "no-spray": "text-red-500",
    "rain-medium": "text-sky-400",
    sunny: "text-amber-400",
    hot: "text-red-500",
    cold: "text-blue-400",
    humid: "text-cyan-500",
    dry: "text-amber-600",
    windy: "text-slate-500",
    ideal: "text-green-500",
    normal: "text-green-500",
};
