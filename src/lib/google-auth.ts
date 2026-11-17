import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export interface GoogleUserSession {
  fullName: string;
  email: string;
  avatarUrl?: string;
  isDemo: boolean;
}

export const COOKIE_NAME = "sk_oauth_user";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    "somkid-google-oauth-session-secret-key-32ch"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function serializeUserSession(user: GoogleUserSession): string {
  const json = JSON.stringify(user);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

export function getGoogleRedirectUri(origin: string): string {
  // If user configured a specific redirect URI in env, use it
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  // If running on production domain, match Google Cloud Console's authorized URI
  if (origin.includes("somkidplus.somkidvittaya.ac.th")) {
    return "https://somkidplus.somkidvittaya.ac.th";
  }
  // Otherwise use /auth/callback on current origin (e.g. localhost or Netlify preview)
  return `${origin}/auth/callback`;
}

export async function createGoogleUserSession(
  user: GoogleUserSession
): Promise<string> {
  const cookieValue = serializeUserSession(user);

  try {
    const store = await cookies();
    store.set(COOKIE_NAME, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  } catch {
    // ignore
  }

  return cookieValue;
}

export async function getGoogleUserSession(): Promise<GoogleUserSession | null> {
  try {
    const store = await cookies();
    const raw = store.get(COOKIE_NAME)?.value;
    if (!raw) return null;

    const [b64, sig] = raw.split(".");
    if (!b64 || !sig) return null;

    const expectedSig = sign(b64);
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }

    const json = Buffer.from(b64, "base64url").toString("utf-8");
    return JSON.parse(json) as GoogleUserSession;
  } catch {
    return null;
  }
}

export async function clearGoogleUserSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleUserSession | null> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => "");
    console.error("Google token exchange failed:", errText);
    return null;
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) return null;

  const userRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    }
  );

  if (!userRes.ok) return null;

  const profile = (await userRes.json()) as {
    name?: string;
    email?: string;
    picture?: string;
  };

  if (!profile.email) return null;

  return {
    fullName: profile.name || profile.email.split("@")[0],
    email: profile.email,
    avatarUrl: profile.picture,
    isDemo: false,
  };
}
