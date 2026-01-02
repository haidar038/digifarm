import { SidebarProvider } from "@/components/ui/sidebar";
import { ManagerSidebar } from "./ManagerSidebar";

interface ManagerLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export function ManagerLayout({ children, title, description }: ManagerLayoutProps) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/30">
                <ManagerSidebar />
                <main className="flex-1 overflow-auto">
                    <div className="container max-w-7xl py-6 px-4 md:px-6 lg:px-8 space-y-6">
                        {(title || description) && (
                            <header className="space-y-2">
                                {title && <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{title}</h1>}
                                {description && <p className="text-muted-foreground">{description}</p>}
                            </header>
                        )}
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
