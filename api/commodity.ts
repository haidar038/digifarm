// Vercel Serverless Function: Commodity Prices Proxy
// Fallback proxy for Bank Indonesia PIHPS API

import type { VercelRequest, VercelResponse } from "@vercel/node";

const BI_API_BASE = "https://www.bi.go.id/hargapangan/WebSite/Home/GetGridData1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
    res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

    // Handle preflight
    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    try {
        const { commodityId, date, provinceId = 32, priceType = 1 } = req.method === "POST" ? req.body : req.query;

        if (!commodityId || !date) {
            return res.status(400).json({
                error: "Missing required parameters: commodityId, date",
            });
        }

        // Build BI API URL
        const biParams = new URLSearchParams({
            tanggal: date as string,
            commodity: commodityId as string,
            priceType: priceType.toString(),
            isPasokan: "1",
            jenis: "1",
            periode: "1",
            provId: provinceId.toString(),
            _: Date.now().toString(),
        });

        const biUrl = `${BI_API_BASE}?${biParams.toString()}`;

        // Fetch from BI API
        const biResponse = await fetch(biUrl, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; DigiFarm/1.0)",
            },
        });

        if (!biResponse.ok) {
            return res.status(biResponse.status).json({
                error: "Failed to fetch from BI API",
                status: biResponse.status,
            });
        }

        const data = await biResponse.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error("Proxy error:", error);
        return res.status(500).json({
            error: "Internal proxy error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
