import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/clear-snapshots
 * Clear all snapshot data so we can backfill fresh
 */
export async function POST(request) {
  try {
    // Delete all snapshots
    const deleted = await prisma.snapshot.deleteMany({});

    return NextResponse.json({
      ok: true,
      snapshotsDeleted: deleted.count,
      alertsDeleted: 0,
      message: "All snapshot data cleared. Ready for fresh backfill.",
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error.message,
    }, { status: 500 });
  }
}
