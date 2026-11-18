import { NextResponse, after } from "next/server";
import { appendSubmission } from "@/lib/content-store";
import { insertExamAttempt, validateExamPayload } from "@/lib/exam-record";
import { getGoogleUserSession } from "@/lib/google-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  emailEnabled,
  sendAdminNotification,
  sendParentResultEmail,
} from "@/lib/result-email";

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
    rateLimit(`attempt:ip:${ip}`, 30, 60 * 60 * 1000),
    rateLimit(`attempt:user:${user.email}`, 15, 60 * 60 * 1000),
  ]);
  if (!byIp.allowed || !byUser.allowed) {
    return NextResponse.json(
      { error: "บันทึกผลสอบบ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = validateExamPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const attemptId = await insertExamAttempt(parsed.data);
  const record = {
    fullName: user.fullName || "ผู้ปกครอง",
    email: user.email,
    phone: "",
    lineId: "",
    attemptId,
    ...parsed.data,
  };

  const stored = await appendSubmission("mock_exam_lead", record);
  if (!stored) {
    return NextResponse.json(
      { error: "ระบบบันทึกข้อมูลขัดข้องชั่วคราว" },
      { status: 503 }
    );
  }

  const emailQueued = emailEnabled();
  after(async () => {
    try {
      const sent = await sendParentResultEmail(record);
      console.log(`auto result email to ${record.email}: ${sent ? "sent" : "not sent"}`);
      await sendAdminNotification("มีผู้ทำข้อสอบวัดระดับสำเร็จ (เข้าสู่ระบบ Google)", {
        ชื่อ: record.fullName,
        อีเมล: record.email,
        ชุดข้อสอบ: record.trackLabel,
        คะแนน: `${record.scorePercent}% (${record.correctCount}/${record.totalQuestions})`,
        กลุ่ม: record.tier,
      });
    } catch (err) {
      console.error("post-attempt email task failed:", err);
    }
  });

  return NextResponse.json({
    ok: true,
    attemptId,
    emailQueued,
    email: record.email,
  });
}
