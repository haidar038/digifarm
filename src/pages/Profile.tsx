import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ObserverLayout } from "@/components/layout/ObserverLayout";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { SecurityForm } from "@/components/profile/SecurityForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield } from "lucide-react";
import { useRole } from "@/hooks/useRole";

export default function Profile() {
    const { isAdmin, isObserver } = useRole();

    const content = (
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profil Saya
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Keamanan Akun
                </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
                <ProfileForm />
            </TabsContent>

            <TabsContent value="security" className="mt-6">
                <SecurityForm />
            </TabsContent>
        </Tabs>
    );

    // Admin uses AdminLayout
    if (isAdmin) {
        return (
            <AdminLayout title="Profil Pengguna" description="Kelola profil pribadi dan keamanan akun Anda">
                {content}
            </AdminLayout>
        );
    }

    // Observer uses ObserverLayout
    if (isObserver) {
        return (
            <ObserverLayout title="Profil Pengguna" description="Kelola profil pribadi dan keamanan akun Anda">
                {content}
            </ObserverLayout>
        );
    }

    // Farmer/Manager uses DashboardLayout
    return (
        <DashboardLayout title="Profil Pengguna">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pengaturan Akun</h1>
                    <p className="text-muted-foreground">Kelola profil pribadi dan keamanan akun Anda.</p>
                </div>
                {content}
            </div>
        </DashboardLayout>
    );
}
