import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Map, MapMarker, MapControls } from "@/components/ui/map";
import { Leaf, BarChart3, Users, Cloud, MessageSquare, BookOpen, TrendingUp, Shield, Smartphone, MapPin, ChevronRight, Star } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// ============================================
// LANDING PAGE - MINIMAL VIABLE PRODUCT
// ============================================

// Dummy data untuk Peta Sebaran
const DUMMY_LOCATIONS = [
    { name: "Ternate", lat: 0.7893, lng: 127.3815, farmers: 45, desc: "Pusat pertanian di Maluku Utara" },
    { name: "Tidore", lat: 0.6833, lng: 127.4, farmers: 32, desc: "Sentra cabai dan sayuran" },
    { name: "Jailolo", lat: 1.0833, lng: 127.4667, farmers: 28, desc: "Pertanian organik" },
    { name: "Tobelo", lat: 1.7261, lng: 128.0069, farmers: 38, desc: "Pertanian modern" },
];

// Data testimoni
const TESTIMONIALS = [
    {
        name: "Pak Ahmad",
        role: "Petani Cabai - Ternate",
        content: "Dengan DigiFarm, saya bisa memantau lahan dan produksi dengan lebih mudah. Hasil panen meningkat 30% dalam satu musim!",
        rating: 5,
    },
    {
        name: "Bu Siti",
        role: "Petani Sayuran - Tidore",
        content: "Fitur prakiraan cuaca sangat membantu saya menentukan waktu tanam yang tepat. Sangat direkomendasikan!",
        rating: 5,
    },
    {
        name: "Pak Hasan",
        role: "Petani Bawang - Jailolo",
        content: "Aplikasi yang sangat user-friendly. Bahkan saya yang kurang familiar dengan teknologi bisa menggunakannya dengan mudah.",
        rating: 4,
    },
];

