import { User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AuditInfoProps {
    createdAt: string;
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdByName?: string | null;
    updatedByName?: string | null;
    ownerId?: string; // The owner's ID (e.g., farmer's ID)
    compact?: boolean; // If true, show only badge
}

export function AuditInfo({ createdAt, updatedAt, createdBy, updatedBy, createdByName, updatedByName, ownerId, compact = true }: AuditInfoProps) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Determine who created/updated
    const isCreatedByManager = createdBy && createdBy !== ownerId;
    const isUpdatedByManager = updatedBy && updatedBy !== ownerId;

    const creatorLabel = isCreatedByManager ? createdByName || "Manager" : "Petani";

    const updaterLabel = isUpdatedByManager ? updatedByName || "Manager" : updatedBy ? "Petani" : null;

    if (compact) {
        // Only show badge if manager was involved
        if (!isCreatedByManager && !isUpdatedByManager) {
            return null;
        }

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs gap-1 cursor-help">
                            <User className="h-3 w-3" />
                            {isUpdatedByManager ? "Diubah Manager" : "Input Manager"}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <div className="text-xs space-y-1">
                            <div>
                                <span className="text-muted-foreground">Dibuat: </span>
                                {creatorLabel} ({formatDate(createdAt)})
                            </div>
                            {updatedAt && updatedAt !== createdAt && (
                                <div>
                                    <span className="text-muted-foreground">Diubah: </span>
                                    {updaterLabel} ({formatDate(updatedAt)})
                                </div>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Full display mode
    return (
        <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Dibuat oleh {creatorLabel}</span>
                <Clock className="h-3 w-3 ml-2" />
                <span>{formatDateTime(createdAt)}</span>
            </div>
            {updatedAt && updatedAt !== createdAt && updaterLabel && (
                <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>Diubah oleh {updaterLabel}</span>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>{formatDateTime(updatedAt)}</span>
                </div>
            )}
        </div>
    );
}

// Simple column component for tables
interface AuditColumnProps {
    createdBy?: string | null;
    updatedBy?: string | null;
    ownerId?: string;
}

export function AuditColumn({ createdBy, updatedBy, ownerId }: AuditColumnProps) {
    const isCreatedByManager = createdBy && createdBy !== ownerId;
    const isUpdatedByManager = updatedBy && updatedBy !== ownerId;

    if (!isCreatedByManager && !isUpdatedByManager) {
        return <span className="text-muted-foreground text-xs">Petani</span>;
    }

    return (
        <Badge variant="outline" className="text-xs gap-1">
            <User className="h-3 w-3" />
            Manager
        </Badge>
    );
}
