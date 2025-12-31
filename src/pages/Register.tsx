import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationSelect } from "@/components/auth/LocationSelect";
import { Loader2, Leaf, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LocationData {
    provinceCode: string;
    provinceName: string;
    regencyCode: string;
    regencyName: string;
    districtCode: string;
    districtName: string;
    villageCode: string;
    villageName: string;
}

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [locationData, setLocationData] = useState<LocationData>({
        provinceCode: "",
        provinceName: "",
        regencyCode: "",
        regencyName: "",
        districtCode: "",
        districtName: "",
        villageCode: "",
        villageName: "",
    });

    // Honeypot field - bots will fill this
    const [honeypot, setHoneypot] = useState("");

    const { signUp, user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate("/");
        }
    }, [user, loading, navigate]);

    const handleLocationChange = useCallback((location: LocationData) => {
        setLocationData(location);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Honeypot check - silently reject if filled
        if (honeypot) {
            // Simulate success to confuse bots
            await new Promise((resolve) => setTimeout(resolve, 1500));
            navigate("/login");
            return;
        }

        // Validation
        if (password !== confirmPassword) {
            setError("Password tidak cocok");
            return;
        }

        if (password.length < 6) {
            setError("Password minimal 6 karakter");
            return;
        }

        setIsLoading(true);

        try {
            // Sign up user
            await signUp(email, password, fullName);

            // Update profile with location data
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                await supabase
                    .from("user_profiles")
                    .update({
                        phone,
                        province_code: locationData.provinceCode,
                        province_name: locationData.provinceName,
                        regency_code: locationData.regencyCode,
                        regency_name: locationData.regencyName,
                        district_code: locationData.districtCode,
                        district_name: locationData.districtName,
                        village_code: locationData.villageCode,
                        village_name: locationData.villageName,
                    })
                    .eq("id", user.id);
            }

            navigate("/login", {
                state: { message: "Silakan cek email Anda untuk konfirmasi." },
            });
        } catch {
            // Error handled in AuthContext
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4 py-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Leaf className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Daftar DigiFarm</CardTitle>
                    <CardDescription>Buat akun untuk mulai mengelola pertanian Anda secara digital</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-md">{error}</div>}

                        {/* Honeypot field - hidden from users, visible to bots */}
                        <input
                            type="text"
                            name="website"
                            value={honeypot}
                            onChange={(e) => setHoneypot(e.target.value)}
                            style={{
                                position: "absolute",
                                left: "-9999px",
                                opacity: 0,
                                pointerEvents: "none",
                            }}
                            tabIndex={-1}
                            autoComplete="off"
                            aria-hidden="true"
                        />

                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nama Lengkap</Label>
                            <Input id="fullName" type="text" placeholder="Nama lengkap Anda" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Nomor HP (opsional)</Label>
                            <Input id="phone" type="tel" placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                            <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                        </div>

                        <div className="border-t pt-4">
                            <p className="text-sm text-muted-foreground mb-4">Lokasi Anda (opsional, dapat diubah nanti)</p>
                            <LocationSelect onLocationChange={handleLocationChange} defaultToTernate={true} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Daftar
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            Sudah punya akun?{" "}
                            <Link to="/login" className="text-primary hover:underline">
                                Masuk
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
