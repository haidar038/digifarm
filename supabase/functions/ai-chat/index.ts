// AI Chat Edge Function
// Uses Groq API for agriculture-focused AI assistant

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `Anda adalah asisten AI ahli pertanian bernama "DigiFarm Assistant". 
Fokus Anda adalah membantu petani Indonesia dengan:

1. **Budidaya Tanaman**: Teknik menanam, pemupukan, pengairan, jarak tanam
2. **Pengendalian Hama & Penyakit**: Identifikasi dan solusi organik/kimia
3. **Analisis Gambar**: Jika diberikan gambar, analisis kondisi tanaman, hama, penyakit, atau defisiensi nutrisi
4. **Pertanian Digital**: Penggunaan teknologi dalam pertanian modern
5. **Pasca Panen**: Penanganan, penyimpanan, dan pemasaran hasil pertanian

Pedoman:
- Jawab dalam Bahasa Indonesia yang mudah dipahami
- Berikan saran praktis dan actionable
- Jika tidak yakin, minta klarifikasi
- Untuk gambar, berikan analisis detail tentang apa yang Anda lihat
- Fokus pada pertanian di Indonesia, khususnya wilayah tropis`;

interface ChatRequest {
    message: string;
    image_base64?: string;
    conversation_id?: string;
    history?: Array<{
        role: "user" | "assistant";
        content: string;
        image_url?: string;
    }>;
}

interface GroqMessage {
    role: "user" | "assistant" | "system";
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const groqApiKey = Deno.env.get("GROQ_API_KEY");
        if (!groqApiKey) {
            return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Parse request
        const body: ChatRequest = await req.json();
        const { message, image_base64, conversation_id, history } = body;

        if (!message || message.trim() === "") {
            return new Response(JSON.stringify({ error: "Message is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Check if user is authenticated (optional)
        const authHeader = req.headers.get("Authorization");
        let userId: string | null = null;

        if (authHeader) {
            const supabaseUser = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });

            const {
                data: { user },
            } = await supabaseUser.auth.getUser();
            userId = user?.id ?? null;
        }

        // Build messages array
        const messages: GroqMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];

        // Add history if provided
        if (history && history.length > 0) {
            for (const msg of history) {
                messages.push({
                    role: msg.role,
                    content: msg.content,
                });
            }
        }

        // Determine model and build user message
        let model = TEXT_MODEL;

        if (image_base64) {
            // Use vision model for image analysis
            model = VISION_MODEL;
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: message },
                    {
                        type: "image_url",
                        image_url: {
                            url: image_base64.startsWith("data:") ? image_base64 : `data:image/jpeg;base64,${image_base64}`,
                        },
                    },
                ],
            });
        } else {
            messages.push({
                role: "user",
                content: message,
            });
        }

        // Call Groq API
        const groqResponse = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${groqApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
                max_tokens: 2048,
            }),
        });

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error("Groq API error:", errorText);
            return new Response(JSON.stringify({ error: "AI service error", details: errorText }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const groqData = await groqResponse.json();
        const assistantMessage = groqData.choices?.[0]?.message?.content ?? "Maaf, saya tidak dapat memproses permintaan ini.";

        // Save to database if user is authenticated
        let savedConversationId = conversation_id;
        let savedMessageId: string | null = null;

        if (userId) {
            const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { autoRefreshToken: false, persistSession: false } });

            // Create or use existing conversation
            if (!savedConversationId) {
                const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
                const { data: conv, error: convError } = await supabaseAdmin.from("ai_conversations").insert({ user_id: userId, title }).select("id").single();

                if (convError) {
                    console.error("Error creating conversation:", convError);
                } else {
                    savedConversationId = conv.id;
                }
            }

            if (savedConversationId) {
                // Save user message
                await supabaseAdmin.from("ai_messages").insert({
                    conversation_id: savedConversationId,
                    role: "user",
                    content: message,
                    image_url: image_base64 ? "image_attached" : null,
                });

                // Save assistant message
                const { data: msgData } = await supabaseAdmin
                    .from("ai_messages")
                    .insert({
                        conversation_id: savedConversationId,
                        role: "assistant",
                        content: assistantMessage,
                    })
                    .select("id")
                    .single();

                savedMessageId = msgData?.id ?? null;

                // Update conversation timestamp
                await supabaseAdmin.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", savedConversationId);
            }
        }

        return new Response(
            JSON.stringify({
                message: assistantMessage,
                conversation_id: savedConversationId,
                message_id: savedMessageId,
                model_used: model,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in ai-chat function:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
