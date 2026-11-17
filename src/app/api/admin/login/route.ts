import { NextResponse } from "next/server";
import { createSession, passwordMatches, adminConfigured } from "@/lib/admin-auth";

// In-memory rate limiting for brute-force protection
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า ADMIN_PASSWORD ในไฟล์ .env.local" },
      { status: 500 }
    );
  }

  const ip = getClientIp(request);
  const now = Date.now();
  const record = failedAttempts.get(ip);

  if (record && record.resetAt > now && record.count >= MAX_ATTEMPTS) {
    const remainingMins = Math.ceil((record.resetAt - now) / 60000);
    return NextResponse.json(
      { error: `เข้าสู่ระบบผิดพลาดเกินกำหนด กรุณารอ ${remainingMins} นาที` },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body?.password ?? "");

  if (!passwordMatches(password)) {
    // Artificial delay to prevent timing and high-speed brute force
    await new Promise((resolve) => setTimeout(resolve, 600));

    const current = record && record.resetAt > now ? record.count + 1 : 1;
    failedAttempts.set(ip, { count: current, resetAt: now + LOCKOUT_MS });

    return NextResponse.json(
      {
        error: `รหัสผ่านไม่ถูกต้อง (เหลือโอกาสลองอีก ${Math.max(
          0,
          MAX_ATTEMPTS - current
        )} ครั้ง)`,
      },
      { status: 401 }
    );
  }

  // Clear failed count on successful login
  failedAttempts.delete(ip);
  await createSession();
  return NextResponse.json({ ok: true });
}
