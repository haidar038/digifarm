import { useState } from "react";
import { Loader2, MapPin, User, Warehouse } from "lucide-react";
import { Map, MapMarker, MarkerContent, MarkerPopup, MapControls } from "@/components/ui/map";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFarmerMapData, type FarmerMapMarker } from "@/hooks/useFarmerMapData";
import { CommodityIconGrid } from "./CommodityIcon";

// =====================================================
// Status Badge Configuration
// =====================================================

const STATUS_CONFIG = {
    active: { label: "Aktif", variant: "default" as const },
    inactive: { label: "Tidak Aktif", variant: "secondary" as const },
    pending: { label: "Menunggu", variant: "outline" as const },
    suspended: { label: "Ditangguhkan", variant: "destructive" as const },
};

// =====================================================
// CyclOSM Map Style (Light Theme)
// =====================================================

const MAP_STYLES = {
    light: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    // Use OpenStreetMap style for MapLibre GL (raster tiles)
    // CyclOSM via raster source
};

// MapLibre GL style with CyclOSM raster tiles
const CYCLOSM_STYLE = {
    version: 8 as const,
    sources: {
        cyclosm: {
            type: "raster" as const,
            tiles: ["https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png", "https://b.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png", "https://c.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.cyclosm.org/">CyclOSM</a>',
        },
    },
    layers: [
        {
            id: "cyclosm-layer",
            type: "raster" as const,
            source: "cyclosm",
            minzoom: 0,
            maxzoom: 19,
        },
    ],
};

// =====================================================
// Farmer Marker Component (MapLibre GL)
// =====================================================

interface FarmerMarkerProps {
    farmer: FarmerMapMarker;
}

function FarmerMarker({ farmer }: FarmerMarkerProps) {
    const statusConfig = STATUS_CONFIG[farmer.status] ?? STATUS_CONFIG.active;

    return (
        <MapMarker longitude={farmer.longitude} latitude={farmer.latitude}>
            <MarkerContent>
                {/* Green marker pin */}
                <div className="relative">
                    <div className="h-6 w-6 rounded-full bg-green-500 border-2 border-white shadow-lg flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                    {/* Pointer triangle */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-green-500" />
                </div>
            </MarkerContent>

            <MarkerPopup closeButton className="!w-72 !p-0 !border-0 !bg-transparent rounded-lg !shadow-none">
                {/* Simplified popup - single container only */}
                <div className="bg-popover text-popover-foreground">
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
            </MarkerPopup>
        </MapMarker>
    );
}

// =====================================================
// Main Map Component
// =====================================================

interface FarmerDistributionMapProps {
    className?: string;
}

export function FarmerDistributionMap({ className }: FarmerDistributionMapProps) {
    const { data: farmers = [], isLoading, isError } = useFarmerMapData();

    // Default center: Maluku Utara
    const defaultCenter: [number, number] = [127.8, 1.0]; // [lng, lat] for MapLibre
    const defaultZoom = 7;

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center bg-muted/30 rounded-lg ${className}`}>
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Memuat peta...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className={`flex items-center justify-center bg-muted/30 rounded-lg ${className}`}>
                <div className="text-center">
                    <MapPin className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Gagal memuat data peta</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ minHeight: "400px" }}>
            <Map
                center={defaultCenter}
                zoom={defaultZoom}
                styles={{
                    light: CYCLOSM_STYLE,
                    dark: CYCLOSM_STYLE, // Use same style for both modes
                }}
            >
                {/* Map Controls */}
                <MapControls showZoom showLocate showFullscreen position="bottom-right" />

                {/* Farmer Markers */}
                {farmers.map((farmer) => (
                    <FarmerMarker key={farmer.id} farmer={farmer} />
                ))}
            </Map>

            {/* Empty State Overlay */}
            {farmers.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg pointer-events-none">
                    <div className="text-center">
                        <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-muted-foreground">Belum ada data petani dengan lokasi</p>
                    </div>
                </div>
            )}
        </div>
    );
}
