import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Activity as ActivityType } from "@/types/database";
import { formatShortDate } from "@/lib/dateUtils";

interface OngoingActivitiesProps {
    activities: ActivityType[];
}

const statusConfig = {
    pending: {
        label: "Menunggu",
        icon: Clock,
        className: "bg-muted text-muted-foreground",
    },
    in_progress: {
        label: "Sedang Berjalan",
        icon: AlertCircle,
        className: "bg-primary/10 text-primary",
    },
    completed: {
        label: "Selesai",
        icon: CheckCircle,
        className: "bg-primary/20 text-primary",
    },
};

export function OngoingActivities({ activities }: OngoingActivitiesProps) {
    const ongoingActivities = activities.filter((a) => a.status !== "completed").slice(0, 5);

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-primary" />
                    Aktivitas Berlangsung
                </CardTitle>
            </CardHeader>
            <CardContent>
                {ongoingActivities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Tidak ada aktivitas</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ongoingActivities.map((activity) => {
                            const status = statusConfig[activity.status];
                            const StatusIcon = status.icon;
                            return (
                                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                                        <StatusIcon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{activity.description}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-xs">
                                                {activity.activity_type}
                                            </Badge>
                                            {activity.scheduled_date && <span className="text-xs text-muted-foreground">{formatShortDate(activity.scheduled_date)}</span>}
                                        </div>
                                    </div>
                                    <Badge className={status.className}>{status.label}</Badge>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
