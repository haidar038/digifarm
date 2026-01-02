import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { UserTable } from "@/components/admin/UserTable";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { EditUserDialog } from "@/components/admin/EditUserDialog";
import { DeleteUserDialog } from "@/components/admin/DeleteUserDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Role } from "@/types/auth";
import { Search, Users, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<Role | "all">("all");

    // Dialog states
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false });

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

    const handleEdit = (user: UserProfile) => {
        setSelectedUser(user);
        setEditDialogOpen(true);
    };

    const handleDelete = (user: UserProfile) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleResetPassword = (user: UserProfile) => {
        // Open edit dialog with reset password pre-enabled
        setSelectedUser(user);
        setEditDialogOpen(true);
    };

    // Filter users based on search and role
    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.full_name.toLowerCase().includes(search.toLowerCase()) || (user.phone && user.phone.includes(search));
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Stats
    const stats = {
        total: users.length,
        farmers: users.filter((u) => u.role === "farmer").length,
        managers: users.filter((u) => u.role === "manager").length,
        observers: users.filter((u) => u.role === "observer").length,
        admins: users.filter((u) => u.role === "admin").length,
    };

    return (
        <AdminLayout title="Manajemen Pengguna" description="Kelola pengguna dan atur role akses sistem">
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Pengguna</CardDescription>
                            <CardTitle className="text-3xl">{stats.total}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Petani</CardDescription>
                            <CardTitle className="text-3xl text-green-600">{stats.farmers}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Manager</CardDescription>
                            <CardTitle className="text-3xl text-blue-600">{stats.managers}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Observer</CardDescription>
                            <CardTitle className="text-3xl text-purple-600">{stats.observers}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Admin</CardDescription>
                            <CardTitle className="text-3xl text-red-600">{stats.admins}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Daftar Pengguna
                            </CardTitle>
                            <CardDescription>
                                {filteredUsers.length} dari {users.length} pengguna
                            </CardDescription>
                        </div>
                        <CreateUserDialog onSuccess={fetchUsers} />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Cari nama atau nomor telepon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                            </div>
                            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as Role | "all")}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Role</SelectItem>
                                    <SelectItem value="farmer">Petani</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="observer">Observer</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <UserTable users={filteredUsers} onRoleChange={handleRoleChange} onEdit={handleEdit} onDelete={handleDelete} onResetPassword={handleResetPassword} />
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
