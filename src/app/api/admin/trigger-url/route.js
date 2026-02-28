import { NextResponse } from "next/server";

/**
 * POST /api/admin/trigger-url
 * Trigger data collection for a specific URL
 *
 * Body: { urlId: 123 }
 */
export async function POST(request) {
  try {
    // Call the main cron endpoint with the correct secret
    const cronSecret = process.env.CRON_SECRET;
    const url = process.env.DASHBOARD_URL;

    console.log(url, cronSecret);

    const response = await fetch(`${url || "http://localhost:3000"}/api/cron`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": cronSecret || "",
      },
    });

    const result = await response.json();

    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        hint: "Make sure DASHBOARD_URL and CRON_SECRET environment variables are set correctly",
      },
      { status: 500 },
    );
  }
}
