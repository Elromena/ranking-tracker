import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/clear-snapshots
 * Clear all snapshot data so we can backfill fresh
 */
export async function POST(request) {
  try {
    // Delete all snapshots
    const deleted = await prisma.weeklySnapshot.deleteMany({});
    
    // Delete all alerts
    const alertsDeleted = await prisma.alert.deleteMany({});

    return NextResponse.json({
      ok: true,
      snapshotsDeleted: deleted.count,
      alertsDeleted: alertsDeleted.count,
      message: "All snapshot and alert data cleared. Ready for fresh backfill.",
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error.message,
    }, { status: 500 });
  }
}
