import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Land } from "@/types/database";
import { MapPin, Ruler, Sprout, Calendar, Image, ExternalLink } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { translateCommodity } from "@/lib/i18n";

interface LandDetailsProps {
    land: Land | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (land: Land) => void;
}

export function LandDetails({ land, open, onOpenChange, onEdit }: LandDetailsProps) {
    const { t } = useTranslation();
    if (!land) return null;

    const statusStyles = {
        active: "bg-primary/10 text-primary border-primary/20",
        vacant: "bg-muted text-muted-foreground border-muted",
        archived: "bg-destructive/10 text-destructive border-destructive/20",
    };

    const openInMaps = () => {
        if (land.latitude && land.longitude) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${land.latitude},${land.longitude}`, "_blank");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <span className="text-xl">{land.name}</span>
                        <Badge className={cn(statusStyles[land.status], "capitalize ml-2")}>{t(`status.${land.status}`)}</Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Photo Gallery */}
                    {land.photos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {land.photos.map((photo, index) => (
                                <img key={index} src={photo} alt={`${land.name} - Photo ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-border" />
                            ))}
                        </div>
                    ) : (
                        <div className="h-32 rounded-lg bg-muted flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Tidak ada foto</p>
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Land Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Area */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Ruler className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Luas</p>
                                <p className="font-semibold text-lg">{land.area_m2.toLocaleString()} m²</p>
                                <p className="text-xs text-muted-foreground">({(land.area_m2 / 10000).toFixed(2)} hektar)</p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Lokasi</p>
                                {land.address ? <p className="font-medium">{land.address}</p> : <p className="text-muted-foreground italic">Alamat tidak tersedia</p>}
                                {land.latitude && land.longitude && (
                                    <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary" onClick={openInMaps}>
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        {land.latitude.toFixed(6)}, {land.longitude.toFixed(6)}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Commodities */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Sprout className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Komoditas</p>
                                <div className="flex flex-wrap gap-2">
                                    {land.commodities.map((commodity) => (
                                        <Badge key={commodity} variant="secondary">
                                            {translateCommodity(commodity === "Others" && land.custom_commodity ? land.custom_commodity : commodity)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Date Info */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Terdaftar</p>
                                <p className="font-medium">{formatDate(land.created_at, "d MMMM yyyy")}</p>
                                <p className="text-xs text-muted-foreground">Terakhir diperbarui: {formatDateTime(land.updated_at)}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Tutup
                        </Button>
                        {onEdit && (
                            <Button
                                onClick={() => {
                                    onEdit(land);
                                    onOpenChange(false);
                                }}
                            >
                                Edit Lahan
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
