import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, User, HelpCircle, CheckCircle } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const menuItems = [
    {
        title: "Dashboard",
        url: "/expert",
        icon: Home,
        description: "Ringkasan aktivitas",
    },
    {
        title: "Forum",
        url: "/forum",
        icon: MessageSquare,
        description: "Lihat semua diskusi",
    },
    {
        title: "Profil Saya",
        url: "/expert/profile",
        icon: User,
        description: "Kelola profil Anda",
    },
];

export function ExpertSidebar() {
    const location = useLocation();

    return (
        <Sidebar className="border-r">
            <SidebarHeader className="border-b px-6 py-4">
                <Link to="/expert" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-lg">DigiFarm</span>
                        <Badge variant="secondary" className="ml-2 text-xs bg-purple-100 text-purple-800">
                            Expert
                        </Badge>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">Menu Utama</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => {
                                const isActive = location.pathname === item.url;
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive} className={`py-3 px-4 ${isActive ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300" : ""}`}>
                                            <Link to={item.url} className="flex items-center gap-3">
                                                <item.icon className="w-5 h-5" />
                                                <div className="flex-1">
                                                    <span className="font-medium">{item.title}</span>
                                                </div>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-4">
                    <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">Quick Stats</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <div className="px-4 py-3 bg-muted/30 rounded-lg mx-2">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-muted-foreground">Jawaban yang diterima</span>
                            </div>
                            <p className="text-2xl font-bold mt-1">-</p>
                        </div>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t px-4 py-3">
                <div className="text-xs text-muted-foreground text-center">
                    <span>© 2026 DigiFarm Expert</span>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
