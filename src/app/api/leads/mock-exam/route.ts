import { NextResponse } from "next/server";
import { appendSubmission } from "@/lib/content-store";
import { getGoogleUserSession } from "@/lib/google-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function expectedTier(percent: number): string {
  if (percent < 50) return "foundation";
  if (percent < 80) return "accelerator";
  return "achiever";
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function validPhone(v: string): boolean {
  const digits = v.replace(/\D/g, "");
  return /^[0-9+\-\s()]+$/.test(v) && digits.length >= 9 && digits.length <= 15;
}

export async function POST(request: Request) {
  const user = await getGoogleUserSession();
  if (!user || !user.email) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบด้วย Google ก่อนบันทึกผลสอบ" },
      { status: 401 }
    );
  }

  const ip = clientIp(request);
  const [byIp, byUser] = await Promise.all([
    rateLimit(`lead:ip:${ip}`, 20, 60 * 60 * 1000),
    rateLimit(`lead:user:${user.email}`, 10, 60 * 60 * 1000),
  ]);
  if (!byIp.allowed || !byUser.allowed) {
    return NextResponse.json(
      { error: "ส่งข้อมูลบ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field
  if (str(body.website, 100)) {
    return NextResponse.json({ ok: true, attemptId: null, webhookDispatched: false });
  }

  const phone = str(body.phone, 30);
  if (!validPhone(phone)) {
    return NextResponse.json(
      { error: "กรุณาระบุเบอร์โทรศัพท์ติดต่อที่ถูกต้อง" },
      { status: 400 }
    );
  }
  if (body.pdpaConsent !== true) {
    return NextResponse.json(
      { error: "กรุณายอมรับเงื่อนไข PDPA ก่อนรับผลวิเคราะห์" },
      { status: 400 }
    );
  }

  const total = Number(body.totalQuestions);
  const correct = Number(body.correctCount);
  const score = Number(body.scorePercent);
  const tier = str(body.tier, 30);
  if (
    !Number.isInteger(total) ||
    total < 1 ||
    total > 200 ||
    !Number.isInteger(correct) ||
    correct < 0 ||
    correct > total ||
    !Number.isFinite(score) ||
    Math.abs(score - Math.round((correct / total) * 100)) > 1 ||
    tier !== expectedTier(Math.round((correct / total) * 100))
  ) {
    return NextResponse.json(
      { error: "ข้อมูลผลสอบไม่สอดคล้องกัน กรุณาทำข้อสอบใหม่อีกครั้ง" },
      { status: 400 }
    );
  }

  const rawSkills =
    body.skillBreakdown && typeof body.skillBreakdown === "object"
      ? (body.skillBreakdown as Record<string, unknown>)
      : {};
  const skillBreakdown: Record<string, number> = {};
  for (const [k, v] of Object.entries(rawSkills).slice(0, 12)) {
    const n = Number(v);
    if (Number.isFinite(n)) skillBreakdown[k.slice(0, 30)] = Math.min(100, Math.max(0, Math.round(n)));
  }

  const recommendedCourseIds = Array.isArray(body.recommendedCourseIds)
    ? body.recommendedCourseIds.map((x) => str(x, 80)).filter(Boolean).slice(0, 10)
    : [];

  const record = {
    fullName: user.fullName || str(body.fullName, 120) || "ผู้ปกครอง",
    email: user.email,
    phone,
    lineId: str(body.lineId, 60),
    trackId: str(body.trackId, 60),
    trackLabel: str(body.trackLabel, 120),
    scorePercent: Math.round(score),
    correctCount: correct,
    totalQuestions: total,
    tier,
    skillBreakdown,
    recommendedCourseIds,
  };

  const stored = await appendSubmission("mock_exam_lead", record);
  if (!stored) {
    return NextResponse.json(
      { error: "ระบบบันทึกข้อมูลขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง" },
      { status: 503 }
    );
  }

  let webhookDispatched = false;
  const webhookUrl = process.env.ADMIN_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.ADMIN_WEBHOOK_SECRET
            ? { "X-Webhook-Secret": process.env.ADMIN_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify({
          event: "mock_exam_lead_captured",
          timestamp: new Date().toISOString(),
          studentOrParent: {
            fullName: record.fullName,
            email: record.email,
            phone: record.phone,
            lineId: record.lineId,
          },
          diagnostic: {
            trackId: record.trackId,
            trackLabel: record.trackLabel,
            scorePercent: record.scorePercent,
            correctCount: record.correctCount,
            totalQuestions: record.totalQuestions,
            tier: record.tier,
            skillBreakdown: record.skillBreakdown,
            recommendedCourseIds: record.recommendedCourseIds,
          },
        }),
        signal: AbortSignal.timeout(4000),
      });
      webhookDispatched = res.ok;
    } catch {
      webhookDispatched = false;
    }
  }

  return NextResponse.json({ ok: true, attemptId: null, webhookDispatched });
}
