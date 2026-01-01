import React, { useEffect, useState, useCallback, useRef } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AuthContextType, UserProfile } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "./auth-context";

// Timeout for auth initialization (5 seconds)
const AUTH_TIMEOUT = 5000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const initializingRef = useRef(false);

    // Fetch user profile from database with timeout
    const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
        try {
            const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single();

            // PGRST116 = no rows found, which is fine for new users
            if (error && error.code !== "PGRST116") {
                console.error("Error fetching profile:", error);
                return null;
            }

            return data as UserProfile | null;
        } catch (error) {
            console.error("Error fetching profile:", error);
            return null;
        }
    }, []);

    // Initialize auth state
    useEffect(() => {
        // Prevent double initialization in StrictMode
        if (initializingRef.current) return;
        initializingRef.current = true;

        let isMounted = true;
        let timeoutId: ReturnType<typeof setTimeout>;

        const initializeAuth = async () => {
            try {
                // Set a timeout to prevent infinite loading
                timeoutId = setTimeout(() => {
                    if (isMounted) {
                        console.warn("Auth initialization timed out, proceeding without session");
                        setLoading(false);
                    }
                }, AUTH_TIMEOUT);

                const {
                    data: { session: currentSession },
                    error,
                } = await supabase.auth.getSession();

                if (error) {
                    console.error("Error getting session:", error);
                    if (isMounted) setLoading(false);
                    return;
                }

                if (isMounted) {
                    setSession(currentSession);
                    setUser(currentSession?.user ?? null);

                    if (currentSession?.user) {
                        // Fetch profile but don't block loading on it
                        fetchProfile(currentSession.user.id).then((userProfile) => {
                            if (isMounted) setProfile(userProfile);
                        });
                    }

                    setLoading(false);
                }
            } catch (error) {
                console.error("Error initializing auth:", error);
                if (isMounted) setLoading(false);
            } finally {
                clearTimeout(timeoutId);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!isMounted) return;

            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (event === "SIGNED_OUT") {
                setProfile(null);
                return;
            }

            if (newSession?.user) {
                // Fetch profile in background, don't block UI
                fetchProfile(newSession.user.id).then((userProfile) => {
                    if (isMounted) setProfile(userProfile);
                });
            } else {
                setProfile(null);
            }
        });

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            toast({
                title: "Selamat datang kembali!",
                description: "Login berhasil.",
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat login";
            toast({
                title: "Login Gagal",
                description: errorMessage,
                variant: "destructive",
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (data: import("@/types/auth").SignUpData) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        // All these fields are read by the database trigger handle_new_user()
                        full_name: data.fullName,
                        phone: data.phone || null,
                        province_code: data.provinceCode || null,
                        province_name: data.provinceName || null,
                        regency_code: data.regencyCode || null,
                        regency_name: data.regencyName || null,
                        district_code: data.districtCode || null,
                        district_name: data.districtName || null,
                        village_code: data.villageCode || null,
                        village_name: data.villageName || null,
                    },
                },
            });

            if (error) {
                throw error;
            }

            // Profile is created automatically via database trigger
            // which reads all fields from raw_user_meta_data

            toast({
                title: "Registrasi Berhasil!",
                description: "Silakan cek email Anda untuk konfirmasi.",
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat registrasi";
            toast({
                title: "Registrasi Gagal",
                description: errorMessage,
                variant: "destructive",
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                throw error;
            }

            toast({
                title: "Logout Berhasil",
                description: "Sampai jumpa lagi!",
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat logout";
            toast({
                title: "Logout Gagal",
                description: errorMessage,
                variant: "destructive",
            });
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                throw error;
            }

            toast({
                title: "Email Terkirim",
                description: "Silakan cek email Anda untuk reset password.",
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
            toast({
                title: "Reset Password Gagal",
                description: errorMessage,
                variant: "destructive",
            });
            throw error;
        }
    };

    const value: AuthContextType = {
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
