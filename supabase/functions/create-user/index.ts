// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface CreateUserRequest {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: "farmer" | "manager" | "observer";
    province_code?: string;
    province_name?: string;
    regency_code?: string;
    regency_name?: string;
    district_code?: string;
    district_name?: string;
    village_code?: string;
    village_name?: string;
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
        const body: CreateUserRequest = await req.json();

        // Validate required fields
        if (!body.email || !body.password || !body.full_name || !body.role) {
            return new Response(JSON.stringify({ error: "Email, password, full_name, and role are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Validate password length
        if (body.password.length < 6) {
            return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Create the user with admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: body.email,
            password: body.password,
            email_confirm: true, // Auto-confirm email so user can login immediately
            user_metadata: {
                full_name: body.full_name,
                phone: body.phone || null,
                province_code: body.province_code || null,
                province_name: body.province_name || null,
                regency_code: body.regency_code || null,
                regency_name: body.regency_name || null,
                district_code: body.district_code || null,
                district_name: body.district_name || null,
                village_code: body.village_code || null,
                village_name: body.village_name || null,
            },
        });

        if (createError) {
            return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (!newUser.user) {
            return new Response(JSON.stringify({ error: "Failed to create user" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Update the user profile with role and must_change_password flag
        // The profile is created by the handle_new_user trigger, so we update it
        const { error: updateError } = await supabaseAdmin
            .from("user_profiles")
            .update({
                role: body.role,
                must_change_password: true,
            })
            .eq("id", newUser.user.id);

        if (updateError) {
            console.error("Failed to update user profile:", updateError);
            // Don't fail the request, the user is created, profile update can be done manually
        }

        return new Response(
            JSON.stringify({
                success: true,
                user: {
                    id: newUser.user.id,
                    email: newUser.user.email,
                    full_name: body.full_name,
                    role: body.role,
                },
                message: "User created successfully. They must change their password on first login.",
            }),
            { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in create-user function:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
