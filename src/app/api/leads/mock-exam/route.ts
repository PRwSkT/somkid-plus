import { NextResponse, after } from "next/server";
import { appendSubmission } from "@/lib/content-store";
import { insertExamAttempt, str, validateExamPayload } from "@/lib/exam-record";
import { getGoogleUserSession } from "@/lib/google-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  emailEnabled,
  sendAdminNotification,
  sendParentResultEmail,
} from "@/lib/result-email";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

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

  const parsed = validateExamPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const existingAttemptId = str(body.attemptId, 64);
  const attemptId =
    /^[0-9a-fA-F-]{36}$/.test(existingAttemptId)
      ? existingAttemptId
      : await insertExamAttempt(parsed.data);

  const record = {
    fullName: user.fullName || str(body.fullName, 120) || "ผู้ปกครอง",
    email: user.email,
    phone,
    lineId: str(body.lineId, 60),
    attemptId,
    ...parsed.data,
  };

  const supabase = getAdminSupabaseClient();
  if (supabase) {
    const { error: leadErr } = await supabase.from("leads").insert({
      user_id: null,
      attempt_id: attemptId,
      full_name: record.fullName,
      email: record.email,
      phone: record.phone,
      line_id: record.lineId || null,
      pdpa_consent: true,
      pdpa_consented_at: new Date().toISOString(),
      recommended_tier: record.tier,
      webhook_dispatched: Boolean(process.env.ADMIN_WEBHOOK_URL),
    });
    if (leadErr) {
      console.error("Supabase leads insert error:", leadErr);
    }
  }

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

  const emailQueued = emailEnabled();
  const skipParentDuplicate = Boolean(/^[0-9a-fA-F-]{36}$/.test(existingAttemptId));
  after(async () => {
    try {
      if (!skipParentDuplicate) {
        const sent = await sendParentResultEmail(record);
        console.log(`result email to parent: ${sent ? "sent" : "not sent"}`);
      }
      await sendAdminNotification("Lead ใหม่จากข้อสอบวัดระดับ (ฝากเบอร์ติดต่อกลับ)", {
        ชื่อ: record.fullName,
        อีเมล: record.email,
        เบอร์โทร: record.phone,
        LINE: record.lineId,
        ชุดข้อสอบ: record.trackLabel,
        คะแนน: `${record.scorePercent}% (${record.correctCount}/${record.totalQuestions})`,
        กลุ่ม: record.tier,
      });
    } catch (err) {
      console.error("post-lead email task failed:", err);
    }
  });

  return NextResponse.json({
    ok: true,
    attemptId,
    webhookDispatched,
    emailQueued,
    email: record.email,
  });
}
