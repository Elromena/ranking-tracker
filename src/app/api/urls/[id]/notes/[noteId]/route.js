import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

function sanitizeRichText(html) {
  if (!html) return "";
  return String(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

// POST /api/urls/[id]/notes — add a note to a URL's changelog
export async function DELETE(request, { params }) {
  const noteId = parseInt(params.noteId);

  if (!noteId) {
    return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
  }

  try {
    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json(
      { message: "Note deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Note not found or already deleted" },
      { status: 404 },
    );
  }
}

export async function PATCH(request, { params }) {
  const noteId = parseInt(params.noteId);
  const { text, createdAt } = await request.json();

  if (!text) {
    return NextResponse.json({ error: "Text required" }, { status: 400 });
  }

  const existing = await prisma.note.findUnique({
    where: { id: noteId },
    select: { type: true },
  });

  const safeText =
    existing?.type === "general"
      ? sanitizeRichText(text)
      : String(text).trim();
  const isEmptyGeneral =
    existing?.type === "general" &&
    !safeText.replace(/<[^>]+>/g, "").trim();
  if (!safeText || isEmptyGeneral) {
    return NextResponse.json({ error: "Text required" }, { status: 400 });
  }

  const data = { text: safeText };
  
  if (createdAt) {
    data.createdAt = new Date(createdAt);
  }

  const updated = await prisma.note.update({
    where: { id: noteId },
    data,
  });

  return NextResponse.json(updated, { status: 200 });
}
