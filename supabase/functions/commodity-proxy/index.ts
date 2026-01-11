// Supabase Edge Function: Commodity Prices Proxy
// This function proxies requests to Bank Indonesia PIHPS API to avoid CORS issues

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BI_API_BASE = "https://www.bi.go.id/hargapangan/WebSite/Home/GetGridData1";

// CORS headers for all responses
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProxyRequest {
    commodityId: string;
    date: string; // Format: "Jan 11, 2026"
    provinceId?: number;
    priceType?: number;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Parse request body or query params
        let params: ProxyRequest;

        if (req.method === "POST") {
            params = await req.json();
        } else {
            const url = new URL(req.url);
            params = {
                commodityId: url.searchParams.get("commodityId") || "",
                date: url.searchParams.get("date") || "",
                provinceId: parseInt(url.searchParams.get("provinceId") || "32"),
                priceType: parseInt(url.searchParams.get("priceType") || "1"),
            };
        }

        if (!params.commodityId || !params.date) {
            return new Response(JSON.stringify({ error: "Missing required parameters: commodityId, date" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Build BI API URL
        const biParams = new URLSearchParams({
            tanggal: params.date,
            commodity: params.commodityId,
            priceType: (params.priceType || 1).toString(),
            isPasokan: "1",
            jenis: "1",
            periode: "1",
            provId: (params.provinceId || 32).toString(),
            _: Date.now().toString(),
        });

        const biUrl = `${BI_API_BASE}?${biParams.toString()}`;

        // Fetch from BI API (server-side, no CORS restrictions)
        const biResponse = await fetch(biUrl, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; DigiFarm/1.0)",
            },
        });

        if (!biResponse.ok) {
            return new Response(
                JSON.stringify({
                    error: "Failed to fetch from BI API",
                    status: biResponse.status,
                }),
                {
                    status: biResponse.status,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const data = await biResponse.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return new Response(
            JSON.stringify({
                error: "Internal proxy error",
                message: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
