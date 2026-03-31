import { sendMessage } from "@/lib/telegram";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await sendMessage(
      "<b>Ranking Tracker</b>\n\nThis is a test message. If you see this, Telegram notifications are working correctly."
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
