import { NextResponse } from "next/server";
import { getSearchAnalytics, getLastWeekRange } from "@/lib/gsc";

// GET /api/test-gsc — test if GSC connection is working
export async function GET(request) {
  const errors = [];
  const info = {};

  try {
    // 1. Check if credentials are set
    if (!process.env.GSC_CREDENTIALS) {
      errors.push("GSC_CREDENTIALS environment variable is not set");
    } else {
      info.credentialsSet = true;
      try {
        const creds = JSON.parse(process.env.GSC_CREDENTIALS);
        info.serviceAccountEmail = creds.client_email || "Not found in JSON";
        info.projectId = creds.project_id || "Not found in JSON";
      } catch (e) {
        errors.push(`GSC_CREDENTIALS is not valid JSON: ${e.message}`);
      }
    }

    // 2. Check if property is set
    if (!process.env.GSC_PROPERTY) {
      errors.push("GSC_PROPERTY environment variable is not set");
    } else {
      info.gscProperty = process.env.GSC_PROPERTY;
    }

    // If we have errors already, return early
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors,
        info,
        message: "Configuration issues found. Please check your environment variables.",
      }, { status: 400 });
    }

    // 3. Try to make a test request to GSC
    const { startDate, endDate } = getLastWeekRange();
    info.testDateRange = { startDate, endDate };

    try {
      // Make a simple request without filtering by URL - just get site-wide data
      const testData = await getSearchAnalytics({
        url: info.gscProperty,
        startDate,
        endDate,
        keywords: []
      });

      info.dataReceived = true;
      info.rowCount = testData.length;
      
      if (testData.length > 0) {
        info.sampleKeywords = testData.slice(0, 5).map(d => ({
          keyword: d.keyword,
          clicks: d.clicks,
          impressions: d.impressions,
          position: Math.round(d.position * 10) / 10
        }));
      }

      return NextResponse.json({
        success: true,
        message: "✅ GSC connection is working!",
        info,
      });

    } catch (gscError) {
      errors.push(`GSC API Error: ${gscError.message}`);
      
      // Common error hints
      if (gscError.message.includes("permission") || gscError.message.includes("403")) {
        errors.push("HINT: Make sure you added the service account email as a user in Google Search Console (Settings → Users and permissions)");
      }
      if (gscError.message.includes("not found") || gscError.message.includes("404")) {
        errors.push("HINT: Check that GSC_PROPERTY matches exactly with your verified property in Search Console");
      }

      return NextResponse.json({
        success: false,
        errors,
        info,
        message: "GSC API request failed",
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      errors: [...errors, `Unexpected error: ${error.message}`],
      info,
      message: "Test failed",
    }, { status: 500 });
  }
}
