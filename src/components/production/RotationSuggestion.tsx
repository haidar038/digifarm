/**
 * Rotation suggestion component for ProductionForm
 * Shows crop rotation recommendations based on previous harvest
 */

import { useMemo } from "react";
import { Production } from "@/types/database";
import { Lightbulb, AlertTriangle, Info, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { translateCommodity } from "@/lib/i18n";
import { getLastHarvestedForLand, getRotationRecommendations, getRotationWarnings, formatTimeSinceHarvest, RotationRecommendation, RotationWarning } from "@/lib/rotation-utils";

interface RotationSuggestionProps {
    landId: string | null;
    productions: Production[];
    selectedCommodity: string;
    onSelectCommodity?: (commodity: string) => void;
}

export function RotationSuggestion({ landId, productions, selectedCommodity, onSelectCommodity }: RotationSuggestionProps) {
    // Get last harvested commodity for this land
    const lastProduction = useMemo(() => {
        if (!landId) return null;
        return getLastHarvestedForLand(productions, landId);
    }, [landId, productions]);

    // Get recommendations and warnings
    const recommendations = useMemo(() => {
        return getRotationRecommendations(lastProduction?.commodity || null);
    }, [lastProduction]);

    const warnings = useMemo(() => {
        if (!selectedCommodity) return [];
        return getRotationWarnings(selectedCommodity, lastProduction?.commodity || null);
    }, [selectedCommodity, lastProduction]);

    // Don't show if no land selected
    if (!landId) return null;

    return (
        <div className="space-y-3">
            {/* Recommendations Section */}
            {recommendations.length > 0 && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-primary">Saran Rotasi Tanaman</p>
                            {lastProduction && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Terakhir: {translateCommodity(lastProduction.commodity)} (panen {formatTimeSinceHarvest(lastProduction.harvest_date!)})
                                </p>
                            )}
                            {!lastProduction && <p className="text-xs text-muted-foreground mt-0.5">Belum ada riwayat panen di lahan ini</p>}
                        </div>
                    </div>

                    <div className="space-y-1.5 mt-3">
                        {recommendations.slice(0, 3).map((rec) => (
                            <RecommendationItem key={rec.commodity} recommendation={rec} isSelected={selectedCommodity === rec.commodity} onClick={() => onSelectCommodity?.(rec.commodity)} />
                        ))}
                    </div>
                </div>
            )}

            {/* Warnings Section */}
            {warnings.length > 0 && (
                <div className="space-y-2">
                    {warnings.map((warning, index) => (
                        <WarningItem key={index} warning={warning} />
                    ))}
                </div>
            )}
        </div>
    );
}

function RecommendationItem({ recommendation, isSelected, onClick }: { recommendation: RotationRecommendation; isSelected: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn("w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors", isSelected ? "bg-primary/10 border border-primary/30" : "bg-background hover:bg-muted/50 border border-transparent")}
        >
            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0", recommendation.priority === "high" ? "bg-primary/20" : "bg-muted")}>
                {isSelected ? <Check className="h-3 w-3 text-primary" /> : <span className="text-xs font-medium text-muted-foreground">{recommendation.priority === "high" ? "1" : "2"}</span>}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{translateCommodity(recommendation.commodity)}</p>
                <p className="text-xs text-muted-foreground truncate">{recommendation.reason}</p>
            </div>
        </button>
    );
}

function WarningItem({ warning }: { warning: RotationWarning }) {
    return (
        <div
            className={cn(
                "flex items-start gap-2 p-2.5 rounded-md text-sm",
                warning.severity === "warning" ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400" : "bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400"
            )}
        >
            {warning.severity === "warning" ? <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />}
            <p>{warning.message}</p>
        </div>
    );
}