// Data partner
const PARTNERS = [
    { name: "Dinas Pertanian Maluku Utara", logo: "🏛️" },
    { name: "Universitas Khairun", logo: "🎓" },
    { name: "Bank Indonesia", logo: "🏦" },
    { name: "Badan Pangan Nasional", logo: "🌾" },
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

// Data artikel dummy
const DUMMY_ARTICLES = [
    {
        title: "Teknik Budidaya Cabai yang Efektif",
        excerpt: "Pelajari cara menanam cabai dengan hasil maksimal...",
        category: "Budidaya",
        date: "02 Jan 2026",
    },
    {
        title: "Mengatasi Hama Kutu Daun pada Tanaman",
        excerpt: "Tips ampuh untuk mengendalikan hama kutu daun...",
        category: "Hama & Penyakit",
        date: "01 Jan 2026",
    },
    {
        title: "Tren Harga Komoditas Awal 2026",
        excerpt: "Analisis pergerakan harga komoditas pertanian...",
        category: "Pemasaran",
        date: "30 Des 2025",
    },
];

const LandingPage = () => {
    const [selectedLocation, setSelectedLocation] = useState<(typeof DUMMY_LOCATIONS)[0] | null>(null);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* ===== 1. HERO SECTION ===== */}
            <section className="relative py-20 md:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-green-500/10" />
                <div className="container mx-auto px-4 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <Badge className="mb-4" variant="outline">
                            🌱 Platform Pertanian Digital
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                            Kelola Pertanian Anda dengan <span className="text-primary">Lebih Cerdas</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground mb-8">DigiFarm RINDANG membantu petani mengelola lahan, memantau produksi, dan mengakses informasi pertanian terkini dalam satu platform terintegrasi.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/login">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Mulai Sekarang
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <a href="#tentang">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                    Pelajari Lebih Lanjut
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== 2. TENTANG KAMI ===== */}
            <section id="tentang" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Tentang DigiFarm</h2>
                        <p className="text-muted-foreground text-lg">
                            DigiFarm RINDANG (Riset Inovasi Digitalisasi Agraria Nasional Gotong-royong) adalah inisiatif digitalisasi sektor pertanian yang bertujuan untuk meningkatkan produktivitas dan kesejahteraan petani melalui
                            teknologi.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Leaf className="h-5 w-5 text-primary" />
                                    Visi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Menjadi platform pertanian digital terdepan yang memberdayakan petani Indonesia menuju pertanian modern dan berkelanjutan.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Misi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Menyediakan tools digital yang mudah digunakan untuk membantu petani meningkatkan efisiensi dan hasil produksi pertanian.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Dampak
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Telah membantu lebih dari 100+ petani di Maluku Utara dalam mengelola produksi pertanian mereka secara digital.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ===== 3. PETA SEBARAN (DUMMY) ===== */}
            <section id="peta" className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Peta Sebaran Petani</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Lihat sebaran petani yang telah bergabung dengan DigiFarm RINDANG di seluruh wilayah Maluku Utara.</p>
                    </div>
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="h-[500px] w-full">
                                <Map center={[127.8, 1.0]} zoom={7}>
                                    <MapControls />
                                    {DUMMY_LOCATIONS.map((loc, index) => (
                                        <MapMarker key={index} latitude={loc.lat} longitude={loc.lng} onClick={() => setSelectedLocation(loc)}>
                                            <div className="text-primary cursor-pointer transition-transform hover:scale-110">
                                                <MapPin size={32} fill="currentColor" className="stroke-white stroke-2" />
                                            </div>
                                        </MapMarker>
                                    ))}
                                </Map>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Legend */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {DUMMY_LOCATIONS.map((loc, index) => (
                            <Card key={index} className={`cursor-pointer transition-all ${selectedLocation?.name === loc.name ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedLocation(loc)}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="font-medium">{loc.name}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-primary">{loc.farmers}</p>
                                    <p className="text-sm text-muted-foreground">Petani Aktif</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== 4. MANFAAT ===== */}
            <section id="manfaat" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Manfaat DigiFarm</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Fitur-fitur unggulan yang membantu Anda mengelola pertanian dengan lebih efisien.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <BarChart3 className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Manajemen Lahan</CardTitle>
                                <CardDescription>Kelola dan pantau semua lahan pertanian Anda dalam satu dashboard.</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <TrendingUp className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Tracking Produksi</CardTitle>
                                <CardDescription>Catat siklus tanam hingga panen dengan detail lengkap.</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <Cloud className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Prakiraan Cuaca</CardTitle>
                                <CardDescription>Dapatkan informasi cuaca terkini untuk perencanaan yang lebih baik.</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>AI Assistant</CardTitle>
                                <CardDescription>Tanya jawab dengan AI untuk solusi permasalahan pertanian.</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <BookOpen className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Artikel Edukasi</CardTitle>
                                <CardDescription>Akses berbagai artikel seputar budidaya dan tips pertanian.</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Forum Diskusi</CardTitle>
                                <CardDescription>Berdiskusi dengan petani lain dan para ahli pertanian.</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <Shield className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Harga Komoditas</CardTitle>
                                <CardDescription>Pantau harga pasar komoditas secara real-time.</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <Smartphone className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Akses Mobile</CardTitle>
                                <CardDescription>Akses dari smartphone kapan saja dan di mana saja.</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ===== 5. ARTIKEL HIGHLIGHT ===== */}
            <section id="artikel" className="py-20">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-2">Artikel Terbaru</h2>
                            <p className="text-muted-foreground">Informasi dan tips seputar pertanian</p>
                        </div>
                        <Link to="/articles">
                            <Button variant="outline">
                                Lihat Semua
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {DUMMY_ARTICLES.map((article, index) => (
                            <Card key={index} className="group hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader>
                                    <div className="flex justify-between items-center gap-2 mb-2">
                                        <Badge variant="secondary">{article.category}</Badge>
                                        <span className="text-sm text-muted-foreground">{article.date}</span>
                                    </div>
                                    <CardTitle className="group-hover:text-primary transition-colors">{article.title}</CardTitle>
                                    <CardDescription>{article.excerpt}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== 6. TESTIMONI ===== */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Apa Kata Mereka?</h2>
                        <p className="text-muted-foreground text-lg">Testimoni dari petani yang telah menggunakan DigiFarm</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((testimonial, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex gap-1 mb-2">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <CardDescription className="text-base italic">"{testimonial.content}"</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{testimonial.name}</p>
                                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== 7. PARTNER & KOLABORATOR ===== */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Partner & Kolaborator</h2>
                        <p className="text-muted-foreground text-lg">Didukung oleh berbagai instansi dan lembaga terpercaya</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {PARTNERS.map((partner, index) => (
                            <Card key={index} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6 text-center">
                                    <div className="text-4xl mb-3">{partner.logo}</div>
                                    <p className="font-medium text-sm">{partner.name}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== 8. FAQ ===== */}
            <section id="faq" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pertanyaan Umum</h2>
                            <p className="text-muted-foreground text-lg">Jawaban untuk pertanyaan yang sering diajukan</p>
                        </div>
                        <Accordion type="single" collapsible className="w-full">
                            {FAQ_DATA.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>

            {/* ===== 9. CTA ===== */}
            <section className="py-20 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Siap Memulai Pertanian Digital?</h2>
                        <p className="text-lg opacity-90 mb-8">Bergabunglah dengan ratusan petani lainnya yang telah merasakan manfaat DigiFarm RINDANG.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/login">
                                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                                    Masuk ke Dashboard
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <a href="mailto:support@rindang.net">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
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
