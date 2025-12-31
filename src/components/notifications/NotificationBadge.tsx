import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationList } from "./NotificationList";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export function NotificationBadge() {
    const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label={`Notifikasi${unreadCount > 0 ? ` (${unreadCount} belum dibaca)` : ""}`}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className={cn("absolute -top-0.5 -right-0.5 flex items-center justify-center", "min-w-[18px] h-[18px] px-1 rounded-full", "bg-red-500 text-white text-[10px] font-medium", "animate-in zoom-in-50 duration-200")}>
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                <div className="border-b px-4 py-3">
                    <h3 className="font-semibold text-sm">Notifikasi</h3>
                </div>
                <NotificationList notifications={notifications} isLoading={isLoading} onMarkAsRead={markAsRead} onMarkAllAsRead={markAllAsRead} />
            </PopoverContent>
        </Popover>
    );
}
