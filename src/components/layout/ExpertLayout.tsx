import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ExpertSidebar } from "./ExpertSidebar";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ExpertLayoutProps {
    children: React.ReactNode;
}

export function ExpertLayout({ children }: ExpertLayoutProps) {
    const { profile, signOut } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="min-h-screen flex w-full bg-background">
                {/* Sidebar */}
                <ExpertSidebar />

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-screen">
                    {/* Top Header */}
                    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <Menu className="h-5 w-5" />
                        </Button>

                        <div className="flex-1">
                            <Link to="/expert" className="flex items-center gap-2">
                                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">DigiFarm Expert</span>
                            </Link>
                        </div>

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-purple-100 text-purple-800">{profile?.full_name ? getInitials(profile.full_name) : "EX"}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <div className="flex items-center justify-start gap-2 p-2">
                                    <div className="flex flex-col space-y-1 leading-none">
                                        <p className="font-medium">{profile?.full_name || "Expert"}</p>
                                        <p className="text-xs text-muted-foreground">Ahli Pertanian</p>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/expert/profile" className="flex items-center">
                                        <User className="mr-2 h-4 w-4" />
                                        Profil
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => signOut()} className="text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Keluar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </header>

                    {/* Page Content */}
                    <div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
                </main>
            </div>
        </SidebarProvider>
    );
}
