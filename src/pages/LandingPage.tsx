import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Leaf, BarChart3, Users, Cloud, MessageSquare, BookOpen, TrendingUp, Shield, Smartphone, MapPin, ChevronRight, Warehouse, Target, Eye, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StatCard } from "@/components/overview/StatCard";
import { CommodityPriceCard } from "@/components/overview/CommodityPriceCard";
import { useActivityStats } from "@/hooks/useActivityStats";
import { useRegencyStats } from "@/hooks/useFarmerMapData";
import { usePublicArticles } from "@/hooks/useArticles";
import { FarmerDistributionMap } from "@/components/landing/FarmerDistributionMap";
import Autoplay from "embla-carousel-autoplay";

// ============================================
// LANDING PAGE - REDESIGNED
// ============================================

// Data testimoni (from Figma design)
const TESTIMONIALS = [
    {
        name: "Betty K. Lahati, M.Si",
        role: "Dosen Agroteknologi, Universitas Khairun dan Tenaga Ahli Pertanian",
        content: "Ketahanan pangan merupakan suatu kondisi terpenuhinya kebutuhan pangan rumah tangga yang tercermin dari tersedianya pangan secara cukup.",
    },
    {
        name: "Bambang Irwan",
        role: "Ketua Rindang Kalumpang",
        content: "Program ini sangat membantu masyarakat terutama petani untuk mengembangkan perkebunan mereka.",
    },
    {
        name: "Nurjana Andili",
        role: "Ketua Rindang Kelurahan Sasa",
        content: "Terima kasih untuk Bank Indonesia yang telah membuat program yang sangat membantu petani di kelurahan Sasa.",
    },
];

// Data partner dengan logo aktual
const PARTNERS = [
    { name: "Bank Indonesia", logo: "/logo/BI_Logo.png" },
    { name: "Universitas Khairun", logo: "/logo/unkhair.png" },
    { name: "Pemkot Ternate", logo: "/logo/pemkot.png" },
    { name: "Radio Republik Indonesia", logo: "/logo/rri-logo.svg" },
    { name: "Salawaku Project", logo: "/logo/salawaku.svg" },
    { name: "Ternate Creative Space", logo: "/logo/TCS.svg" },
];

// Data FAQ
const FAQ_DATA = [
    {
        question: "Apa itu DigiFarm RINDANG?",
        answer: "DigiFarm RINDANG adalah platform manajemen pertanian digital yang membantu petani mengelola lahan, produksi, dan mendapatkan informasi pertanian terkini seperti harga komoditas dan prakiraan cuaca.",
    },
    {
        question: "Apakah DigiFarm gratis?",
        answer: "Ya, DigiFarm dapat digunakan secara gratis untuk petani. Fitur dasar seperti manajemen lahan, produksi, dan akses informasi tersedia tanpa biaya.",
    },
    {
        question: "Bagaimana cara mendaftar?",
        answer: "Pendaftaran dilakukan melalui undangan dari admin atau manager. Hubungi Dinas Pertanian setempat atau mitra kami untuk mendapatkan akses.",
    },
    {
        question: "Apakah data saya aman?",
        answer: "Keamanan data adalah prioritas kami. Semua data dienkripsi dan disimpan dengan standar keamanan tinggi menggunakan infrastruktur Supabase.",
    },
    {
        question: "Fitur apa saja yang tersedia?",
        answer: "Fitur meliputi: Manajemen Lahan, Tracking Produksi, Analitik & Laporan, Prakiraan Cuaca, Harga Komoditas, AI Assistant, Artikel, dan Forum Diskusi.",
    },
];

/**
 * Activity Stats Cards Component
 * Displays commodity prices carousel and aggregated stats on the landing page
 */
