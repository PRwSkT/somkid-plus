import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { appendSubmission } from "@/lib/content-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      bookingType,
      courseId,
      courseTitle,
      studentName,
      gradeLevel,
      parentName,
      email,
      phone,
      lineId,
      preferredDate,
      notes,
      pdpaConsent,
    } = body ?? {};

    if (!studentName || !parentName || !phone || !pdpaConsent) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลที่จำเป็นและยืนยันความยินยอม PDPA" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("bookings").insert({
        user_id: user?.id ?? null,
        booking_type: bookingType || "enrollment",
        course_id: courseId ?? null,
        course_title: courseTitle ?? null,
        student_name: String(studentName).trim(),
        grade_level: gradeLevel ? String(gradeLevel).trim() : null,
        parent_name: String(parentName).trim(),
        email: email ? String(email).trim() : user?.email ?? null,
        phone: String(phone).trim(),
        line_id: lineId ? String(lineId).trim() : null,
        preferred_date: preferredDate ? String(preferredDate).trim() : null,
        notes: notes ? String(notes).trim() : null,
        pdpa_consent: Boolean(pdpaConsent),
      });
    }

    const normalizedType =
      bookingType === "trial_class"
        ? "trial_class"
        : bookingType === "campus_visit"
          ? "campus_visit"
          : "enrollment";

    await appendSubmission(normalizedType, {
      courseId: courseId ?? "",
      courseTitle: courseTitle ?? "",
      studentName: String(studentName).trim(),
      gradeLevel: gradeLevel ? String(gradeLevel).trim() : "",
      parentName: String(parentName).trim(),
      email: email ? String(email).trim() : "",
      phone: String(phone).trim(),
      lineId: lineId ? String(lineId).trim() : "",
      preferredDate: preferredDate ? String(preferredDate).trim() : "",
      notes: notes ? String(notes).trim() : "",
    });

    const webhookUrl = process.env.ADMIN_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "booking_created",
          timestamp: new Date().toISOString(),
          bookingType,
          courseTitle,
          studentName,
          gradeLevel,
          parentName,
          phone,
          lineId,
          preferredDate,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถบันทึกคำขอได้" },
      { status: 400 }
    );
  }
}
