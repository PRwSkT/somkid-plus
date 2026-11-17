import { NextResponse } from "next/server";
import { getGoogleUserSession } from "@/lib/google-auth";

export async function GET() {
  const user = await getGoogleUserSession();
  return NextResponse.json({ user });
}
