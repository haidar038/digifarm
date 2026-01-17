export const Footer = () => {
    return (
        <footer className="py-12 border-t">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center mb-4">
                            <img src="/logo/rindang-primary.svg" alt="RINDANG" className="h-8 w-auto" />
                        </div>
                        <p className="text-muted-foreground mb-4 max-w-md">Platform manajemen pertanian digital untuk petani modern Indonesia. Kelola lahan, pantau produksi, dan tingkatkan hasil panen.</p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Tautan Cepat</h4>
                        <ul className="space-y-2 text-muted-foreground">
                            <li>
                                <a href="/#tentang" className="hover:text-foreground transition-colors">
                                    Tentang Kami
                                </a>
                            </li>
                            <li>
                                <a href="/#manfaat" className="hover:text-foreground transition-colors">
                                    Fitur
                                </a>
                            </li>
                            <li>
                                <a href="/#artikel" className="hover:text-foreground transition-colors">
                                    Artikel
                                </a>
                            </li>
                            <li>
                                <a href="/#faq" className="hover:text-foreground transition-colors">
                                    FAQ
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold mb-4">Kontak</h4>
                        <ul className="space-y-2 text-muted-foreground">
                            <li>📧 support@rindang.net</li>
                            <li>📍 Ternate, Maluku Utara</li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="pt-8 border-t text-center text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} DigiFarm RINDANG. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};
