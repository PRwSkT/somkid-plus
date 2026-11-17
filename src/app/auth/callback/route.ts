import { NextResponse } from "next/server";
import {
  createGoogleUserSession,
  exchangeGoogleCode,
  getGoogleRedirectUri,
} from "@/lib/google-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const stateRaw = requestUrl.searchParams.get("state");
  const paramRedirectUri = requestUrl.searchParams.get("redirect_uri");

  let parsedNext = "/mock-exam";
  let stateRedirectUri: string | null = null;
  if (stateRaw) {
    try {
      const decoded = JSON.parse(
        Buffer.from(stateRaw, "base64url").toString("utf-8")
      );
      if (decoded.next) parsedNext = decoded.next;
      if (decoded.redirectUri) stateRedirectUri = decoded.redirectUri;
    } catch {
      // ignore
    }
  }

  const rawNext = requestUrl.searchParams.get("next") ?? parsedNext;
  // Mitigate Open Redirect: Only allow relative paths starting with single '/'
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\")
      ? rawNext
      : "/mock-exam";
  const errorMsg =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  let origin = requestUrl.origin;
  if (!isLocalEnv && forwardedHost) {
    origin = `https://${forwardedHost}`;
  }

  if (errorMsg) {
    return NextResponse.redirect(
      `${origin}${next}?oauth_error=${encodeURIComponent(errorMsg)}`
    );
  }

  if (code) {
    // 1. Try Direct Google OAuth exchange first using the Somkid+ credentials
    const redirectUri =
      paramRedirectUri || stateRedirectUri || getGoogleRedirectUri(origin);
    const googleUser = await exchangeGoogleCode(code, redirectUri);
    if (googleUser) {
      await createGoogleUserSession(googleUser);
      return NextResponse.redirect(`${origin}${next}`);
    }

    // 2. Fallback to Supabase exchange if initiated through Supabase GoTrue
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    return NextResponse.redirect(
      `${origin}${next}?oauth_error=${encodeURIComponent(
        "ไม่สามารถยืนยันตัวตนผ่าน Google ได้ กรุณาลองใหม่อีกครั้ง"
      )}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
