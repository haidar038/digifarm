import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Check, X } from "lucide-react";
import { type Conflict, type ConflictResolutionStrategy, resolveConflict } from "@/lib/conflict-resolver";
import { cn } from "@/lib/utils";

interface ConflictDialogProps {
    conflict: Conflict | null;
    isOpen: boolean;
    onClose: () => void;
    onResolve: (resolvedData: Record<string, unknown>) => void;
}

export function ConflictDialog({ conflict, isOpen, onClose, onResolve }: ConflictDialogProps) {
    const [strategy, setStrategy] = useState<ConflictResolutionStrategy>("server_wins");
    const [manualSelections, setManualSelections] = useState<Record<string, "local" | "server">>({});

    if (!conflict) return null;

    const handleResolve = () => {
        let resolved;

        if (strategy === "manual") {
            const manualResolutions: Record<string, unknown> = {};
            for (const field of conflict.conflictingFields) {
                const selection = manualSelections[field.field] || "server";
                manualResolutions[field.field] = selection === "local" ? field.localValue : field.serverValue;
            }
            resolved = resolveConflict(conflict, strategy, manualResolutions);
        } else {
            resolved = resolveConflict(conflict, strategy);
        }

        onResolve(resolved.resolvedData);
        onClose();
    };

    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) return "—";
        if (typeof value === "boolean") return value ? "Ya" : "Tidak";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
    };

    const formatFieldName = (field: string): string => {
        return field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                        Konflik Data Terdeteksi
                    </DialogTitle>
                    <DialogDescription>Data ini diubah baik secara lokal maupun di server. Pilih bagaimana menyelesaikan konflik ini.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Strategy Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Strategi Penyelesaian</Label>
                        <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as ConflictResolutionStrategy)} className="grid grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2 rounded-md border p-3">
                                <RadioGroupItem value="server_wins" id="server" />
                                <Label htmlFor="server" className="cursor-pointer">
                                    Gunakan Data Server
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-md border p-3">
                                <RadioGroupItem value="local_wins" id="local" />
                                <Label htmlFor="local" className="cursor-pointer">
                                    Gunakan Data Lokal
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-md border p-3">
                                <RadioGroupItem value="merge" id="merge" />
                                <Label htmlFor="merge" className="cursor-pointer">
                                    Gabungkan Otomatis
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-md border p-3">
                                <RadioGroupItem value="manual" id="manual" />
                                <Label htmlFor="manual" className="cursor-pointer">
                                    Pilih Per Field
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Field Comparison */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Field yang Berkonflik</Label>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="bg-blue-50">
                                    Lokal
                                </Badge>
                                <Badge variant="outline" className="bg-green-50">
                                    Server
                                </Badge>
                            </div>
                        </div>
                        <ScrollArea className="h-[200px] rounded-md border">
                            <div className="p-4 space-y-3">
                                {conflict.conflictingFields.map((field) => (
                                    <div key={field.field} className="space-y-2 border-b pb-3 last:border-0">
                                        <div className="font-medium text-sm">{formatFieldName(field.field)}</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    strategy === "manual" &&
                                                    setManualSelections((prev) => ({
                                                        ...prev,
                                                        [field.field]: "local",
                                                    }))
                                                }
                                                className={cn(
                                                    "p-2 rounded-md text-sm text-left transition-colors",
                                                    "bg-blue-50 hover:bg-blue-100",
                                                    strategy === "manual" && manualSelections[field.field] === "local" && "ring-2 ring-blue-500",
                                                    strategy !== "manual" && "cursor-default"
                                                )}
                                                disabled={strategy !== "manual"}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Lokal:</span>
                                                    {strategy === "manual" && manualSelections[field.field] === "local" && <Check className="h-4 w-4 text-blue-600" />}
                                                </div>
                                                <div className="font-mono text-xs mt-1 truncate">{formatValue(field.localValue)}</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    strategy === "manual" &&
                                                    setManualSelections((prev) => ({
                                                        ...prev,
                                                        [field.field]: "server",
                                                    }))
                                                }
                                                className={cn(
                                                    "p-2 rounded-md text-sm text-left transition-colors",
                                                    "bg-green-50 hover:bg-green-100",
                                                    strategy === "manual" && (manualSelections[field.field] === "server" || !manualSelections[field.field]) && "ring-2 ring-green-500",
                                                    strategy !== "manual" && "cursor-default"
                                                )}
                                                disabled={strategy !== "manual"}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Server:</span>
                                                    {strategy === "manual" && (manualSelections[field.field] === "server" || !manualSelections[field.field]) && <Check className="h-4 w-4 text-green-600" />}
                                                </div>
                                                <div className="font-mono text-xs mt-1 truncate">{formatValue(field.serverValue)}</div>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        <X className="mr-2 h-4 w-4" />
                        Batal
                    </Button>
                    <Button onClick={handleResolve}>
                        <Check className="mr-2 h-4 w-4" />
                        Terapkan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
