import { Link } from "react-router-dom";
import { Sprout, MessageSquare, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface PublicForumLayoutProps {
    children: React.ReactNode;
}

/**
 * A layout for public forum pages that can be accessed without authentication.
 * Shows a banner encouraging users to login/register to participate.
 */
export function PublicForumLayout({ children }: PublicForumLayoutProps) {
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <Navbar />

            {/* Login Banner - only show if not logged in */}
            {!user && (
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                <span>Login untuk bertanya, menjawab, dan berpartisipasi dalam diskusi</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link to="/login">
                                        <LogIn className="w-4 h-4 mr-1" />
                                        Login
                                    </Link>
                                </Button>
                                <Button size="sm" asChild>
                                    <Link to="/login">
                                        <UserPlus className="w-4 h-4 mr-1" />
                                        Daftar
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-6 animate-fade-in">{children}</main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
