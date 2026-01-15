import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { UserTable } from "@/components/admin/UserTable";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { EditUserDialog } from "@/components/admin/EditUserDialog";
import { DeleteUserDialog } from "@/components/admin/DeleteUserDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Role } from "@/types/auth";
import { Search, Users, Loader2, ChevronLeft, ChevronRight, Sprout, Briefcase, Eye, Shield, GraduationCap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { FarmerStatus } from "@/types/database";

const ITEMS_PER_PAGE = 8;

// Tab configuration
const ROLE_TABS: { value: Role | "all"; label: string; icon: React.ElementType; color: string }[] = [
    { value: "all", label: "Semua", icon: Users, color: "text-foreground" },
    { value: "farmer", label: "Petani", icon: Sprout, color: "text-green-600" },
    { value: "manager", label: "Manager", icon: Briefcase, color: "text-blue-600" },
    { value: "observer", label: "Observer", icon: Eye, color: "text-purple-600" },
    { value: "expert", label: "Expert", icon: GraduationCap, color: "text-amber-600" },
    { value: "admin", label: "Admin", icon: Shield, color: "text-red-600" },
];

export default function AdminUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<Role | "all">("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Dialog states
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    // Reset page when tab or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, search]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from("user_profiles").select("*, farmer_profile:farmer_profiles(id, farmer_code, status)").order("created_at", { ascending: false });

            if (error) throw error;
            setUsers(data as UserProfile[]);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
            toast({
                title: "Gagal memuat pengguna",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: Role) => {
        try {
            const { error } = await supabase.from("user_profiles").update({ role: newRole }).eq("id", userId);

            if (error) throw error;

            // Update local state
            setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));

            toast({
                title: "Role berhasil diubah",
                description: `Role pengguna telah diubah menjadi ${newRole}`,
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
            toast({
                title: "Gagal mengubah role",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const handleFarmerStatusChange = async (farmerProfileId: string, newStatus: FarmerStatus) => {
        try {
            const { error } = await supabase.from("farmer_profiles").update({ status: newStatus }).eq("id", farmerProfileId);

            if (error) throw error;

            // Update local state
            setUsers((prev) => prev.map((user) => (user.farmer_profile?.id === farmerProfileId ? { ...user, farmer_profile: { ...user.farmer_profile, status: newStatus } } : user)));

            toast({
                title: "Status petani berhasil diubah",
                description: `Status petani telah diubah menjadi ${newStatus}`,
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
            toast({
                title: "Gagal mengubah status petani",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const handleEdit = (user: UserProfile) => {
        setSelectedUser(user);
        setEditDialogOpen(true);
    };

    const handleDelete = (user: UserProfile) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleResetPassword = (user: UserProfile) => {
        setSelectedUser(user);
        setEditDialogOpen(true);
    };

    // Filter users based on search and active tab
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch =
                user.full_name.toLowerCase().includes(search.toLowerCase()) ||
                (user.phone && user.phone.includes(search)) ||
                (user.farmer_profile?.farmer_code && user.farmer_profile.farmer_code.toLowerCase().includes(search.toLowerCase()));
            const matchesRole = activeTab === "all" || user.role === activeTab;
            return matchesSearch && matchesRole;
        });
    }, [users, search, activeTab]);

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    // Stats per role
    const stats = useMemo(
        () => ({
            all: users.length,
            farmer: users.filter((u) => u.role === "farmer").length,
            manager: users.filter((u) => u.role === "manager").length,
            observer: users.filter((u) => u.role === "observer").length,
            expert: users.filter((u) => u.role === "expert").length,
            admin: users.filter((u) => u.role === "admin").length,
        }),
        [users]
    );

    return (
        <AdminLayout title="Manajemen Pengguna" description="Kelola pengguna dan atur role akses sistem">
            <div className="space-y-6">
                {/* Main Card with Tabs */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Daftar Pengguna
                            </CardTitle>
                            <CardDescription>
                                {filteredUsers.length} pengguna {activeTab !== "all" && `dengan role ${activeTab}`}
                            </CardDescription>
                        </div>
                        <CreateUserDialog onSuccess={fetchUsers} />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Role | "all")}>
                            <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
                                {ROLE_TABS.map((tab) => {
                                    const Icon = tab.icon;
                                    const count = stats[tab.value];
                                    return (
                                        <TabsTrigger key={tab.value} value={tab.value} className="flex-1 min-w-[100px] gap-2 data-[state=active]:bg-background">
                                            <Icon className={`h-4 w-4 ${tab.color}`} />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full bg-muted ${tab.color}`}>{count}</span>
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>

                            {/* Search - shared across all tabs */}
                            <div className="relative mt-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder={activeTab === "farmer" ? "Cari nama, telepon, atau kode petani..." : "Cari nama atau nomor telepon..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                            </div>

                            {/* Tab Contents - all share the same table structure */}
                            {ROLE_TABS.map((tab) => (
                                <TabsContent key={tab.value} value={tab.value} className="mt-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : paginatedUsers.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">{search ? "Tidak ada pengguna yang cocok dengan pencarian." : "Tidak ada pengguna."}</div>
                                    ) : (
                                        <UserTable
                                            users={paginatedUsers}
                                            onRoleChange={handleRoleChange}
                                            onFarmerStatusChange={handleFarmerStatusChange}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onResetPassword={handleResetPassword}
                                            showFarmerColumns={activeTab === "farmer" || activeTab === "all"}
                                        />
                                    )}
                                </TabsContent>
                            ))}
                        </Tabs>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} dari {filteredUsers.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Sebelumnya
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className="w-8 h-8 p-0" onClick={() => setCurrentPage(page)}>
                                                {page}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                        Selanjutnya
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit User Dialog */}
            <EditUserDialog user={selectedUser} open={editDialogOpen} onOpenChange={setEditDialogOpen} onSuccess={fetchUsers} />

            {/* Delete User Dialog */}
            <DeleteUserDialog user={selectedUser} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onSuccess={fetchUsers} />
        </AdminLayout>
    );
}
