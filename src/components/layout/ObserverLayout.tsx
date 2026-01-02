import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { ObserverSidebar } from "./ObserverSidebar";
import { Menu } from "lucide-react";
import { NotificationBadge } from "@/components/notifications";

interface ObserverLayoutProps {
    children: React.ReactNode;
    title: string;
    description?: string;
}

export function ObserverLayout({ children, title, description }: ObserverLayoutProps) {
    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background">
                <ObserverSidebar />
                <SidebarInset className="flex-1">
                    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
                        <SidebarTrigger className="lg:hidden">
                            <Menu className="w-5 h-5" />
                        </SidebarTrigger>
                        <div className="flex flex-col flex-1">
                            <h1 className="text-xl font-bold text-foreground">{title}</h1>
                            {description && <p className="hidden md:block text-sm text-muted-foreground">{description}</p>}
                        </div>
                        <NotificationBadge />
                    </header>
                    <main className="flex-1 p-4 lg:p-6 animate-fade-in">{children}</main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
