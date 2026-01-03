import { WifiOff, RefreshCw, Cloud, CloudOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { cn } from "@/lib/utils";

interface OfflineIndicatorProps {
    className?: string;
    showSyncButton?: boolean;
}

export function OfflineIndicator({ className, showSyncButton = true }: OfflineIndicatorProps) {
    const { isOnline, pendingCount, isSyncing, syncNow, lastSyncTime } = useOfflineSync();

    // Don't show anything if online and no pending items
    if (isOnline && pendingCount === 0) {
        return null;
    }

    return (
        <TooltipProvider>
            <div className={cn("flex items-center gap-2", className)}>
                {/* Offline Badge */}
                {!isOnline && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                                <WifiOff className="h-3 w-3" />
                                Offline
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Anda sedang offline. Perubahan disimpan lokal.</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                {/* Pending Sync Count */}
                {pendingCount > 0 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant={isOnline ? "secondary" : "outline"} className="flex items-center gap-1">
                                {isOnline ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
                                {pendingCount} pending
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{pendingCount} perubahan menunggu sinkronisasi</p>
                            {lastSyncTime && <p className="text-xs text-muted-foreground">Sinkronisasi terakhir: {lastSyncTime.toLocaleTimeString("id-ID")}</p>}
                        </TooltipContent>
                    </Tooltip>
                )}

                {/* Sync Button */}
                {showSyncButton && isOnline && pendingCount > 0 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="sm" variant="outline" onClick={syncNow} disabled={isSyncing} className="h-7 px-2">
                                <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isSyncing ? "Menyinkronkan..." : "Sinkronkan sekarang"}</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                {/* Syncing Indicator */}
                {isSyncing && (
                    <Badge variant="outline" className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Syncing...
                    </Badge>
                )}
            </div>
        </TooltipProvider>
    );
}
