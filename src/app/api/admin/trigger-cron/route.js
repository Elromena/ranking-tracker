import { NextResponse } from "next/server";

/**
 * POST /api/admin/trigger-cron
 * Admin endpoint to manually trigger data collection from the dashboard
 * No secret required - use for admin UI only
 */
export async function POST(request) {
  try {
    // Call the main cron endpoint with the correct secret
    const cronSecret = process.env.CRON_SECRET;
    
    const response = await fetch(`${process.env.DASHBOARD_URL || "http://localhost:3000"}/api/cron`, {
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
        hint: "Make sure DASHBOARD_URL and CRON_SECRET environment variables are set correctly"
      },
      { status: 500 }
    );
  }
}
