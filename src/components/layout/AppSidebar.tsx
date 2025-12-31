import { LayoutDashboard, Map, Sprout, Cloud, LogOut, User } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
    { title: "Ringkasan", url: "/", icon: LayoutDashboard },
    { title: "Manajemen Lahan", url: "/lands", icon: Map },
    { title: "Produksi", url: "/production", icon: Sprout },
    { title: "Cuaca", url: "/weather", icon: Cloud },
    { title: "Profil", url: "/profile", icon: User },
];

export function AppSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    const handleLogout = async () => {
        await signOut();
        navigate("/login");
    };

    return (
        <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
            <SidebarHeader className="p-4 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
                        <Sprout className="w-5 h-5 text-primary-foreground" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="font-bold text-lg text-foreground tracking-tight">RINDANG</span>
                            <span className="text-xs text-muted-foreground">Pertanian Digital</span>
                        </div>
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3 py-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">MENU</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {menuItems.map((item) => {
                                const isActive = location.pathname === item.url;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            className={cn(
                                                "w-full transition-all duration-200",
                                                isActive ? "bg-primary text-primary-foreground shadow-primary hover:bg-primary/90 hover:text-primary-foreground" : "hover:bg-accent text-sidebar-foreground"
                                            )}
                                        >
                                            <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                                                <item.icon className={cn("w-5 h-5", isActive && "text-primary-foreground")} />
                                                <span className="font-medium">{item.title}</span>
                                            </NavLink>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t border-sidebar-border">
                <Button variant="ghost" className={cn("w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10", isCollapsed && "justify-center px-2")} onClick={handleLogout}>
                    <LogOut className="w-5 h-5 mr-3" />
                    {!isCollapsed && <span>Keluar</span>}
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
}
