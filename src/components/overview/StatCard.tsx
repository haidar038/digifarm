import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    subtitleValue?: string | number;
    icon: LucideIcon;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    className?: string;
}

export function StatCard({ title, value, subtitle, subtitleValue, icon: Icon, trend, trendValue, className }: StatCardProps) {
    return (
        <Card className={cn("overflow-hidden transition-all duration-300 hover:shadow-lg animate-slide-up h-full", className)}>
            <CardContent className="p-6 h-full">
                <div className="flex items-stretch justify-between h-full">
                    {/* Column kiri: flex-col dengan justify-between agar description berada di bawah */}
                    <div className="flex flex-col justify-between h-full">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                            <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
                        </div>

                        {/* Description di bagian bottom */}
                        <div>
                            {subtitle && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-muted-foreground">{subtitle}:</span>
                                    <span className="text-sm font-semibold text-secondary-foreground">{subtitleValue}</span>
                                </div>
                            )}
                            {trend && trendValue && (
                                <div className={cn("flex items-center gap-1 mt-2 text-sm font-medium", trend === "up" && "text-primary", trend === "down" && "text-destructive", trend === "neutral" && "text-muted-foreground")}>
                                    <span>{trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}</span>
                                    <span>{trendValue}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
