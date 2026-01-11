import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrendBadgeClass } from "@/lib/commodity-utils";

interface PriceChangeIndicatorProps {
    trend: "up" | "down" | "stable";
    change: number;
    changePercent: number;
    showAmount?: boolean;
    showPercent?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

/**
 * Component to display price change with icon and styling
 */
export function PriceChangeIndicator({ trend, change, changePercent, showAmount = true, showPercent = true, size = "md", className }: PriceChangeIndicatorProps) {
    const sizeClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5",
    };

    const formatChange = (value: number) => {
        const sign = value > 0 ? "+" : "";
        return `${sign}${new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)}`;
    };

    const formatPercent = (value: number) => {
        const sign = value > 0 ? "+" : "";
        return `${sign}${value.toFixed(1)}%`;
    };

    const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

    if (trend === "stable" && change === 0) {
        return (
            <span className={cn("flex items-center gap-1 text-muted-foreground", sizeClasses[size], className)}>
                <Minus className={iconSizes[size]} />
                <span>Stabil</span>
            </span>
        );
    }

    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium", getTrendBadgeClass(trend), sizeClasses[size], className)}>
            <Icon className={iconSizes[size]} />
            {showAmount && <span>{formatChange(change)}</span>}
            {showPercent && <span>({formatPercent(changePercent)})</span>}
        </span>
    );
}
