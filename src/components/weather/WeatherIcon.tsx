import { cn } from "@/lib/utils";
import { weatherCodeToIconType, iconComponentMap, iconColorMap, sizeMap, recommendationIconMap, recommendationColorMap, type WeatherIconType } from "./weatherConstants";
import type { RecommendationType } from "@/hooks/useWeather";

interface WeatherIconProps {
    weatherCode?: number;
    iconType?: WeatherIconType;
    className?: string;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    withColor?: boolean;
}

export function WeatherIcon({ weatherCode, iconType, className, size = "md", withColor = true }: WeatherIconProps) {
    const type = iconType ?? (weatherCode !== undefined ? weatherCodeToIconType[weatherCode] : "unknown") ?? "unknown";
    const IconComponent = iconComponentMap[type];
    const colorClass = withColor ? iconColorMap[type] : "";

    return <IconComponent className={cn(sizeMap[size], colorClass, className)} />;
}

interface RecommendationIconProps {
    type: RecommendationType;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function RecommendationIcon({ type, className, size = "md" }: RecommendationIconProps) {
    const IconComponent = recommendationIconMap[type];
    const colorClass = recommendationColorMap[type];

    return <IconComponent className={cn(sizeMap[size], colorClass, className)} />;
}
