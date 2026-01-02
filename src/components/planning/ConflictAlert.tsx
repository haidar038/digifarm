/**
 * Conflict Alert Component
 * Displays warnings for overlapping production schedules
 */

import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Conflict, formatConflictMessage } from "@/lib/conflict-utils";
import { translateCommodity } from "@/lib/i18n";
import { useState } from "react";

interface ConflictAlertProps {
    conflicts: Map<string, Conflict[]>;
    productionNames: Map<string, string>; // productionId -> commodity name
}

export function ConflictAlert({ conflicts, productionNames }: ConflictAlertProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || conflicts.size === 0) {
        return null;
    }

    const totalConflicts = Array.from(conflicts.values()).reduce((acc, arr) => acc + arr.length, 0);

    return (
        <Alert variant="destructive" className="relative">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
                <span>Konflik Jadwal Terdeteksi ({totalConflicts})</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2" onClick={() => setDismissed(true)}>
                    <X className="h-4 w-4" />
                </Button>
            </AlertTitle>
            <AlertDescription>
                <div className="mt-2 space-y-2">
                    {Array.from(conflicts.entries())
                        .slice(0, 3)
                        .map(([productionId, conflictList]) => {
                            const commodityName = productionNames.get(productionId) || "Produksi";
                            return (
                                <div key={productionId} className="text-sm">
                                    <span className="font-medium">{translateCommodity(commodityName)}:</span> {conflictList.map((c) => formatConflictMessage(c)).join(", ")}
                                </div>
                            );
                        })}
                    {conflicts.size > 3 && <p className="text-sm text-muted-foreground">... dan {conflicts.size - 3} konflik lainnya</p>}
                </div>
            </AlertDescription>
        </Alert>
    );
}

/**
 * Compact conflict badge for inline display
 */
interface ConflictBadgeProps {
    conflictCount: number;
    overlapDays: number;
}

export function ConflictBadge({ conflictCount, overlapDays }: ConflictBadgeProps) {
    if (conflictCount === 0) return null;

    return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
            <AlertTriangle className="h-3 w-3" />
            <span>{overlapDays} hari overlap</span>
        </div>
    );
}
