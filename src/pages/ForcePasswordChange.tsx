import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, KeyRound, Eye, EyeOff, Check, X } from "lucide-react";

export default function ForcePasswordChange() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { user, profile, loading, refreshProfile } = useAuth();
    const navigate = useNavigate();

    // Redirect if not logged in or doesn't need password change
    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate("/login");
            } else if (profile && !profile.must_change_password) {
                navigate("/");
            }
        }
    }, [user, profile, loading, navigate]);

    // Password strength checks
    const passwordChecks = {
        minLength: newPassword.length >= 6,
        hasUppercase: /[A-Z]/.test(newPassword),
        hasLowercase: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        matches: newPassword === confirmPassword && confirmPassword.length > 0,
    };

    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPasswordValid) {
            toast({
                title: "Password tidak valid",
                description: "Mohon penuhi semua persyaratan password",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            // Update auth password
            const { error: authError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (authError) {
                throw authError;
            }

            // Update profile to mark password as changed
            if (user) {
                const { error: profileError } = await supabase.from("user_profiles").update({ must_change_password: false }).eq("id", user.id);

                if (profileError) {
                    console.error("Failed to update profile:", profileError);
                    // Don't fail the whole operation, password is already changed
                }
            }

            toast({
                title: "Password berhasil diubah!",
                description: "Anda akan dialihkan ke dashboard",
            });

            // Refresh profile to update must_change_password state
            await refreshProfile();

            // Small delay to show success message, then navigate
            setTimeout(() => {
                navigate("/");
            }, 1000);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat mengubah password";
            toast({
                title: "Gagal mengubah password",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while checking auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <KeyRound className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Ubah Password</CardTitle>
                    <CardDescription>Untuk keamanan akun Anda, silakan buat password baru sebelum melanjutkan.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {/* New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Password Baru</Label>
                            <div className="relative">
                                <Input id="newPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                            <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                        </div>

                        {/* Password Requirements */}
                        <div className="space-y-2 text-sm">
                            <p className="font-medium text-muted-foreground">Persyaratan password:</p>
                            <ul className="space-y-1">
                                <PasswordCheck label="Minimal 6 karakter" passed={passwordChecks.minLength} />
                                <PasswordCheck label="Mengandung huruf besar" passed={passwordChecks.hasUppercase} />
                                <PasswordCheck label="Mengandung huruf kecil" passed={passwordChecks.hasLowercase} />
                                <PasswordCheck label="Mengandung angka" passed={passwordChecks.hasNumber} />
                                <PasswordCheck label="Konfirmasi password cocok" passed={passwordChecks.matches} />
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading || !isPasswordValid}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Password Baru
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

function PasswordCheck({ label, passed }: { label: string; passed: boolean }) {
    return (
        <li className={`flex items-center gap-2 ${passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
            {passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {label}
        </li>
    );
}
