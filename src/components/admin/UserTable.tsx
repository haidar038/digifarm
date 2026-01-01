import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile, Role } from "@/types/auth";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { MapPin, Phone, Calendar } from "lucide-react";

interface UserTableProps {
    users: UserProfile[];
    onRoleChange: (userId: string, newRole: Role) => void;
}

// Helper to get role badge variant
function getRoleBadgeVariant(role: Role): "default" | "secondary" | "destructive" | "outline" {
    switch (role) {
        case "admin":
            return "destructive";
        case "manager":
            return "default";
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
        case "farmer":
        default:
            return "Petani";
    }
}

export function UserTable({ users, onRoleChange }: UserTableProps) {
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
                        <TableHead>Kontak</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Bergabung</TableHead>
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
                                </TableCell>
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
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(user.created_at), "d MMM yyyy", {
                                            locale: localeId,
                                        })}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
