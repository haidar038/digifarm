import { LayoutDashboard, Map, Users, LogOut, User, ChevronDown, Shield } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useRole } from "@/hooks/useRole";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MenuItem {
    title: string;
    url: string;
    icon: React.ElementType;
}

const adminMenuItems: MenuItem[] = [
    { title: "Overview", url: "/admin", icon: LayoutDashboard },
    { title: "Manajemen Lahan", url: "/admin/lands", icon: Map },
    { title: "Manajemen Pengguna", url: "/admin/users", icon: Users },
];

// Get initials from full name
function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function AdminSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut, profile } = useAuth();
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
                    <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="font-bold text-lg text-foreground tracking-tight">RINDANG</span>
                            <span className="text-xs text-muted-foreground">Admin Panel</span>
                        </div>
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3 py-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        ADMIN
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {adminMenuItems.map((item) => {
                                const isActive = location.pathname === item.url;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            className={cn("w-full transition-all duration-200", isActive ? "bg-red-600 text-white shadow-lg hover:bg-red-700 hover:text-white" : "hover:bg-accent text-sidebar-foreground")}
                                        >
                                            <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                                                <item.icon className={cn("w-5 h-5", isActive && "text-white")} />
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
                                    <AvatarFallback className="bg-red-100 text-red-600 font-medium text-sm">{getInitials(profile.full_name)}</AvatarFallback>
                                </Avatar>
                                {!isCollapsed && (
                                    <>
                                        <div className="flex flex-col min-w-0 flex-1 text-left">
                                            <span className="text-sm font-medium truncate">{profile.full_name}</span>
                                            <Badge variant="destructive" className="w-fit text-xs px-1.5 py-0">
                                                Admin
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
