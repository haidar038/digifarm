import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { AuditLogDetail } from "@/components/admin/AuditLogDetail";
import { supabase } from "@/integrations/supabase/client";
import { AuditLog } from "@/types/database";
import { UserProfile } from "@/types/auth";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export default function AdminAuditLog() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Fetch audit logs
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch users first for enrichment and filter dropdown
            const { data: usersData, error: usersError } = await supabase.from("user_profiles").select("*").order("full_name");

            if (usersError) throw usersError;
            setUsers((usersData as UserProfile[]) || []);

            // Create a map of user_id -> full_name for quick lookup
            const userMap = new Map<string, string>();
            usersData?.forEach((user) => {
                userMap.set(user.id, user.full_name);
            });

            // Fetch audit logs (without foreign key join to avoid PGRST200 error)
            const { data: logsData, error: logsError } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);

            if (logsError) {
                // Check if table doesn't exist yet
                if (logsError.code === "42P01") {
                    setError("Tabel audit_logs belum dibuat. Silakan jalankan migration SQL terlebih dahulu.");
                } else {
                    throw logsError;
                }
            } else {
                // Enrich logs with user full_name from the map
                const enrichedLogs = (logsData || []).map((log) => ({
                    ...log,
                    user: log.user_id ? { full_name: userMap.get(log.user_id) || "Unknown User" } : undefined,
                }));
                setLogs(enrichedLogs as unknown as AuditLog[]);
            }
        } catch (err) {
            console.error("Error fetching audit logs:", err);
            setError("Gagal memuat data audit log");
            toast({
                title: "Error",
                description: "Gagal memuat data audit log",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Real-time subscription for audit_logs - show new logs live
    useRealtimeSubscription({
        table: "audit_logs",
        onInsert: () => {
            // Refresh data when new audit log is inserted
            fetchData();
        },
    });

    const handleViewDetail = (log: AuditLog) => {
        setSelectedLog(log);
        setDetailOpen(true);
    };

    return (
        <AdminLayout title="Audit Log">
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                        <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Audit Log</h1>
                        <p className="text-muted-foreground">Riwayat perubahan data sistem</p>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Loading state */}
                {isLoading && !error && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* Audit Log Table */}
                {!isLoading && !error && <AuditLogTable logs={logs} users={users} isLoading={isLoading} onViewDetail={handleViewDetail} />}

                {/* Detail Dialog */}
                <AuditLogDetail log={selectedLog} open={detailOpen} onOpenChange={setDetailOpen} />
            </div>
        </AdminLayout>
    );
}
