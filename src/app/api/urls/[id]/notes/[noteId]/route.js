import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

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
  const { text } = await request.json();

  if (!text) {
    return NextResponse.json({ error: "Text required" }, { status: 400 });
  }

  const updated = await prisma.note.update({
    where: { id: noteId },
    data: { text },
  });

  return NextResponse.json(updated, { status: 200 });
}
