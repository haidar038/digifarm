import { useAuth } from "@/contexts/auth-context";
import { Role, Permission, ROLE_PERMISSIONS, hasPermission } from "@/types/auth";

/**
 * Custom hook for role-based access control
 * Provides role information and permission checking utilities
 */
export function useRole() {
    const { profile, user } = useAuth();

    // Default to 'farmer' if no profile loaded yet
    const role: Role = profile?.role ?? "farmer";

    // Role checks
    const isAdmin = role === "admin";
    const isManager = role === "manager";
    const isObserver = role === "observer";
    const isFarmer = role === "farmer";
    const isManagerOrAdmin = isManager || isAdmin;

    // Permission checks
    const canRead = (scope: "own" | "all"): boolean => {
        if (scope === "own") return hasPermission(role, "read:own");
        return hasPermission(role, "read:all");
    };

    const canWrite = (scope: "own" | "all"): boolean => {
        if (scope === "own") return hasPermission(role, "write:own");
        return hasPermission(role, "write:all");
    };

    const canManageUsers = hasPermission(role, "manage:users");
    const canManageSystem = hasPermission(role, "manage:system");
    const canViewAllData = hasPermission(role, "read:all");
    const canExport = hasPermission(role, "export:all");

    // Check if user can access specific resource
    const canAccessResource = (resourceUserId: string | null): boolean => {
        // Admin can access everything
        if (isAdmin) return true;

        // Observer can view all (read-only)
        if (isObserver) return true;

        // Manager can view all, but only modify own
        if (isManager) return true;

        // Farmer can only access own resources
        return resourceUserId === user?.id || resourceUserId === null;
    };

    // Check if user can modify specific resource
    const canModifyResource = (resourceUserId: string | null): boolean => {
        // Admin can modify everything
        if (isAdmin) return true;

        // Observer cannot modify anything
        if (isObserver) return false;

        // Others can only modify their own
        return resourceUserId === user?.id;
    };

    return {
        // Role info
        role,
        isAdmin,
        isManager,
        isObserver,
        isFarmer,
        isManagerOrAdmin,

        // Permission checks
        permissions: ROLE_PERMISSIONS[role],
        hasPermission: (permission: Permission) => hasPermission(role, permission),
        canRead,
        canWrite,
        canManageUsers,
        canManageSystem,
        canViewAllData,
        canExport,

        // Resource access
        canAccessResource,
        canModifyResource,

        // User info
        userId: user?.id ?? null,
    };
}

export type UseRoleReturn = ReturnType<typeof useRole>;
