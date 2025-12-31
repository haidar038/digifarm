import { Notification } from "@/types/notifications";
import { getNotificationIcon, getNotificationColor } from "@/lib/notification-utils";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Wheat, CloudRain, Leaf, Droplets, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
    notification: Notification;
    onMarkAsRead?: (id: string) => void;
    onDismiss?: (id: string) => void;
}

const iconMap = {
    Wheat: Wheat,
    CloudRain: CloudRain,
    Leaf: Leaf,
    Droplets: Droplets,
};

export function NotificationCard({ notification, onMarkAsRead, onDismiss }: NotificationCardProps) {
    const iconName = getNotificationIcon(notification.type) as keyof typeof iconMap;
    const Icon = iconMap[iconName] || Wheat;
    const colorClass = getNotificationColor(notification.priority);

    const handleClick = () => {
        if (!notification.read && onMarkAsRead) {
            onMarkAsRead(notification.id);
        }
    };

    const timeAgo = formatDistanceToNow(notification.createdAt, {
        addSuffix: true,
        locale: id,
    });

    return (
        <div
            onClick={handleClick}
            className={cn("flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer", notification.read ? "bg-muted/30 border-transparent" : "bg-card border-border hover:bg-accent/50", !notification.read && "shadow-sm")}
        >
            {/* Icon */}
            <div className={cn("flex-shrink-0 p-2 rounded-full bg-muted", colorClass)}>
                <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium line-clamp-1", notification.read && "text-muted-foreground")}>{notification.title}</p>
                    {onDismiss && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDismiss(notification.id);
                            }}
                            className="flex-shrink-0 p-1 rounded hover:bg-muted"
                        >
                            <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                    )}
                </div>
                <p className={cn("text-xs line-clamp-2", notification.read ? "text-muted-foreground" : "text-foreground/80")}>{notification.message}</p>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>

            {/* Unread indicator */}
            {!notification.read && (
                <div className="flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
            )}
        </div>
    );
}
