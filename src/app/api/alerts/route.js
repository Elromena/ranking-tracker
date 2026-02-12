import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/alerts — list all alerts with filters
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where = {};
  if (severity) where.severity = severity;
  if (status) where.status = status;

  const alerts = await prisma.alert.findMany({
    where,
    include: {
      keyword: {
        include: {
          trackedUrl: { select: { id: true, title: true, url: true } },
        },
      },
    },
    orderBy: { alertDate: "desc" },
    take: limit,
  });

  return NextResponse.json(alerts);
}

// PUT /api/alerts — update alert status/action
export async function PUT(request) {
  const body = await request.json();
  const { id, status, action } = body;

  const updateData = {};
  if (status) updateData.status = status;
  if (action !== undefined) updateData.action = action;
  if (status === "resolved") updateData.resolvedAt = new Date();

  const updated = await prisma.alert.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
