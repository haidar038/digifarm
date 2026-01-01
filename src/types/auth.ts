import type { User, Session } from "@supabase/supabase-js";

// Role definitions for RBAC
export type Role = "farmer" | "manager" | "observer" | "admin";

// Permission types for granular access control
export type Permission = "read:own" | "write:own" | "read:all" | "write:all" | "export:all" | "manage:users" | "manage:system";

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    farmer: ["read:own", "write:own"],
    manager: ["read:own", "write:own", "read:all"],
    observer: ["read:all", "export:all"],
    admin: ["read:own", "write:own", "read:all", "write:all", "export:all", "manage:users", "manage:system"],
};

// Helper to check if a role has a specific permission
export function hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
}

export interface UserProfile {
    id: string;
    full_name: string;
    phone?: string;
    role: Role;
    province_code?: string;
    province_name?: string;
    regency_code?: string;
    regency_name?: string;
    district_code?: string;
    district_name?: string;
    village_code?: string;
    village_name?: string;
    created_at: string;
    updated_at: string;
}

// Data required for user registration
export interface SignUpData {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    provinceCode?: string;
    provinceName?: string;
    regencyCode?: string;
    regencyName?: string;
    districtCode?: string;
    districtName?: string;
    villageCode?: string;
    villageName?: string;
}

export interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (data: SignUpData) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

export interface LocationData {
    code: string;
    name: string;
}

export interface LocationResponse {
    data: LocationData[];
    meta: {
        administrative_area_level: number;
        updated_at: string;
    };
}

export interface RegisterFormData {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    phone?: string;
    provinceCode?: string;
    provinceName?: string;
    regencyCode?: string;
    regencyName?: string;
    districtCode?: string;
    districtName?: string;
    villageCode?: string;
    villageName?: string;
}
