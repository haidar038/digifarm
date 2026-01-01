import { useRole } from "@/hooks/useRole";
import { Role } from "@/types/auth";

interface RoleGuardProps {
    children: React.ReactNode;
    /**
     * Roles that are allowed to see this content
     * Can be a single role or array of roles
     */
    allowedRoles: Role | Role[];
    /**
     * Optional fallback content when user doesn't have permission
     * Defaults to null (render nothing)
     */
    fallback?: React.ReactNode;
}

/**
 * Component for conditional rendering based on user role
 * Use this to show/hide UI elements based on permissions
 *
 * @example
 * // Only show for admins
 * <RoleGuard allowedRoles="admin">
 *   <AdminPanel />
 * </RoleGuard>
 *
 * @example
 * // Show for managers and admins with custom fallback
 * <RoleGuard allowedRoles={["manager", "admin"]} fallback={<AccessDenied />}>
 *   <ManagementDashboard />
 * </RoleGuard>
 */
export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
    const { role } = useRole();

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Component that only renders for admin users
 */
export function AdminOnly({ children, fallback = null }: Omit<RoleGuardProps, "allowedRoles">) {
    return (
        <RoleGuard allowedRoles="admin" fallback={fallback}>
            {children}
        </RoleGuard>
    );
}

/**
 * Component that renders for managers and admins
 */
export function ManagerOrAdminOnly({ children, fallback = null }: Omit<RoleGuardProps, "allowedRoles">) {
    return (
        <RoleGuard allowedRoles={["manager", "admin"]} fallback={fallback}>
            {children}
        </RoleGuard>
    );
}
