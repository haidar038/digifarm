// Send Welcome Email Edge Function
// Uses SMTP to send welcome emails via Niagahoster

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { generateWelcomeEmailHTML, generateWelcomeEmailText, WelcomeEmailData } from "../_shared/email-templates.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

interface SendWelcomeEmailRequest {
    user_id: string;
    email: string;
    full_name: string;
    temp_password: string;
    role: string;
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
        const body: SendWelcomeEmailRequest = await req.json();

        // Validate required fields
        if (!body.email || !body.full_name || !body.temp_password || !body.role) {
            return new Response(JSON.stringify({ error: "email, full_name, temp_password, and role are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Get SMTP configuration from environment
        const smtpHost = Deno.env.get("SMTP_HOST");
        const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
        const smtpUsername = Deno.env.get("SMTP_USERNAME");
        const smtpPassword = Deno.env.get("SMTP_PASSWORD");
        // IMPORTANT: Niagahoster requires FROM address to match authenticated username
        // If SMTP_FROM is not set, use SMTP_USERNAME as the FROM address
        const smtpFrom = Deno.env.get("SMTP_FROM") || smtpUsername || "";
        const appUrl = Deno.env.get("APP_URL") || "https://rindang.net";

        if (!smtpHost || !smtpUsername || !smtpPassword) {
            console.error("Missing SMTP configuration");
            return new Response(JSON.stringify({ error: "SMTP configuration not set. Please configure SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD in secrets." }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`SMTP config: host=${smtpHost}, port=${smtpPort}, from=${smtpFrom}`);

        // Prepare email data
        const emailData: WelcomeEmailData = {
            full_name: body.full_name,
            email: body.email,
            temp_password: body.temp_password,
            role: body.role,
            app_url: appUrl,
        };

        // Generate email content
        const htmlContent = generateWelcomeEmailHTML(emailData);
        const textContent = generateWelcomeEmailText(emailData);

        // Create SMTP client
        const client = new SMTPClient({
            connection: {
                hostname: smtpHost,
                port: smtpPort,
                tls: true,
                auth: {
                    username: smtpUsername,
                    password: smtpPassword,
                },
            },
        });

        // Format FROM with display name: "RINDANG" <email@domain.com>
        const fromWithName = `"RINDANG" <${smtpFrom}>`;

        // Send email
        await client.send({
            from: fromWithName,
            to: body.email,
            subject: "Selamat Datang di RINDANG - Akun Anda Telah Dibuat",
            content: textContent,
            html: htmlContent,
        });

        // Close SMTP connection
        await client.close();

        console.log(`Welcome email sent successfully to ${body.email}`);

        return new Response(
            JSON.stringify({
                success: true,
                message: `Welcome email sent to ${body.email}`,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in send-welcome-email function:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to send welcome email",
                details: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
