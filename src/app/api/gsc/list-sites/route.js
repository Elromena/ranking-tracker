import { google } from 'googleapis';
import { NextResponse } from 'next/server';

/**
 * GET /api/gsc/list-sites
 * Lists all available GSC properties for the configured service account
 */
export async function GET(request) {
  try {
    // Check if credentials are set
    if (!process.env.GSC_CREDENTIALS) {
      return NextResponse.json({
        success: false,
        error: "GSC_CREDENTIALS environment variable is not set"
      }, { status: 400 });
    }

    // Parse credentials
    let credentials;
    try {
      credentials = JSON.parse(process.env.GSC_CREDENTIALS);
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: "GSC_CREDENTIALS is not valid JSON",
        hint: "Make sure you copied the entire service account JSON file"
      }, { status: 400 });
    }

    // Verify it's a service account
    if (credentials.type !== 'service_account') {
      return NextResponse.json({
        success: false,
        error: "Invalid credentials type",
        details: `Found type: "${credentials.type || 'unknown'}". Expected: "service_account"`,
        hint: "You uploaded an OAuth client secret. You need a Service Account key instead. See the setup guide."
      }, { status: 400 });
    }

    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchConsole = google.searchconsole({ version: 'v1', auth });

    // List all sites
    const response = await searchConsole.sites.list();
    const sites = response.data.siteEntry || [];

    if (sites.length === 0) {
      return NextResponse.json({
        success: true,
        sites: [],
        message: "No GSC properties found",
        hint: "Make sure you added the service account email as a user in Google Search Console",
        serviceAccountEmail: credentials.client_email
      });
    }

    // Format the sites nicely
    const formattedSites = sites.map(site => ({
      siteUrl: site.siteUrl,
      permissionLevel: site.permissionLevel,
      verified: true // If it shows up, it's verified
    }));

    return NextResponse.json({
      success: true,
      serviceAccountEmail: credentials.client_email,
      sites: formattedSites,
      count: formattedSites.length,
      hint: "Copy one of these siteUrl values to use as GSC_PROPERTY"
    });

  } catch (error) {
    // Handle specific errors
    if (error.message?.includes('permission') || error.message?.includes('403')) {
      return NextResponse.json({
        success: false,
        error: "Permission denied",
        details: error.message,
        hint: "Add the service account email as a user in Google Search Console (Settings → Users and permissions)"
      }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || "Failed to list GSC sites",
      details: error.toString()
    }, { status: 500 });
  }
}
