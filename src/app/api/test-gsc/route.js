import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getLastWeekRange } from "@/lib/gsc";

export async function GET() {
  const errors = [];
  const info = {};

  try {
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

    if (!process.env.GSC_PROPERTY) {
      errors.push("GSC_PROPERTY environment variable is not set");
    } else {
      info.gscProperty = process.env.GSC_PROPERTY;
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false, errors, info,
        message: "Configuration issues found. Please check your environment variables.",
      }, { status: 400 });
    }

    const { startDate, endDate } = getLastWeekRange();
    info.testDateRange = { startDate, endDate };

    try {
      const credentials = JSON.parse(process.env.GSC_CREDENTIALS);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
      });
      const client = google.searchconsole({ version: "v1", auth });

      const response = await client.searchanalytics.query({
        siteUrl: process.env.GSC_PROPERTY,
        requestBody: {
          startDate,
          endDate,
          dimensions: ["query"],
          rowLimit: 5,
        },
      });

      const rows = response.data.rows || [];
      info.dataReceived = true;
      info.rowCount = rows.length;

      if (rows.length > 0) {
        info.sampleKeywords = rows.map((r) => ({
          keyword: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          position: Math.round(r.position * 10) / 10,
        }));
      }

      return NextResponse.json({
        success: true,
        message: "GSC connection is working!",
        info,
      });
    } catch (gscError) {
      errors.push(`GSC API Error: ${gscError.message}`);

      if (gscError.message.includes("permission") || gscError.message.includes("403")) {
        errors.push("HINT: Make sure you added the service account email as a user in Google Search Console (Settings → Users and permissions)");
      }
      if (gscError.message.includes("not found") || gscError.message.includes("404")) {
        errors.push("HINT: Check that GSC_PROPERTY matches exactly with your verified property in Search Console");
      }

      return NextResponse.json({
        success: false, errors, info,
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
