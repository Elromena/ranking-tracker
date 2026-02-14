import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/urls/[id]/notes — add a note to a URL's changelog
export async function DELETE(request, { params }) {
  const noteId = parseInt(params.noteId);

  console.log(noteId);

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
