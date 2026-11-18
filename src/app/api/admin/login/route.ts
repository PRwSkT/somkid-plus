import { NextResponse } from "next/server";
import { createSession, passwordMatches, adminConfigured } from "@/lib/admin-auth";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "ระบบผู้ดูแลยังไม่ได้ตั้งค่า" },
      { status: 500 }
    );
  }

  const key = `admin-login:${clientIp(request)}`;
  const body = await request.json().catch(() => ({}));
  const password = String(body?.password ?? "");

  if (passwordMatches(password)) {
    await resetRateLimit(key);
    await createSession();
    return NextResponse.json({ ok: true });
  }

  // Count only failed attempts (database-backed, shared across instances)
  const rl = await rateLimit(key, MAX_ATTEMPTS, LOCKOUT_MS);
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `เข้าสู่ระบบผิดพลาดเกินกำหนด กรุณารอ ${Math.max(1, Math.ceil(rl.retryAfterSec / 60))} นาที`,
      },
      { status: 429 }
    );
  }

  return NextResponse.json(
    { error: `รหัสผ่านไม่ถูกต้อง (เหลือโอกาสลองอีก ${rl.remaining} ครั้ง)` },
    { status: 401 }
  );
}
