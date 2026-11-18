import "server-only";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export interface ValidatedExamPayload {
  trackId: string;
  trackLabel: string;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  tier: string;
  skillBreakdown: Record<string, number>;
  recommendedCourseIds: string[];
}

export function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function expectedTier(percent: number): string {
  if (percent < 50) return "foundation";
  if (percent < 80) return "accelerator";
  return "achiever";
}

export function validateExamPayload(
  body: Record<string, unknown>
): { ok: true; data: ValidatedExamPayload } | { ok: false; error: string } {
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
    return {
      ok: false,
      error: "ข้อมูลผลสอบไม่สอดคล้องกัน กรุณาทำข้อสอบใหม่อีกครั้ง",
    };
  }

  const rawSkills =
    body.skillBreakdown && typeof body.skillBreakdown === "object"
      ? (body.skillBreakdown as Record<string, unknown>)
      : {};
  const skillBreakdown: Record<string, number> = {};
  for (const [k, v] of Object.entries(rawSkills).slice(0, 12)) {
    const n = Number(v);
    if (Number.isFinite(n)) {
      skillBreakdown[k.slice(0, 30)] = Math.min(100, Math.max(0, Math.round(n)));
    }
  }

  const recommendedCourseIds = Array.isArray(body.recommendedCourseIds)
    ? body.recommendedCourseIds.map((x) => str(x, 80)).filter(Boolean).slice(0, 10)
    : [];

  return {
    ok: true,
    data: {
      trackId: str(body.trackId, 60) || "unknown",
      trackLabel: str(body.trackLabel, 120) || "แบบทดสอบวัดระดับ",
      totalQuestions: total,
      correctCount: correct,
      scorePercent: Math.round(score),
      tier,
      skillBreakdown,
      recommendedCourseIds,
    },
  };
}

export async function insertExamAttempt(
  payload: ValidatedExamPayload
): Promise<string | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("exam_attempts")
    .insert({
      user_id: null,
      track_id: payload.trackId,
      track_label: payload.trackLabel,
      total_questions: payload.totalQuestions,
      correct_count: payload.correctCount,
      score_percent: payload.scorePercent,
      tier: payload.tier,
      skill_breakdown: payload.skillBreakdown,
      recommended_course_ids: payload.recommendedCourseIds,
    })
    .select("id")
    .single();

  if (error) {
    console.error("insertExamAttempt error:", error);
    return null;
  }
  return data?.id ?? null;
}
