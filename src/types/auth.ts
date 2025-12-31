import type { User, Session } from "@supabase/supabase-js";

export interface UserProfile {
    id: string;
    full_name: string;
    phone?: string;
    role: "farmer" | "admin";
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

export interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
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
}
