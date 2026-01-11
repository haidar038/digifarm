import { Link } from "react-router-dom";
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThreadList } from "@/components/forum";
import { useUserThreads } from "@/hooks/useForum";
import { ArrowLeft, Plus, FileText } from "lucide-react";

export default function UserThreads() {
    const { data: threads, isLoading } = useUserThreads();

    return (
        <RoleBasedLayout title="Diskusi Saya">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/forum">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <FileText className="w-6 h-6 text-primary" />
                                Diskusi Saya
                            </h1>
                            <p className="text-muted-foreground mt-1">Kelola diskusi yang Anda buat</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link to="/forum/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Buat Diskusi
                        </Link>
                    </Button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="py-1.5 px-3">
                        Total: {threads?.length || 0} diskusi
                    </Badge>
                    <Badge variant="secondary" className="py-1.5 px-3 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Terjawab: {threads?.filter((t) => t.is_solved).length || 0}
                    </Badge>
                    <Badge variant="secondary" className="py-1.5 px-3 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        Belum Terjawab: {threads?.filter((t) => !t.is_solved).length || 0}
                    </Badge>
                </div>

                {/* Thread List */}
                <ThreadList threads={threads || []} isLoading={isLoading} emptyMessage="Anda belum membuat diskusi apapun" />
            </div>
        </RoleBasedLayout>
    );
}
