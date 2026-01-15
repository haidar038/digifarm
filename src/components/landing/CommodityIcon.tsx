import { Flame, Leaf, CircleDot } from "lucide-react";

// =====================================================
// Commodity Icon Mapping
// =====================================================

const COMMODITY_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
    "Cabai Merah": { icon: <Flame className="h-4 w-4" />, color: "text-red-500" },
    "Cabai Rawit": { icon: <Flame className="h-4 w-4" />, color: "text-orange-500" },
    Tomat: { icon: <CircleDot className="h-4 w-4" />, color: "text-red-400" },
    "Bawang Merah": { icon: <CircleDot className="h-4 w-4" />, color: "text-purple-400" },
    "Bawang Putih": { icon: <CircleDot className="h-4 w-4" />, color: "text-gray-400" },
    Lainnya: { icon: <Leaf className="h-4 w-4" />, color: "text-green-500" },
};

interface CommodityIconProps {
    commodity: string;
    className?: string;
}

export function CommodityIcon({ commodity, className }: CommodityIconProps) {
    const config = COMMODITY_ICONS[commodity] ?? COMMODITY_ICONS["Lainnya"];

    return (
        <span className={`inline-flex items-center gap-1 ${config.color} ${className ?? ""}`} title={commodity}>
            {config.icon}
            <span className="text-xs">{commodity}</span>
        </span>
    );
}

interface CommodityIconGridProps {
    commodities: string[];
    maxDisplay?: number;
}

export function CommodityIconGrid({ commodities, maxDisplay = 3 }: CommodityIconGridProps) {
    const displayCommodities = commodities.slice(0, maxDisplay);
    const remaining = commodities.length - maxDisplay;

    return (
        <div className="flex flex-wrap gap-1">
            {displayCommodities.map((commodity, index) => (
                <CommodityIcon key={index} commodity={commodity} />
            ))}
            {remaining > 0 && <span className="text-xs text-muted-foreground">+{remaining} lainnya</span>}
        </div>
    );
}
