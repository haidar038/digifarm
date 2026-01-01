import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LocationSelect } from "@/components/auth/LocationSelect";
import { useAuth } from "@/contexts/auth-context";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Calendar, Shield } from "lucide-react";
import { Role } from "@/types/auth";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Schema validation
const profileSchema = z.object({
    fullName: z.string().min(2, "Nama minimal 2 karakter"),
    phone: z.string().optional(),
    provinceCode: z.string().optional(),
    provinceName: z.string().optional(),
    regencyCode: z.string().optional(),
    regencyName: z.string().optional(),
    districtCode: z.string().optional(),
    districtName: z.string().optional(),
    villageCode: z.string().optional(),
    villageName: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

// Helper to get role badge info
function getRoleBadgeInfo(role: Role): { variant: "default" | "secondary" | "destructive"; label: string } {
    switch (role) {
        case "admin":
            return { variant: "destructive", label: "Administrator" };
        case "manager":
            return { variant: "default", label: "Manager" };
        case "farmer":
        default:
            return { variant: "secondary", label: "Petani" };
    }
}

export function ProfileForm() {
    const { user, profile } = useAuth();
    const { role } = useRole();
    const [loading, setLoading] = useState(false);

    // Initialize form
    const form = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: "",
            phone: "",
            provinceCode: "",
            provinceName: "",
            regencyCode: "",
            regencyName: "",
            districtCode: "",
            districtName: "",
            villageCode: "",
            villageName: "",
        },
    });

    // Load initial data
    useEffect(() => {
        if (profile) {
            form.reset({
                fullName: profile.full_name,
                phone: profile.phone || "",
                provinceCode: profile.province_code || "",
                provinceName: profile.province_name || "",
                regencyCode: profile.regency_code || "",
                regencyName: profile.regency_name || "",
                districtCode: profile.district_code || "",
                districtName: profile.district_name || "",
                villageCode: profile.village_code || "",
                villageName: profile.village_name || "",
            });
        }
    }, [profile, form]);

    const handleLocationChange = (location: any) => {
        form.setValue("provinceCode", location.provinceCode);
        form.setValue("provinceName", location.provinceName);
        form.setValue("regencyCode", location.regencyCode);
        form.setValue("regencyName", location.regencyName);
        form.setValue("districtCode", location.districtCode);
        form.setValue("districtName", location.districtName);
        form.setValue("villageCode", location.villageCode);
        form.setValue("villageName", location.villageName);
    };

    const onSubmit = async (data: ProfileValues) => {
        if (!user) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from("user_profiles")
                .update({
                    full_name: data.fullName,
                    phone: data.phone,
                    province_code: data.provinceCode,
                    province_name: data.provinceName,
                    regency_code: data.regencyCode,
                    regency_name: data.regencyName,
                    district_code: data.districtCode,
                    district_name: data.districtName,
                    village_code: data.villageCode,
                    village_name: data.villageName,
                })
                .eq("id", user.id);

            if (error) throw error;

            // Also update auth metadata if needed, but profile table is primary
            await supabase.auth.updateUser({
                data: { full_name: data.fullName },
            });

            toast({
                title: "Profil diperbarui",
                description: "Informasi profil Anda berhasil disimpan.",
            });
        } catch (error: any) {
            toast({
                title: "Gagal memperbarui profil",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const roleBadge = getRoleBadgeInfo(role);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profil Saya</CardTitle>
                <CardDescription>Kelola informasi pribadi dan lokasi lahan Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Account Info Section */}
                <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Role:</span>
                        <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                    </div>
                    <Separator orientation="vertical" className="h-4 hidden sm:block" />
                    {user?.email && (
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                    )}
                    <Separator orientation="vertical" className="h-4 hidden sm:block" />
                    {profile?.created_at && (
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Bergabung {format(new Date(profile.created_at), "d MMMM yyyy", { locale: localeId })}</span>
                        </div>
                    )}
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama Lengkap</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nama Anda" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nomor Telepon / WA</FormLabel>
                                        <FormControl>
                                            <Input placeholder="08..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <FormLabel>Lokasi (Provinsi, Kabupaten, Kecamatan, Desa)</FormLabel>
                                <div className="p-4 bg-muted/30 rounded-lg border">
                                    <LocationSelect onLocationChange={handleLocationChange} />

                                    {/* Display current location if selected/loaded */}
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        <span className="font-medium">Lokasi tersimpan: </span>
                                        {profile?.province_name ? (
                                            <>
                                                {profile.province_name}
                                                {profile.regency_name && `, ${profile.regency_name}`}
                                                {profile.district_name && `, ${profile.district_name}`}
                                                {profile.village_name && `, ${profile.village_name}`}
                                            </>
                                        ) : (
                                            "Belum diatur"
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Perubahan
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
