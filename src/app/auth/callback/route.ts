import { NextResponse } from "next/server";
import {
  createGoogleUserSession,
  exchangeGoogleCode,
  getGoogleRedirectUri,
  serializeUserSession,
} from "@/lib/google-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const stateRaw = requestUrl.searchParams.get("state");
  const paramRedirectUri = requestUrl.searchParams.get("redirect_uri");

  let parsedNext = "/mock-exam";
  let stateRedirectUri: string | null = null;
  let stateNonce: string | null = null;
  if (stateRaw) {
    try {
      const decoded = JSON.parse(
        Buffer.from(stateRaw, "base64url").toString("utf-8")
      );
      if (decoded.next) parsedNext = decoded.next;
      if (decoded.redirectUri) stateRedirectUri = decoded.redirectUri;
      if (decoded.nonce) stateNonce = String(decoded.nonce);
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
    const cookieNonce = request.headers
      .get("cookie")
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("sk_oauth_nonce="))
      ?.slice("sk_oauth_nonce=".length);
    // CSRF protection: the state nonce must match the cookie set at login start
    const nonceOk = Boolean(stateNonce && cookieNonce && stateNonce === cookieNonce);
    const googleUser = nonceOk
      ? await exchangeGoogleCode(code, redirectUri)
      : null;
    if (googleUser) {
      await createGoogleUserSession(googleUser);
      const res = NextResponse.redirect(`${origin}${next}`);
      res.cookies.delete("sk_oauth_nonce");
      // Explicitly attach cookie header to ensure it persists through the 307 redirect
      res.cookies.set("sk_oauth_user", serializeUserSession(googleUser), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
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
