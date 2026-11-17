import { NextResponse } from "next/server";
import { clearGoogleUserSession } from "@/lib/google-auth";

export async function POST() {
  await clearGoogleUserSession();
  return NextResponse.json({ ok: true });
}
