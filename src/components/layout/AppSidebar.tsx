import { LayoutDashboard, Map, Sprout, Cloud, LogOut, User, BarChart3, ChevronDown, CalendarDays } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useRole } from "@/hooks/useRole";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Role } from "@/types/auth";

interface MenuItem {
    title: string;
    url: string;
    icon: React.ElementType;
}

const menuItems: MenuItem[] = [
    { title: "Ringkasan", url: "/", icon: LayoutDashboard },
    { title: "Manajemen Lahan", url: "/lands", icon: Map },
    { title: "Produksi", url: "/production", icon: Sprout },
    { title: "Perencanaan", url: "/planning", icon: CalendarDays },
    { title: "Analitik", url: "/analytics", icon: BarChart3 },
    { title: "Cuaca", url: "/weather", icon: Cloud },
];

// Helper to get role badge variant and label
function getRoleBadgeInfo(role: Role): { variant: "default" | "secondary" | "destructive" | "outline"; label: string } {
    switch (role) {
        case "admin":
            return { variant: "destructive", label: "Admin" };
        case "manager":
            return { variant: "default", label: "Manager" };
        case "farmer":
        default:
            return { variant: "secondary", label: "Petani" };
    }
}

// Get initials from full name
function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function AppSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut, profile } = useAuth();
    const { role } = useRole();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    const handleLogout = async () => {
        await signOut();
        navigate("/login");
    };

    const roleBadge = getRoleBadgeInfo(role);

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
                {profile && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn("flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition-colors", isCollapsed && "justify-center")}>
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">{getInitials(profile.full_name)}</AvatarFallback>
                                </Avatar>
                                {!isCollapsed && (
                                    <>
                                        <div className="flex flex-col min-w-0 flex-1 text-left">
                                            <span className="text-sm font-medium truncate">{profile.full_name}</span>
                                            <Badge variant={roleBadge.variant} className="w-fit text-xs px-1.5 py-0">
                                                {roleBadge.label}
                                            </Badge>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => navigate("/profile")}>
                                <User className="w-4 h-4 mr-2" />
                                Profil Saya
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                                <LogOut className="w-4 h-4 mr-2" />
                                Keluar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