function ActivityStatsCards() {
    const { data: stats, isLoading } = useActivityStats();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Commodity Prices Carousel */}
            <CommodityPriceCard />

            {/* Total Production */}
            <StatCard title="Jumlah Produksi" value={isLoading ? "..." : `${stats?.totalProduction.toLocaleString() ?? 0} kg`} subtitle="Total Panen" subtitleValue="Sepanjang Waktu" icon={TrendingUp} />

            {/* Land Area */}
            <StatCard title="Luas Lahan" value={isLoading ? "..." : `${stats?.totalLandArea.toLocaleString() ?? 0} m²`} subtitle="Jumlah Kebun" subtitleValue={isLoading ? "..." : `${stats?.landCount ?? 0} lahan`} icon={Warehouse} />

            {/* Farmer Count */}
            <StatCard title="Jumlah Petani" value={isLoading ? "..." : stats?.farmerCount ?? 0} subtitle="Petani Terdaftar" subtitleValue="Aktif" icon={Users} />
        </div>
    );
}

const LandingPage = () => {
    const regencyStats = useRegencyStats();
    const { data: articles = [], isLoading: isArticlesLoading } = usePublicArticles({ limit: 3 });

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* ===== 1. HERO SECTION - REDESIGNED ===== */}
            <section className="relative py-16 lg:py-24 overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-green-500/5" />
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors" variant="outline">
                                    <Leaf className="h-4 w-4" />
                                    Platform Pertanian Digital #1 di Maluku Utara
                                </Badge>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                                    Kelola Pertanian Anda dengan{" "}
                                    <span className="text-primary relative">
                                        Lebih Cerdas
                                        <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2 10C50 2 150 2 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/30" />
                                        </svg>
                                    </span>
                                </h1>
                                <p className="text-md md:text-lg text-muted-foreground max-w-xl">RINDANG membantu petani mengelola lahan, memantau produksi, dan mengakses informasi pertanian terkini dalam satu platform terintegrasi.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/login">
                                    <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                                        Mulai Sekarang
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <a href="#tentang">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto hover:bg-muted">
                                        Pelajari Lebih Lanjut
                                    </Button>
                                </a>
                            </div>
                        </div>

                        {/* Right Image - Desktop only */}
                        <div className="hidden lg:block relative lg:pl-8">
                            <img src="/hero-img.png" alt="Petani menggunakan teknologi DigiFarm" className="w-full h-auto object-cover rounded-2xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== 1.5 ACTIVITY STATISTICS ===== */}
            <section className="py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">Statistik Aktivitas</h2>
                        <p className="text-muted-foreground">Data pertanian terkini dari platform DigiFarm</p>
                    </div>
                    <ActivityStatsCards />
                </div>
            </section>

            {/* ===== 2. TENTANG KAMI - REDESIGNED ===== */}
            <section id="tentang" className="py-20 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-transparent to-muted/30" />

                <div className="container mx-auto px-4 relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                        {/* Left Image */}
                        <div className="relative order-2 lg:order-1">
                            <img src="/about-image.webp" alt="Tim DigiFarm bekerja dengan petani" className="w-full h-auto object-cover rounded-lg" />
                        </div>

                        {/* Right Content */}
                        <div className="space-y-6 order-1 lg:order-2">
                            <Badge variant="outline" className="text-primary border-primary/30">
                                Tentang Kami
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold">Memberdayakan Petani Melalui Teknologi Digital</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                RINDANG (Riset Inovasi Digitalisasi Agraria Nasional Gotong-royong) adalah inisiatif digitalisasi sektor pertanian yang bertujuan untuk meningkatkan produktivitas dan kesejahteraan petani melalui teknologi.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                Kami berkomitmen untuk menjadi mitra terpercaya bagi petani Indonesia dalam menghadapi tantangan pertanian modern dengan solusi digital yang inovatif dan mudah digunakan.
                            </p>
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="group hover:shadow-xl transition-all duration-300 border-primary/10 hover:border-primary/30 bg-gradient-to-br from-card to-card/50">
                            <CardHeader className="space-y-4">
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Eye className="h-7 w-7 text-primary" />
                                </div>
                                <CardTitle className="text-xl">Visi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Menjadi platform pertanian digital terdepan yang memberdayakan petani Indonesia menuju pertanian modern dan berkelanjutan.</p>
                            </CardContent>
                        </Card>

                        <Card className="group hover:shadow-xl transition-all duration-300 border-primary/10 hover:border-primary/30 bg-gradient-to-br from-card to-card/50">
                            <CardHeader className="space-y-4">
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Target className="h-7 w-7 text-primary" />
                                </div>
                                <CardTitle className="text-xl">Misi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Menyediakan tools digital yang mudah digunakan untuk membantu petani meningkatkan efisiensi dan hasil produksi pertanian.</p>
                            </CardContent>
                        </Card>

                        <Card className="group hover:shadow-xl transition-all duration-300 border-primary/10 hover:border-primary/30 bg-gradient-to-br from-card to-card/50">
                            <CardHeader className="space-y-4">
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Zap className="h-7 w-7 text-primary" />
                                </div>
                                <CardTitle className="text-xl">Dampak</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Telah membantu lebih dari 100+ petani di Maluku Utara dalam mengelola produksi pertanian mereka secara digital.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ===== 3. PETA SEBARAN PETANI ===== */}
            <section id="peta" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <Badge variant="outline" className="mb-4 text-primary border-primary/30">
                            Sebaran Wilayah
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Peta Sebaran Petani</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Lihat sebaran petani yang telah bergabung dengan DigiFarm RINDANG di seluruh wilayah Maluku Utara.</p>
                    </div>
                    <Card className="overflow-hidden shadow-xl border-primary/10">
                        <CardContent className="p-0">
                            <FarmerDistributionMap className="h-[500px] w-full" />
                        </CardContent>
                    </Card>
                    {/* Regency Legend */}
                    {regencyStats.length > 0 && (
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {regencyStats.slice(0, 4).map((regency, index) => (
                                <Card key={index} className="hover:shadow-lg transition-shadow border-primary/10">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            <span className="font-medium truncate">Kota {regency.name}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-primary">{regency.landCount}</p>
                                        <p className="text-sm text-muted-foreground">Lahan Terdaftar</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ===== 4. MANFAAT/FITUR ===== */}
            <section id="manfaat" className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <Badge variant="outline" className="mb-4 text-primary border-primary/30">
                            Fitur Unggulan
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Manfaat DigiFarm</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Fitur-fitur unggulan yang membantu Anda mengelola pertanian dengan lebih efisien.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: BarChart3, title: "Manajemen Lahan", desc: "Kelola dan pantau semua lahan pertanian Anda dalam satu dashboard." },
                            { icon: TrendingUp, title: "Tracking Produksi", desc: "Catat siklus tanam hingga panen dengan detail lengkap." },
                            { icon: Cloud, title: "Prakiraan Cuaca", desc: "Dapatkan informasi cuaca terkini untuk perencanaan yang lebih baik." },
                            { icon: MessageSquare, title: "AI Assistant", desc: "Tanya jawab dengan AI untuk solusi permasalahan pertanian." },
                            { icon: BookOpen, title: "Artikel Edukasi", desc: "Akses berbagai artikel seputar budidaya dan tips pertanian." },
                            { icon: Users, title: "Forum Diskusi", desc: "Berdiskusi dengan petani lain dan para ahli pertanian." },
                            { icon: Shield, title: "Harga Komoditas", desc: "Pantau harga pasar komoditas secara real-time." },
                            { icon: Smartphone, title: "Akses Mobile", desc: "Akses dari smartphone kapan saja dan di mana saja." },
                        ].map((feature, index) => (
                            <Card key={index} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-primary/10 hover:border-primary/30">
                                <CardHeader>
                                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
                                        <feature.icon className="h-7 w-7 text-primary" />
                                    </div>
                                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                                    <CardDescription>{feature.desc}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== 5. ARTIKEL HIGHLIGHT ===== */}
            <section id="artikel" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
                        <div>
                            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
                                Blog & Edukasi
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold mb-2">Artikel Terbaru</h2>
                            <p className="text-muted-foreground">Informasi dan tips seputar pertanian</p>
                        </div>
                        <Link to="/articles">
                            <Button variant="outline" className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors">
                                Lihat Semua
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {isArticlesLoading ? (
                            // Loading skeleton
                            [...Array(3)].map((_, index) => (
                                <Card key={index} className="animate-pulse">
                                    <CardHeader>
                                        <div className="h-4 bg-muted rounded w-20 mb-2" />
                                        <div className="h-6 bg-muted rounded w-full mb-2" />
                                        <div className="h-4 bg-muted rounded w-3/4" />
                                    </CardHeader>
                                </Card>
                            ))
                        ) : articles.length > 0 ? (
                            articles.map((article) => (
                                <Link to={`/articles/${article.slug}`} key={article.id}>
                                    <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-primary/10 hover:border-primary/30 overflow-hidden h-full">
                                        <div className="h-2 bg-gradient-to-r from-primary to-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CardHeader>
                                            <div className="flex justify-between items-center gap-2 mb-2">
                                                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                                    {article.category?.name || "Umum"}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">{new Date(article.published_at || article.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                            </div>
                                            <div className="space-y-4">
                                                <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">{article.title}</CardTitle>
                                                <CardDescription className="line-clamp-2 text-sm">{article.excerpt}</CardDescription>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-8 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Belum ada artikel yang dipublikasikan</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ===== 6. TESTIMONI CAROUSEL ===== */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <Badge variant="outline" className="mb-4 text-primary border-primary/30">
                            Testimoni
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Apa Kata Mereka?</h2>
                        <p className="text-muted-foreground text-lg">Testimoni dari petani dan mitra yang telah bergabung dengan RINDANG</p>
                    </div>

                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 5000,
                                stopOnInteraction: true,
                            }),
                        ]}
                        className="w-full max-w-5xl mx-auto"
                    >
                        <CarouselContent className="-ml-4">
                            {TESTIMONIALS.map((testimonial, index) => (
                                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                    <div className="bg-card border border-border rounded-3xl p-6 h-full flex flex-col justify-between hover:shadow-lg transition-shadow">
                                        <p className="text-muted-foreground italic text-sm leading-relaxed mb-6">&ldquo;{testimonial.content}&rdquo;</p>
                                        <div className="space-y-1">
                                            <p className="font-bold text-foreground">{testimonial.name}</p>
                                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="flex justify-center gap-2 mt-8">
                            <CarouselPrevious className="static translate-y-0" />
                            <CarouselNext className="static translate-y-0" />
                        </div>
                    </Carousel>
                </div>
            </section>

            {/* ===== 7. PARTNER & KOLABORATOR - REDESIGNED ===== */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <Badge variant="outline" className="mb-4 text-primary border-primary/30">
                            Kemitraan
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Partner & Kolaborator</h2>
                        <p className="text-muted-foreground text-lg">Didukung oleh berbagai instansi dan lembaga terpercaya</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                        {PARTNERS.map((partner, index) => (
                            <div key={index} className="group flex flex-col items-center justify-center p-4">
                                <div className="h-12 w-full flex items-center justify-center mb-3 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300">
                                    <img src={partner.logo} alt={partner.name} className="h-12 w-auto object-contain" />
                                </div>
                                <p className="font-medium text-xs text-center text-muted-foreground group-hover:text-foreground transition-colors">{partner.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== 8. FAQ ===== */}
            <section id="faq" className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12">
                            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
                                FAQ
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pertanyaan Umum</h2>
                            <p className="text-muted-foreground text-lg">Jawaban untuk pertanyaan yang sering diajukan</p>
                        </div>
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {FAQ_DATA.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6 bg-card hover:shadow-md transition-shadow">
                                    <AccordionTrigger className="text-left hover:no-underline py-5">
                                        <span className="font-semibold">{faq.question}</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground pb-5">{faq.answer}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>

            {/* ===== 9. CTA - REDESIGNED ===== */}
            <section className="py-20 relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-green-600" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

                {/* Decorative circles */}
                <div className="absolute top-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/5 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 relative">
                    <div className="max-w-3xl mx-auto text-center text-primary-foreground">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Siap Memulai Pertanian Digital?</h2>
                        <p className="text-lg md:text-xl opacity-90 mb-10 max-w-2xl mx-auto">Bergabunglah dengan ratusan petani lainnya yang telah merasakan manfaat DigiFarm RINDANG.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/login">
                                <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 shadow-xl hover:shadow-2xl transition-all">
                                    Masuk ke Dashboard
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <a href="mailto:support@rindang.net">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-all">
                                    Hubungi Kami
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;
