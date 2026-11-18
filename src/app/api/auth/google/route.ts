import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { GOOGLE_CLIENT_ID, getGoogleRedirectUri } from "@/lib/google-auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawNext = requestUrl.searchParams.get("next") ?? "/mock-exam";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\")
      ? rawNext
      : "/mock-exam";
  const nonce = randomBytes(16).toString("hex");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  let origin = requestUrl.origin;
  if (!isLocalEnv && forwardedHost) {
    origin = `https://${forwardedHost}`;
  }

  const redirectUri = getGoogleRedirectUri(origin);

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("access_type", "offline");
  googleUrl.searchParams.set("prompt", "select_account");
  // Store next in state
  googleUrl.searchParams.set(
    "state",
    Buffer.from(JSON.stringify({ next, redirectUri, nonce })).toString("base64url")
  );

  const res = NextResponse.redirect(googleUrl.toString());
  res.cookies.set("sk_oauth_nonce", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
