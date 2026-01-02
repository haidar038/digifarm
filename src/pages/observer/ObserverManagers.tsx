import { useEffect, useState } from "react";
import { ObserverLayout } from "@/components/layout/ObserverLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Briefcase, Users, MapPin } from "lucide-react";

interface ManagerData {
    id: string;
    full_name: string;
    phone: string | null;
    province_name: string | null;
    regency_name: string | null;
    farmerCount: number;
    activeConnections: number;
}

export default function ObserverManagers() {
    const [managers, setManagers] = useState<ManagerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        try {
            // Fetch all managers
            const { data: managerProfiles } = await supabase.from("user_profiles").select("*").eq("role", "manager");

            if (!managerProfiles) {
                setManagers([]);
                return;
            }

            // Fetch all active connections
            const { data: connections } = await supabase.from("manager_farmer_connections").select("manager_id, status");

            // Build manager data with connection stats
            const managerData: ManagerData[] = managerProfiles.map((profile) => {
                const managerConnections = connections?.filter((c) => c.manager_id === profile.id) || [];
                const activeConnections = managerConnections.filter((c) => c.status === "active");

                return {
                    id: profile.id,
                    full_name: profile.full_name,
                    phone: profile.phone,
                    province_name: profile.province_name,
                    regency_name: profile.regency_name,
                    farmerCount: activeConnections.length,
                    activeConnections: activeConnections.length,
                };
            });

            setManagers(managerData);
        } catch (error) {
            console.error("Error fetching managers:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredManagers = managers.filter((manager) => manager.full_name.toLowerCase().includes(search.toLowerCase()) || (manager.phone && manager.phone.includes(search)));

    // Sort by active connections descending
    const sortedManagers = [...filteredManagers].sort((a, b) => b.farmerCount - a.farmerCount);

    const totalConnections = managers.reduce((sum, m) => sum + m.activeConnections, 0);

    return (
        <ObserverLayout title="Data Manager" description="Daftar manager dan jumlah petani binaan">
            <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Manager</CardDescription>
                            <CardTitle className="text-3xl">{managers.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Koneksi Aktif</CardDescription>
                            <CardTitle className="text-3xl text-blue-600">{totalConnections}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Managers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            Daftar Manager
                        </CardTitle>
                        <CardDescription>
                            {filteredManagers.length} dari {managers.length} manager
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Cari nama atau telepon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 max-w-sm" />
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Manager</TableHead>
                                            <TableHead>Lokasi</TableHead>
                                            <TableHead className="text-center">Petani Binaan</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedManagers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    Tidak ada data manager
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            sortedManagers.map((manager, index) => (
                                                <TableRow key={manager.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {index < 3 && (
                                                                <Badge variant={index === 0 ? "default" : "secondary"} className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                                                                    {index + 1}
                                                                </Badge>
                                                            )}
                                                            <div>
                                                                <p className="font-medium">{manager.full_name}</p>
                                                                {manager.phone && <p className="text-xs text-muted-foreground">{manager.phone}</p>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {manager.province_name || manager.regency_name ? (
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <MapPin className="h-3 w-3" />
                                                                {manager.regency_name || manager.province_name}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="font-medium">
                                                            <Users className="h-3 w-3 mr-1" />
                                                            {manager.farmerCount}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={manager.farmerCount > 0 ? "default" : "secondary"}>{manager.farmerCount > 0 ? "Aktif" : "Belum Ada Binaan"}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ObserverLayout>
    );
}
