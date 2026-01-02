// Edge function to delete a user (admin only)
// Uses Supabase Admin API which requires service role
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface DeleteUserRequest {
    user_id: string;
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
        const body: DeleteUserRequest = await req.json();

        // Validate required fields
        if (!body.user_id) {
            return new Response(JSON.stringify({ error: "user_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Prevent admin from deleting themselves
        if (body.user_id === caller.id) {
            return new Response(JSON.stringify({ error: "Anda tidak dapat menghapus akun Anda sendiri" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Get user info before deletion for response
        const { data: targetUser, error: targetError } = await supabaseAdmin.from("user_profiles").select("full_name, role").eq("id", body.user_id).single();

        if (targetError || !targetUser) {
            return new Response(JSON.stringify({ error: "User tidak ditemukan" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Delete the user from auth.users (this will cascade to user_profiles and other tables)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(body.user_id);

        if (deleteError) {
            console.error("Error deleting user:", deleteError);
            return new Response(JSON.stringify({ error: deleteError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `User "${targetUser.full_name}" berhasil dihapus beserta semua datanya.`,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in delete-user function:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
