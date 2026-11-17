import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { appendSubmission } from "@/lib/content-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      trackId,
      trackLabel,
      totalQuestions,
      correctCount,
      scorePercent,
      tier,
      skillBreakdown,
      recommendedCourseIds,
      fullName,
      email,
      phone,
      lineId,
      pdpaConsent,
    } = body ?? {};

    if (!phone || typeof phone !== "string" || phone.trim().length < 9) {
      return NextResponse.json(
        { error: "กรุณาระบุเบอร์โทรศัพท์ติดต่อที่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!pdpaConsent) {
      return NextResponse.json(
        { error: "กรุณายอมรับเงื่อนไข PDPA ก่อนรับผลวิเคราะห์" },
        { status: 400 }
      );
    }

    let attemptId: string | null = null;
    const supabase = await createServerSupabaseClient();

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: attemptRow } = await supabase
          .from("exam_attempts")
          .insert({
            user_id: user.id,
            track_id: trackId,
            track_label: trackLabel,
            total_questions: totalQuestions,
            correct_count: correctCount,
            score_percent: scorePercent,
            tier,
            skill_breakdown: skillBreakdown,
            recommended_course_ids: recommendedCourseIds ?? [],
          })
          .select("id")
          .single();

        attemptId = attemptRow?.id ?? null;

        await supabase.from("leads").insert({
          user_id: user.id,
          attempt_id: attemptId,
          full_name: fullName || user.user_metadata?.full_name || "Parent",
          email: email || user.email || "",
          phone: phone.trim(),
          line_id: lineId ? String(lineId).trim() : null,
          pdpa_consent: true,
          pdpa_consented_at: new Date().toISOString(),
          recommended_tier: tier,
          webhook_dispatched: Boolean(process.env.ADMIN_WEBHOOK_URL),
        });
      }
    }

    await appendSubmission("mock_exam_lead", {
      fullName: fullName || "ผู้ปกครอง",
      email: email || "",
      phone: phone.trim(),
      lineId: lineId ? String(lineId).trim() : "",
      trackId,
      trackLabel,
      scorePercent,
      correctCount,
      totalQuestions,
      tier,
      skillBreakdown,
      recommendedCourseIds: recommendedCourseIds ?? [],
    });

    // Real-time Webhook notification to LINE Official / Admin CRM
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
            studentOrParent: { fullName, email, phone: phone.trim(), lineId },
            diagnostic: {
              trackId,
              trackLabel,
              scorePercent,
              correctCount,
              totalQuestions,
              tier,
              skillBreakdown,
              recommendedCourseIds,
            },
          }),
        });
        webhookDispatched = res.ok;
      } catch {
        webhookDispatched = false;
      }
    }

    return NextResponse.json({
      ok: true,
      attemptId,
      webhookDispatched,
    });
  } catch {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }
}
