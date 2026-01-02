import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useRole } from "@/hooks/useRole";
import { Role, Permission } from "@/types/auth";
import { Loader2, ShieldX } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    /**
     * Optional role requirement - can be a single role or array of roles
     * If not specified, only authentication is required
     */
    requiredRole?: Role | Role[];
    /**
     * Optional permission requirement
     * If not specified, only authentication (and role if specified) is required
     */
    requiredPermission?: Permission;
    /**
     * Where to redirect if access is denied
     * Defaults to "/" (home) for role/permission denied
     */
    redirectTo?: string;
}

export function ProtectedRoute({ children, requiredRole, requiredPermission, redirectTo = "/" }: ProtectedRouteProps) {
    const { user, loading, profile } = useAuth();
    const { role, hasPermission } = useRole();
    const location = useLocation();

    // Show loading spinner while auth is being checked
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user must change password (don't redirect if already on change-password page)
    if (profile?.must_change_password && location.pathname !== "/change-password") {
        return <Navigate to="/change-password" replace />;
    }

    // Wait for profile to load before checking roles
    if (requiredRole && !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Check role requirement
    if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!allowedRoles.includes(role)) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                    <ShieldX className="h-16 w-16 text-destructive" />
                    <h1 className="text-2xl font-bold">Akses Ditolak</h1>
                    <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
                    <Navigate to={redirectTo} replace />
                </div>
            );
        }
    }

    // Check permission requirement
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <ShieldX className="h-16 w-16 text-destructive" />
                <h1 className="text-2xl font-bold">Akses Ditolak</h1>
                <p className="text-muted-foreground">Anda tidak memiliki izin untuk melakukan tindakan ini.</p>
                <Navigate to={redirectTo} replace />
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * Route that requires admin role
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
}

/**
 * Route that requires manager or admin role
 */
export function ManagerRoute({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute requiredRole={["manager", "admin"]}>{children}</ProtectedRoute>;
}

/**
 * Route that requires observer role (view-only access)
 */
export function ObserverRoute({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute requiredRole="observer">{children}</ProtectedRoute>;
}
