import { NextResponse } from "next/server";
import { getGoogleUserSession } from "@/lib/google-auth";

export async function GET() {
  const user = await getGoogleUserSession();
  return NextResponse.json(
    {
      authenticated: Boolean(user),
      user,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    }
  );
}
