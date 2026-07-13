import { NextResponse } from "next/server";
import { clearGuestCookie } from "@/server/actions/guest";

export async function POST() {
  await clearGuestCookie();
  return NextResponse.json({ success: true });
}
