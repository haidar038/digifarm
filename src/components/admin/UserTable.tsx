import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserProfile, Role } from "@/types/auth";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { MapPin, Phone, Calendar, MoreHorizontal, Pencil, Trash2, KeyRound, IdCard } from "lucide-react";
import type { FarmerStatus } from "@/types/database";

interface UserTableProps {
    users: UserProfile[];
    onRoleChange: (userId: string, newRole: Role) => void;
    onFarmerStatusChange: (farmerId: string, newStatus: "active" | "inactive" | "pending" | "suspended") => void;
    onEdit: (user: UserProfile) => void;
    onDelete: (user: UserProfile) => void;
    onResetPassword: (user: UserProfile) => void;
    showFarmerColumns?: boolean;
}

// Helper to get role badge variant
function getRoleBadgeVariant(role: Role): "default" | "secondary" | "destructive" | "outline" {
    switch (role) {
        case "admin":
            return "destructive";
        case "manager":
            return "default";
        case "observer":
            return "outline";
        case "farmer":
        default:
            return "secondary";
    }
}

// Helper to get role label in Indonesian
function getRoleLabel(role: Role): string {
    switch (role) {
        case "admin":
            return "Admin";
        case "manager":
            return "Manager";
        case "observer":
            return "Observer";
        case "expert":
            return "Expert";
        case "farmer":
        default:
            return "Petani";
    }
}

// Helper to get farmer status badge variant
function getFarmerStatusBadgeVariant(status: FarmerStatus): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "active":
            return "default";
        case "inactive":
            return "secondary";
        case "pending":
            return "outline";
        case "suspended":
            return "destructive";
        default:
            return "secondary";
    }
}

// Helper to get farmer status label in Indonesian
function getFarmerStatusLabel(status: FarmerStatus): string {
    switch (status) {
        case "active":
            return "Aktif";
        case "inactive":
            return "Nonaktif";
        case "pending":
            return "Pending";
        case "suspended":
            return "Ditangguhkan";
        default:
            return status;
    }
}

export function UserTable({ users, onRoleChange, onFarmerStatusChange, onEdit, onDelete, onResetPassword, showFarmerColumns = true }: UserTableProps) {
    const { user: currentUser } = useAuth();

    if (users.length === 0) {
        return <div className="text-center py-12 text-muted-foreground">Tidak ada pengguna yang ditemukan.</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama</TableHead>
                        {showFarmerColumns && <TableHead>Kode Petani</TableHead>}
                        <TableHead>Kontak</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Role</TableHead>
                        {showFarmerColumns && <TableHead>Status Petani</TableHead>}
                        <TableHead>Bergabung</TableHead>
                        <TableHead className="w-[80px]">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => {
                        const isCurrentUser = user.id === currentUser?.id;
                        const location = [user.village_name, user.district_name, user.regency_name].filter(Boolean).join(", ");

                        return (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="font-medium">{user.full_name}</div>
                                    {isCurrentUser && (
                                        <Badge variant="outline" className="text-xs mt-1">
                                            Anda
                                        </Badge>
                                    )}
                                    {user.must_change_password && (
                                        <Badge variant="secondary" className="text-xs mt-1 ml-1">
                                            Harus Ganti Password
                                        </Badge>
                                    )}
                                </TableCell>
                                {showFarmerColumns && (
                                    <TableCell>
                                        {user.role === "farmer" && user.farmer_profile ? (
                                            <div className="flex items-center gap-1 text-sm font-mono">
                                                <IdCard className="h-3 w-3 text-muted-foreground" />
                                                {user.farmer_profile.farmer_code}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                )}
                                <TableCell>
                                    {user.phone ? (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Phone className="h-3 w-3" />
                                            {user.phone}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {location ? (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground max-w-[200px] truncate">
                                            <MapPin className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{location}</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {isCurrentUser ? (
                                        // Current user cannot change their own role
                                        <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
                                    ) : (
                                        <Select value={user.role} onValueChange={(value) => onRoleChange(user.id, value as Role)}>
                                            <SelectTrigger className="w-[120px] h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="farmer">Petani</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="observer">Observer</SelectItem>
                                                <SelectItem value="expert">Expert</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </TableCell>
                                {showFarmerColumns && (
                                    <TableCell>
                                        {user.role === "farmer" && user.farmer_profile ? (
                                            <Select value={user.farmer_profile.status} onValueChange={(value) => onFarmerStatusChange(user.farmer_profile!.id, value as FarmerStatus)}>
                                                <SelectTrigger className="w-[130px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Aktif</SelectItem>
                                                    <SelectItem value="inactive">Nonaktif</SelectItem>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="suspended">Ditangguhkan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                )}
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(user.created_at), "d MMM yyyy", {
                                            locale: localeId,
                                        })}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isCurrentUser}>
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Menu aksi</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(user)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit Profil
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onResetPassword(user)}>
                                                <KeyRound className="mr-2 h-4 w-4" />
                                                Reset Password
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onDelete(user)} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
