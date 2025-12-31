import { Notification } from "@/types/notifications";
import { NotificationCard } from "./NotificationCard";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationListProps {
    notifications: Notification[];
    isLoading?: boolean;
    onMarkAsRead?: (id: string) => void;
    onMarkAllAsRead?: () => void;
}

export function NotificationList({ notifications, isLoading, onMarkAsRead, onMarkAllAsRead }: NotificationListProps) {
    const unreadCount = notifications.filter((n) => !n.read).length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Tidak ada notifikasi</p>
                <p className="text-xs text-muted-foreground mt-1">Semua sudah terkendali 🌱</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {/* Header */}
            {unreadCount > 0 && onMarkAllAsRead && (
                <div className="flex items-center justify-between px-3 py-2 border-b">
                    <span className="text-xs text-muted-foreground">{unreadCount} belum dibaca</span>
                    <Button variant="ghost" size="sm" onClick={onMarkAllAsRead} className="h-7 text-xs gap-1">
                        <CheckCheck className="h-3 w-3" />
                        Tandai semua dibaca
                    </Button>
                </div>
            )}

            {/* Notification List */}
            <ScrollArea className="max-h-[400px]">
                <div className="p-2 space-y-1">
                    {notifications.map((notification) => (
                        <NotificationCard key={notification.id} notification={notification} onMarkAsRead={onMarkAsRead} />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
