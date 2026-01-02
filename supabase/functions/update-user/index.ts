// Edge function to update user profile and/or reset password (admin only)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface UpdateUserRequest {
    user_id: string;
    // Profile updates (optional)
    full_name?: string;
    phone?: string;
    role?: "farmer" | "manager" | "observer" | "admin";
    province_code?: string;
    province_name?: string;
    regency_code?: string;
    regency_name?: string;
    district_code?: string;
    district_name?: string;
    village_code?: string;
    village_name?: string;
    // Password reset (optional)
    new_password?: string;
    // Force password change flag
    must_change_password?: boolean;
}

Deno.serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get the Authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Create a client with the user's token to verify them
        const supabaseUser = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
            global: {
                headers: { Authorization: authHeader },
            },
        });

        // Get the calling user
        const {
            data: { user: caller },
            error: authError,
        } = await supabaseUser.auth.getUser();

        if (authError || !caller) {
            console.error("Auth error:", authError);
            return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Create admin client for privileged operations
        const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Check if caller is admin
        const { data: callerProfile, error: profileError } = await supabaseAdmin.from("user_profiles").select("role").eq("id", caller.id).single();

        if (profileError || callerProfile?.role !== "admin") {
            return new Response(JSON.stringify({ error: "Unauthorized. Admin access required." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Parse request body
        const body: UpdateUserRequest = await req.json();

        // Validate required fields
        if (!body.user_id) {
            return new Response(JSON.stringify({ error: "user_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Check target user exists
        const { data: targetUser, error: targetError } = await supabaseAdmin.from("user_profiles").select("*").eq("id", body.user_id).single();

        if (targetError || !targetUser) {
            return new Response(JSON.stringify({ error: "User tidak ditemukan" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const updates: string[] = [];

        // Handle password reset if provided
        if (body.new_password) {
            if (body.new_password.length < 6) {
                return new Response(JSON.stringify({ error: "Password minimal 6 karakter" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(body.user_id, { password: body.new_password });

            if (passwordError) {
                return new Response(JSON.stringify({ error: `Gagal reset password: ${passwordError.message}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            updates.push("Password direset");
        }

        // Build profile update object
        const profileUpdates: Record<string, unknown> = {};

        if (body.full_name !== undefined) profileUpdates.full_name = body.full_name;
        if (body.phone !== undefined) profileUpdates.phone = body.phone || null;
        if (body.role !== undefined) profileUpdates.role = body.role;
        if (body.province_code !== undefined) profileUpdates.province_code = body.province_code || null;
        if (body.province_name !== undefined) profileUpdates.province_name = body.province_name || null;
        if (body.regency_code !== undefined) profileUpdates.regency_code = body.regency_code || null;
        if (body.regency_name !== undefined) profileUpdates.regency_name = body.regency_name || null;
        if (body.district_code !== undefined) profileUpdates.district_code = body.district_code || null;
        if (body.district_name !== undefined) profileUpdates.district_name = body.district_name || null;
        if (body.village_code !== undefined) profileUpdates.village_code = body.village_code || null;
        if (body.village_name !== undefined) profileUpdates.village_name = body.village_name || null;
        if (body.must_change_password !== undefined) profileUpdates.must_change_password = body.must_change_password;

        // Update profile if there are changes
        if (Object.keys(profileUpdates).length > 0) {
            const { error: updateError } = await supabaseAdmin.from("user_profiles").update(profileUpdates).eq("id", body.user_id);

            if (updateError) {
                return new Response(JSON.stringify({ error: `Gagal update profil: ${updateError.message}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            updates.push("Profil diperbarui");
        }

        if (updates.length === 0) {
            return new Response(JSON.stringify({ error: "Tidak ada data yang diubah" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: updates.join(", "),
                updates: updates,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in update-user function:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
