import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(req, { params }) {
  const id = parseInt(params.id);
  await prisma.category.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
