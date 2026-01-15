import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommodityIconGrid } from "./CommodityIcon";
import { User, MapPin, Warehouse } from "lucide-react";
import type { FarmerMapMarker } from "@/hooks/useFarmerMapData";

// =====================================================
// Status Badge Configuration
// =====================================================

const STATUS_CONFIG = {
    active: { label: "Aktif", variant: "default" as const },
    inactive: { label: "Tidak Aktif", variant: "secondary" as const },
    pending: { label: "Menunggu", variant: "outline" as const },
    suspended: { label: "Ditangguhkan", variant: "destructive" as const },
};

interface FarmerMapPopupProps {
    farmer: FarmerMapMarker;
}

export function FarmerMapPopup({ farmer }: FarmerMapPopupProps) {
    const statusConfig = STATUS_CONFIG[farmer.status] ?? STATUS_CONFIG.active;

    return (
        <div className="w-64 p-1">
            {/* Header with Photo and Basic Info */}
            <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={farmer.avatar_url ?? undefined} alt={farmer.full_name} />
                    <AvatarFallback className="bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{farmer.full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{farmer.farmer_code}</p>
                    <Badge variant={statusConfig.variant} className="mt-1 text-xs">
                        {statusConfig.label}
                    </Badge>
                </div>
            </div>

            {/* Location */}
            {farmer.regency_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{farmer.regency_name}</span>
                </div>
            )}

            {/* Land Stats */}
            <div className="flex items-center gap-2 text-sm mb-3">
                <Warehouse className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>
                    {farmer.land_count} lahan • {farmer.total_area_m2.toLocaleString()} m²
                </span>
            </div>

            {/* Commodities */}
            {farmer.commodities.length > 0 && (
                <div className="border-t pt-2">
                    <p className="text-xs text-muted-foreground mb-1.5">Komoditas:</p>
                    <CommodityIconGrid commodities={farmer.commodities} maxDisplay={4} />
                </div>
            )}
        </div>
    );
}
