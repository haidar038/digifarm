import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Leaf, Eye, EyeOff } from "lucide-react";

// Helper function to get redirect path based on role
function getRoleBasedRedirect(role: string | undefined): string {
    switch (role) {
        case "admin":
            return "/admin";
        case "observer":
            return "/observer";
        case "manager":
            return "/manager";
        default:
            return "/dashboard";
    }
}

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, user, profile, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect authenticated users to their role-based dashboard
    useEffect(() => {
        if (!loading && user && profile) {
            const redirectPath = getRoleBasedRedirect(profile.role);
            navigate(redirectPath, { replace: true });
        }
    }, [user, profile, loading, navigate]);

    const from = location.state?.from?.pathname;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await signIn(email.trim(), password);
            // Redirect to saved path or role-based dashboard
            navigate(from || "/dashboard", { replace: true });
        } catch {
            // Error handled in AuthContext
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Leaf className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Masuk ke DigiFarm</CardTitle>
                    <CardDescription>Masukkan email dan password untuk melanjutkan</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                                    Lupa password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Masuk
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">Belum punya akun? Hubungi admin untuk mendapat akses.</p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
