import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Info, RefreshCw } from "lucide-react";

// Password Schema
const passwordSchema = z
    .object({
        password: z.string().min(6, "Password minimal 6 karakter"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Password tidak cocok",
        path: ["confirmPassword"],
    });

// Email Schema
const emailSchema = z.object({
    email: z.string().email("Email tidak valid"),
});

export function SecurityForm() {
    const { user } = useAuth();
    const [loadingPass, setLoadingPass] = useState(false);
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Forms
    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const emailForm = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: user?.email || "" },
    });

    const onUpdatePassword = async (data: z.infer<typeof passwordSchema>) => {
        setLoadingPass(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) throw error;

            toast({
                title: "Password Berhasil Diubah",
                description: "Silakan gunakan password baru Anda untuk login berikutnya.",
            });
            passwordForm.reset();
        } catch (error: any) {
            toast({
                title: "Gagal Mengubah Password",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoadingPass(false);
        }
    };

    const onUpdateEmail = async (data: z.infer<typeof emailSchema>) => {
        if (data.email === user?.email) {
            toast({
                title: "Info",
                description: "Email yang dimasukkan sama dengan email saat ini.",
            });
            return;
        }

        setLoadingEmail(true);
        try {
            const { error } = await supabase.auth.updateUser({
                email: data.email,
            });

            if (error) throw error;

            toast({
                title: "Konfirmasi Diperlukan!",
                description: "Link konfirmasi telah dikirim ke email LAMA dan email BARU Anda. Harap klik keduanya.",
                duration: 10000, // Show longer
            });
        } catch (error: any) {
            toast({
                title: "Gagal Mengubah Email",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoadingEmail(false);
        }
    };

    const handleRefreshSession = async () => {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
            toast({
                title: "Gagal refresh sesi",
                description: "Silakan login ulang jika data belum berubah.",
                variant: "destructive",
            });
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Ubah Password</CardTitle>
                    <CardDescription>Amankan akun Anda dengan password yang kuat.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={passwordForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password Baru</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Konfirmasi Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={loadingPass}>
                                    {loadingPass && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Ubah Password
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Ubah Email</CardTitle>
                    <CardDescription>Ubah alamat email yang terhubung dengan akun Anda.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-6 bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">Penting: Konfirmasi Ganda</AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Demi keamanan, perubahan email memerlukan konfirmasi dari <strong>kedua</strong> alamat email (email lama dan email baru). Pastikan Anda memiliki akses ke kedua inbox tersebut.
                        </AlertDescription>
                    </Alert>

                    <Form {...emailForm}>
                        <form onSubmit={emailForm.handleSubmit(onUpdateEmail)} className="space-y-4">
                            <FormField
                                control={emailForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Baru</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="nama@email.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex flex-col sm:flex-row justify-between gap-3">
                                <div className="text-sm text-muted-foreground self-center">
                                    Email saat ini: <span className="font-medium text-foreground">{user?.email}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={handleRefreshSession} title="Refresh Data">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                    <Button type="submit" variant="outline" disabled={loadingEmail}>
                                        {loadingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Ubah Email
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
