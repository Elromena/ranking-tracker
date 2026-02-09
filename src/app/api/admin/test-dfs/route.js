import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { batchSerpPositions } from "@/lib/dataforseo";

/**
 * POST /api/admin/test-dfs
 * Test DataForSEO with a keyword and show raw results
 * 
 * Body: { keyword: "crypto affiliate programs" }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const keyword = body.keyword || "crypto affiliate programs";

    // Load config
    const configs = await prisma.config.findMany();
    const cfg = {};
    for (const c of configs) cfg[c.key] = c.value;

    const country = cfg.dfsCountry || "us";
    const language = cfg.dfsLanguage || "en";
    
    // Extract clean domain
    const rawDomain = cfg.targetDomain || cfg.gscProperty || process.env.GSC_PROPERTY || "";
    const targetDomain = rawDomain
      .replace("sc-domain:", "")
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "")
      .replace(/\/$/, "");

    // Call DataForSEO
    const results = await batchSerpPositions({
      keywords: [keyword],
      targetDomain,
      country,
      language,
    });

    const match = results[keyword];

    return NextResponse.json({
      ok: true,
      keyword,
      targetDomain,
      rawDomain,
      country,
      language,
      match: match || null,
      found: match?.position ? true : false,
      position: match?.position || null,
      foundUrl: match?.foundUrl || null,
      serpFeatures: match?.serpFeatures || [],
    });

  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error.message,
    }, { status: 500 });
  }
}
