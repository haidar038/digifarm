import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocationSelect } from "@/components/auth/LocationSelect";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Role } from "@/types/auth";
import { Loader2, Eye, EyeOff, Copy, RefreshCw, KeyRound } from "lucide-react";

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

interface EditUserDialogProps {
    user: UserProfile | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

// Generate a random temporary password
function generateTempPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + "A1a";
}

export function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form fields
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<Role>("farmer");
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [resetPassword, setResetPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
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

    // Populate form when user changes
    useEffect(() => {
        if (user) {
            setFullName(user.full_name);
            setPhone(user.phone || "");
            setRole(user.role);
            setMustChangePassword(user.must_change_password || false);
            setResetPassword(false);
            setNewPassword("");
            setLocationData({
                provinceCode: user.province_code || "",
                provinceName: user.province_name || "",
                regencyCode: user.regency_code || "",
                regencyName: user.regency_name || "",
                districtCode: user.district_code || "",
                districtName: user.district_name || "",
                villageCode: user.village_code || "",
                villageName: user.village_name || "",
            });
        }
    }, [user]);

    const handleLocationChange = useCallback((location: LocationData) => {
        setLocationData(location);
    }, []);

    const regeneratePassword = () => {
        setNewPassword(generateTempPassword());
    };

    const copyPassword = async () => {
        try {
            await navigator.clipboard.writeText(newPassword);
            toast({
                title: "Password disalin",
                description: "Password baru telah disalin ke clipboard",
            });
        } catch {
            toast({
                title: "Gagal menyalin",
                description: "Silakan salin password secara manual",
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        if (!fullName.trim()) {
            toast({
                title: "Data tidak lengkap",
                description: "Nama lengkap wajib diisi",
                variant: "destructive",
            });
            return;
        }

        if (resetPassword && newPassword.length < 6) {
            toast({
                title: "Password terlalu pendek",
                description: "Password minimal 6 karakter",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            // Build update payload
            const payload: Record<string, unknown> = {
                user_id: user.id,
                full_name: fullName,
                phone: phone || null,
                role: role,
                must_change_password: resetPassword ? true : mustChangePassword,
                province_code: locationData.provinceCode || null,
                province_name: locationData.provinceName || null,
                regency_code: locationData.regencyCode || null,
                regency_name: locationData.regencyName || null,
                district_code: locationData.districtCode || null,
                district_name: locationData.districtName || null,
                village_code: locationData.villageCode || null,
                village_name: locationData.villageName || null,
            };

            // Add password reset if enabled
            if (resetPassword && newPassword) {
                payload.new_password = newPassword;
            }

            // Use supabase.functions.invoke() for proper JWT handling
            // This automatically sends the correct auth headers
            const { data, error } = await supabase.functions.invoke("update-user", {
                body: payload,
            });

            if (error) {
                throw new Error(error.message || "Gagal memperbarui pengguna");
            }

            // Show success with password if reset
            if (resetPassword && newPassword) {
                toast({
                    title: "Pengguna berhasil diperbarui!",
                    description: (
                        <div className="mt-2 space-y-2">
                            <p>
                                Password baru: <strong>{newPassword}</strong>
                            </p>
                            <p className="text-sm text-muted-foreground">Berikan password ini kepada pengguna.</p>
                        </div>
                    ),
                    duration: 10000,
                });
            } else {
                toast({
                    title: "Pengguna berhasil diperbarui!",
                    description: data.message,
                });
            }

            onOpenChange(false);
            onSuccess();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
            toast({
                title: "Gagal memperbarui pengguna",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Edit Pengguna</DialogTitle>
                    <DialogDescription>Perbarui data pengguna {user.full_name}</DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-fullName">
                                Nama Lengkap <span className="text-destructive">*</span>
                            </Label>
                            <Input id="edit-fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">No HP</Label>
                            <Input id="edit-phone" type="tel" placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                                <SelectTrigger id="edit-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="farmer">Petani</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="observer">Observer</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Password Reset Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="reset-password" className="flex items-center gap-2">
                                        <KeyRound className="h-4 w-4" />
                                        Reset Password
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Buat password sementara baru</p>
                                </div>
                                <Switch
                                    id="reset-password"
                                    checked={resetPassword}
                                    onCheckedChange={(checked) => {
                                        setResetPassword(checked);
                                        if (checked && !newPassword) {
                                            setNewPassword(generateTempPassword());
                                        }
                                    }}
                                />
                            </div>

                            {resetPassword && (
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">Password Baru</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input id="new-password" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" />
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
                                </div>
                            )}

                            {!resetPassword && (
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="must-change">Wajib Ubah Password</Label>
                                        <p className="text-xs text-muted-foreground">User harus ganti password saat login</p>
                                    </div>
                                    <Switch id="must-change" checked={mustChangePassword} onCheckedChange={setMustChangePassword} />
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Location */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Lokasi</p>
                            <LocationSelect onLocationChange={handleLocationChange} defaultToTernate={false} />
                        </div>
                    </form>
                </ScrollArea>

                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Batal
                    </Button>
                    <Button type="submit" onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
