import { NextResponse, after } from "next/server";
import { appendSubmission } from "@/lib/content-store";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendAdminNotification } from "@/lib/result-email";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function validPhone(v: string): boolean {
  const digits = v.replace(/\D/g, "");
  return /^[0-9+\-\s()]+$/.test(v) && digits.length >= 9 && digits.length <= 15;
}

export async function POST(request: Request) {
  const rl = await rateLimit(`booking:ip:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
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

  const studentName = str(body.studentName, 120);
  const parentName = str(body.parentName, 120);
  const phone = str(body.phone, 30);

  if (!studentName || !parentName || !phone || body.pdpaConsent !== true) {
    return NextResponse.json(
      { error: "กรุณากรอกข้อมูลที่จำเป็นและยืนยันความยินยอม PDPA" },
      { status: 400 }
    );
  }
  if (!validPhone(phone)) {
    return NextResponse.json(
      { error: "กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง" },
      { status: 400 }
    );
  }

  const bookingType = str(body.bookingType, 30);
  const normalizedType =
    bookingType === "trial_class"
      ? "trial_class"
      : bookingType === "campus_visit"
        ? "campus_visit"
        : "enrollment";

  const record = {
    courseId: str(body.courseId, 80),
    courseTitle: str(body.courseTitle, 200),
    studentName,
    gradeLevel: str(body.gradeLevel, 40),
    parentName,
    email: str(body.email, 160),
    phone,
    lineId: str(body.lineId, 60),
    preferredDate: str(body.preferredDate, 120),
    notes: str(body.notes, 1000),
  };

  const supabase = getAdminSupabaseClient();
  if (supabase) {
    const { error: bookingErr } = await supabase.from("bookings").insert({
      user_id: null,
      booking_type: normalizedType,
      course_id: record.courseId || null,
      course_title: record.courseTitle || null,
      student_name: record.studentName,
      grade_level: record.gradeLevel || null,
      parent_name: record.parentName,
      email: record.email || null,
      phone: record.phone,
      line_id: record.lineId || null,
      preferred_date: record.preferredDate || null,
      notes: record.notes || null,
      pdpa_consent: true,
    });
    if (bookingErr) {
      console.error("Supabase bookings insert error:", bookingErr);
    }
  }

  const stored = await appendSubmission(normalizedType, record);
  if (!stored) {
    return NextResponse.json(
      { error: "ระบบบันทึกข้อมูลขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง" },
      { status: 503 }
    );
  }

  const webhookUrl = process.env.ADMIN_WEBHOOK_URL;
  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.ADMIN_WEBHOOK_SECRET
          ? { "X-Webhook-Secret": process.env.ADMIN_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({
        event: "booking_created",
        timestamp: new Date().toISOString(),
        bookingType: normalizedType,
        ...record,
      }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => {});
  }

  after(async () => {
    try {
      await sendAdminNotification("คำขอใหม่จากเว็บไซต์ Somkid+", {
        ประเภท: normalizedType,
        ...record,
      });
    } catch (err) {
      console.error("post-booking email task failed:", err);
    }
  });

  return NextResponse.json({ ok: true });
}
