import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown, Bot, BookOpen, Users, Cloud, DollarSign } from "lucide-react";

export const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <Link to="/" className="flex items-center">
                        <img src="/logo/rindang-primary.svg" alt="RINDANG" className="h-8 w-auto" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/#tentang" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Tentang
                        </Link>

                        {/* Features Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none">
                                Fitur
                                <ChevronDown className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuItem asChild>
                                    <Link to="/ai" className="flex items-center gap-2 cursor-pointer">
                                        <Bot className="h-4 w-4" />
                                        AI Assistant
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/articles" className="flex items-center gap-2 cursor-pointer">
                                        <BookOpen className="h-4 w-4" />
                                        Artikel
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/forum" className="flex items-center gap-2 cursor-pointer">
                                        <Users className="h-4 w-4" />
                                        Forum
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Link to="/cuaca" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Cuaca
                        </Link>
                        <Link to="/harga-komoditas" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Harga Komoditas
                        </Link>

                        {/* Separator */}
                        <div className="h-4 w-px bg-border" />

                        <Link to="/#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            FAQ
                        </Link>
                        <Link to="/login">
                            <Button>Masuk</Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t">
                        <div className="flex flex-col gap-4">
                            <Link to="/#tentang" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                                Tentang
                            </Link>

                            {/* Fitur Layanan - Mobile */}
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fitur Layanan</span>
                                <div className="pl-3 space-y-2 border-l-2 border-primary/20">
                                    <Link to="/ai" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium">
                                        <Bot className="h-4 w-4" />
                                        AI Assistant
                                    </Link>
                                    <Link to="/articles" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium">
                                        <BookOpen className="h-4 w-4" />
                                        Artikel
                                    </Link>
                                    <Link to="/forum" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium">
                                        <Users className="h-4 w-4" />
                                        Forum
                                    </Link>
                                    <Link to="/cuaca" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium">
                                        <Cloud className="h-4 w-4" />
                                        Cuaca
                                    </Link>
                                    <Link to="/harga-komoditas" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium">
                                        <DollarSign className="h-4 w-4" />
                                        Harga Komoditas
                                    </Link>
                                </div>
                            </div>

                            <Link to="/#faq" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                                FAQ
                            </Link>
                            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                <Button className="w-full">Masuk</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};
