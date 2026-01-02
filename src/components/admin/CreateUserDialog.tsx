import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LocationSelect } from "@/components/auth/LocationSelect";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Role } from "@/types/auth";
import { UserPlus, Loader2, Eye, EyeOff, Copy, RefreshCw, Mail } from "lucide-react";

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

interface CreateUserDialogProps {
    onSuccess: () => void;
}

// Generate a random temporary password
function generateTempPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure at least one uppercase, one lowercase, one number
    return password + "A1a";
}

export function CreateUserDialog({ onSuccess }: CreateUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(() => generateTempPassword());
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<Exclude<Role, "admin">>("farmer");
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
    const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

    const handleLocationChange = useCallback((location: LocationData) => {
        setLocationData(location);
    }, []);

    const regeneratePassword = () => {
        setPassword(generateTempPassword());
    };

    const copyPassword = async () => {
        try {
            await navigator.clipboard.writeText(password);
            toast({
                title: "Password disalin",
                description: "Password sementara telah disalin ke clipboard",
            });
        } catch {
            toast({
                title: "Gagal menyalin",
                description: "Silakan salin password secara manual",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setEmail("");
        setPassword(generateTempPassword());
        setFullName("");
        setPhone("");
        setRole("farmer");
        setLocationData({
            provinceCode: "",
            provinceName: "",
            regencyCode: "",
            regencyName: "",
            districtCode: "",
            districtName: "",
            villageCode: "",
            villageName: "",
        });
        setSendWelcomeEmail(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password || !fullName) {
            toast({
                title: "Data tidak lengkap",
                description: "Email, password, dan nama lengkap wajib diisi",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "Password terlalu pendek",
                description: "Password minimal 6 karakter",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            // Use supabase.functions.invoke() for proper JWT handling
            // This automatically sends the correct auth headers
            const { data, error } = await supabase.functions.invoke("create-user", {
                body: {
                    email,
                    password,
                    full_name: fullName,
                    phone: phone || undefined,
                    role,
                    province_code: locationData.provinceCode || undefined,
                    province_name: locationData.provinceName || undefined,
                    regency_code: locationData.regencyCode || undefined,
                    regency_name: locationData.regencyName || undefined,
                    district_code: locationData.districtCode || undefined,
                    district_name: locationData.districtName || undefined,
                    village_code: locationData.villageCode || undefined,
                    village_name: locationData.villageName || undefined,
                },
            });

            if (error) {
                throw new Error(error.message || "Gagal membuat pengguna");
            }

            // Try to send welcome email if checkbox is checked
            if (sendWelcomeEmail) {
                try {
                    const { error: emailError } = await supabase.functions.invoke("send-welcome-email", {
                        body: {
                            user_id: data?.user?.id,
                            email,
                            full_name: fullName,
                            temp_password: password,
                            role,
                        },
                    });

                    if (emailError) {
                        console.warn("Failed to send welcome email:", emailError);
                        toast({
                            title: "Pengguna berhasil dibuat!",
                            description: (
                                <div className="mt-2 space-y-2">
                                    <p>
                                        <strong>Email:</strong> {email}
                                    </p>
                                    <p>
                                        <strong>Password:</strong> {password}
                                    </p>
                                    <p className="text-amber-600 text-sm">⚠️ Gagal mengirim welcome email. Berikan kredensial ini secara manual kepada pengguna.</p>
                                </div>
                            ),
                            duration: 15000,
                        });
                    } else {
                        toast({
                            title: "Pengguna berhasil dibuat!",
                            description: (
                                <div className="mt-2 space-y-2">
                                    <p className="text-green-600">✅ Welcome email telah dikirim ke {email}</p>
                                    <p className="text-sm text-muted-foreground">Pengguna akan diminta untuk mengubah password saat login pertama.</p>
                                </div>
                            ),
                            duration: 8000,
                        });
                    }
                } catch (emailErr) {
                    console.warn("Welcome email error:", emailErr);
                    toast({
                        title: "Pengguna berhasil dibuat!",
                        description: (
                            <div className="mt-2 space-y-2">
                                <p>
                                    <strong>Email:</strong> {email}
                                </p>
                                <p>
                                    <strong>Password:</strong> {password}
                                </p>
                                <p className="text-amber-600 text-sm">⚠️ Gagal mengirim welcome email. Berikan kredensial ini secara manual kepada pengguna.</p>
                            </div>
                        ),
                        duration: 15000,
                    });
                }
            } else {
                toast({
                    title: "Pengguna berhasil dibuat!",
                    description: (
                        <div className="mt-2 space-y-2">
                            <p>
                                <strong>Email:</strong> {email}
                            </p>
                            <p>
                                <strong>Password:</strong> {password}
                            </p>
                            <p className="text-sm text-muted-foreground">Berikan kredensial ini kepada pengguna. Mereka akan diminta untuk mengubah password saat login pertama.</p>
                        </div>
                    ),
                    duration: 10000,
                });
            }

            resetForm();
            setOpen(false);
            onSuccess();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat membuat pengguna";
            toast({
                title: "Gagal membuat pengguna",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tambah Pengguna
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                    <DialogDescription>Buat akun baru untuk petani, manager, atau observer. Pengguna akan diminta mengubah password saat login pertama.</DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Email <span className="text-destructive">*</span>
                            </Label>
                            <Input id="email" type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>

                        {/* Password with generate and copy */}
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Password Sementara <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button type="button" variant="outline" size="icon" onClick={regeneratePassword} title="Generate password baru">
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="outline" size="icon" onClick={copyPassword} title="Salin password">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Password minimal 6 karakter</p>
                        </div>

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName">
                                Nama Lengkap <span className="text-destructive">*</span>
                            </Label>
                            <Input id="fullName" type="text" placeholder="Nama lengkap pengguna" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">No HP (opsional)</Label>
                            <Input id="phone" type="tel" placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <Label htmlFor="role">
                                Role <span className="text-destructive">*</span>
                            </Label>
                            <Select value={role} onValueChange={(value) => setRole(value as Exclude<Role, "admin">)}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Pilih role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="farmer">Petani</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="observer">Observer</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Petani: input data sendiri | Manager: kelola petani binaannya | Observer: lihat semua data (read-only)</p>
                        </div>

                        {/* Send Welcome Email */}
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="sendWelcomeEmail" checked={sendWelcomeEmail} onCheckedChange={(checked) => setSendWelcomeEmail(checked as boolean)} />
                            <Label htmlFor="sendWelcomeEmail" className="flex items-center gap-2 cursor-pointer text-sm font-normal">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                Kirim welcome email ke pengguna
                            </Label>
                        </div>

                        {/* Location (optional) */}
                        <div className="border-t pt-4">
                            <p className="text-sm text-muted-foreground mb-4">Lokasi (opsional)</p>
                            <LocationSelect onLocationChange={handleLocationChange} defaultToTernate={false} />
                        </div>
                    </form>
                </ScrollArea>

                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Buat Pengguna
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
