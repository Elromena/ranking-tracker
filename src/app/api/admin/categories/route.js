import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/clear-snapshots
 * Clear all snapshot data so we can backfill fresh
 */
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req) {
  const { name } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: { name },
  });

  return NextResponse.json(category);
}
