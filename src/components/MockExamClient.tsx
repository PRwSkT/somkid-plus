"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  SKILL_DIMENSION_LABELS,
  TIER_MATRIX,
  classifyScoreTier,
  type AcademicCourse,
  type MockExamTrack,
  type SkillDimensionKey,
} from "@/data/somkid-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { SkillRadarChart } from "@/components/SkillRadarChart";
import { EnrollmentDialog } from "@/components/EnrollmentDialog";

const SESSION_KEY = "somkid_mock_exam_v1";

type FunnelStep = "select" | "exam" | "oauth_gate" | "enrichment" | "results";

interface PersistedExamState {
  trackId: string;
  answers: Record<string, number>;
  currentIndex: number;
  elapsedSeconds: number;
  completedAt?: string;
}

interface AuthIdentity {
  fullName: string;
  email: string;
  avatarUrl?: string;
  isDemo: boolean;
}

export function MockExamClient({
  tracks,
  courses,
}: {
  tracks: MockExamTrack[];
  courses: AcademicCourse[];
}) {
  const [step, setStep] = useState<FunnelStep>("select");
  const [trackId, setTrackId] = useState<string>(tracks[0].id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [authUser, setAuthUser] = useState<AuthIdentity | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [enrollCourse, setEnrollCourse] = useState<AcademicCourse | null>(null);

  const supabaseConfigured = isSupabaseConfigured();

  const activeTrack: MockExamTrack = useMemo(
    () =>
      tracks.find((t) => t.id === trackId) ?? tracks[0],
    [tracks, trackId]
  );

  // Restore persisted exam state + check Supabase auth session on mount
  useEffect(() => {
    let active = true;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("oauth_error");
      if (err) {
        setOauthError(decodeURIComponent(err));
      }
    }

    const init = async () => {
      let restored: PersistedExamState | null = null;
      try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (raw) {
          restored = JSON.parse(raw) as PersistedExamState;
        }
      } catch {
        // ignore malformed session storage
      }

      if (!active) return;
      if (restored) {
        if (restored.trackId) setTrackId(restored.trackId);
        if (restored.answers) setAnswers(restored.answers);
        if (typeof restored.currentIndex === "number")
          setCurrentIndex(restored.currentIndex);
        if (typeof restored.elapsedSeconds === "number")
          setElapsedSeconds(restored.elapsedSeconds);
      }

      const supabase = createClient();
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (!active) return;
        if (data.user) {
          setAuthUser({
            fullName:
              (data.user.user_metadata?.full_name as string) ||
              (data.user.user_metadata?.name as string) ||
              data.user.email?.split("@")[0] ||
              "ผู้ปกครอง Somkid+",
            email: data.user.email || "",
            avatarUrl:
              (data.user.user_metadata?.avatar_url as string) ||
              (data.user.user_metadata?.picture as string) ||
              undefined,
            isDemo: false,
          });
          if (restored?.completedAt) {
            setStep("enrichment");
          }
        } else if (restored?.completedAt) {
          setStep("oauth_gate");
        }
      } else if (restored?.completedAt) {
        setStep("oauth_gate");
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setAuthUser(null);
    setStep("oauth_gate");
  }

  // Persist exam progress on changes
  const persistState = useCallback(
    (
      nextAnswers: Record<string, number>,
      nextIndex: number,
      nextElapsed: number,
      completedAt?: string
    ) => {
      try {
        const payload: PersistedExamState = {
          trackId,
          answers: nextAnswers,
          currentIndex: nextIndex,
          elapsedSeconds: nextElapsed,
          completedAt,
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
      } catch {
        // ignore storage quota errors
      }
    },
    [trackId]
  );

  // Natural timer while taking the exam
  useEffect(() => {
    if (step !== "exam") return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Compute Diagnostic Results
  const results = useMemo(() => {
    const dimTotals: Record<SkillDimensionKey, { correct: number; total: number }> = {
      conceptual: { correct: 0, total: 0 },
      applied: { correct: 0, total: 0 },
      logic: { correct: 0, total: 0 },
      accuracy: { correct: 0, total: 0 },
      expression: { correct: 0, total: 0 },
    };

    let correctCount = 0;
    for (const q of activeTrack.questions) {
      dimTotals[q.dimension].total += 1;
      if (answers[q.id] === q.correctIndex) {
        correctCount += 1;
        dimTotals[q.dimension].correct += 1;
      }
    }

    const totalQuestions = activeTrack.questions.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const tier = classifyScoreTier(scorePercent);

    const skillBreakdown: Record<SkillDimensionKey, number> = {
      conceptual: dimTotals.conceptual.total
        ? Math.round((dimTotals.conceptual.correct / dimTotals.conceptual.total) * 100)
        : 0,
      applied: dimTotals.applied.total
        ? Math.round((dimTotals.applied.correct / dimTotals.applied.total) * 100)
        : 0,
      logic: dimTotals.logic.total
        ? Math.round((dimTotals.logic.correct / dimTotals.logic.total) * 100)
        : 0,
      accuracy: dimTotals.accuracy.total
        ? Math.round((dimTotals.accuracy.correct / dimTotals.accuracy.total) * 100)
        : 0,
      expression: dimTotals.expression.total
        ? Math.round((dimTotals.expression.correct / dimTotals.expression.total) * 100)
        : 0,
    };

    const matched = courses.filter((c) => c.tierMatch === tier);
    const recommendedCourses = (matched.length ? matched : []).slice(0, 2);

    return {
      correctCount,
      totalQuestions,
      scorePercent,
      tier,
      tierInfo: TIER_MATRIX[tier],
      skillBreakdown,
      recommendedCourses,
    };
  }, [activeTrack, answers, courses]);

  function startTrack(selectedId: string) {
    setTrackId(selectedId);
    setAnswers({});
    setCurrentIndex(0);
    setElapsedSeconds(0);
    setStep("exam");
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          trackId: selectedId,
          answers: {},
          currentIndex: 0,
          elapsedSeconds: 0,
        })
      );
    } catch {
      // ignore
    }
  }

  function handleSelectOption(questionId: string, optionIdx: number) {
    const updated = { ...answers, [questionId]: optionIdx };
    setAnswers(updated);
    persistState(updated, currentIndex, elapsedSeconds);
  }

  function handleNextOrFinish() {
    if (currentIndex < activeTrack.questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      persistState(answers, nextIdx, elapsedSeconds);
    } else {
      persistState(answers, currentIndex, elapsedSeconds, new Date().toISOString());
      if (authUser) {
        setStep("enrichment");
      } else {
        setStep("oauth_gate");
      }
    }
  }

  async function handleGoogleOAuth() {
    setOauthError(null);
    persistState(answers, currentIndex, elapsedSeconds, new Date().toISOString());

    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/mock-exam`,
          scopes: "openid email profile",
        },
      });
      if (error) {
        setOauthError(error.message);
      }
      return;
    }

    // Demo fallback when Supabase env vars are not yet configured
    setAuthUser({
      fullName: "ผู้ปกครอง (Demo Gmail Account)",
      email: "parent.demo@gmail.com",
      isDemo: true,
    });
    setStep("enrichment");
  }

  async function handleEnrichmentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector(":invalid") as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }

    setSubmittingLead(true);
    setLeadError(null);
    const fd = new FormData(form);

    try {
      const res = await fetch("/api/leads/mock-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: activeTrack.id,
          trackLabel: activeTrack.title,
          totalQuestions: results.totalQuestions,
          correctCount: results.correctCount,
          scorePercent: results.scorePercent,
          tier: results.tier,
          skillBreakdown: results.skillBreakdown,
          recommendedCourseIds: results.recommendedCourses.map((c) => c.id),
          fullName: authUser?.fullName || "ผู้ปกครอง",
          email: authUser?.email || "",
          phone: fd.get("phone"),
          lineId: fd.get("lineId"),
          pdpaConsent: fd.get("pdpaConsent") === "on",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถบันทึกผลสอบได้");
      }

      setWebhookStatus(
        data.webhookDispatched
          ? "แจ้งเตือนทีมแนะแนวแบบ Real-Time สำเร็จ"
          : "บันทึกผลสอบและแผนการเรียนในระบบเรียบร้อย"
      );
      setStep("results");
    } catch (err) {
      setLeadError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งข้อมูล"
      );
    } finally {
      setSubmittingLead(false);
    }
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const currentQuestion = activeTrack.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round(
    ((currentIndex + 1) / activeTrack.questions.length) * 100
  );

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      {/* Progress Tracker Header */}
      <div className="pb-6 hairline-b mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-mono-tech text-sm text-[#1E5079]">
            Somkid+ Diagnostic Mock Exam
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-[#0F2A42] mt-1">
            ระบบสอบจำลองวัดระดับความสามารถ 5 มิติ
          </h1>
        </div>
        <ol className="flex items-center gap-2 font-mono-tech text-sm">
          <li
            className={`px-2.5 py-1 border ${
              step === "select" || step === "exam"
                ? "border-[#1E5079] bg-[#1E5079] text-white"
                : "border-[#D3DEE8] text-[#5A6F83]"
            }`}
          >
            01 สอบจำลอง
          </li>
          <li
            className={`px-2.5 py-1 border ${
              step === "oauth_gate"
                ? "border-[#1E5079] bg-[#1E5079] text-white"
                : "border-[#D3DEE8] text-[#5A6F83]"
            }`}
          >
            02 Gmail
          </li>
          <li
            className={`px-2.5 py-1 border ${
              step === "enrichment"
                ? "border-[#1E5079] bg-[#1E5079] text-white"
                : "border-[#D3DEE8] text-[#5A6F83]"
            }`}
          >
            03 รับสิทธิ์ PDF
          </li>
          <li
            className={`px-2.5 py-1 border ${
              step === "results"
                ? "border-[#1E5079] bg-[#1E5079] text-white"
                : "border-[#D3DEE8] text-[#5A6F83]"
            }`}
          >
            04 ผลวิเคราะห์
          </li>
        </ol>
      </div>

      {/* STEP 1A: Track Selection (Zero-Friction Start) */}
      {step === "select" && (
        <section className="space-y-8">
          <div className="bg-white border border-[#D3DEE8] p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-[#0F2A42]">
              เลือกชุดข้อสอบวัดระดับตามวิชาและช่วงชั้น (เริ่มทำได้ทันที ไม่ต้องลงทะเบียนก่อน)
            </h2>
            <p className="text-sm text-[#5A6F83] mt-1">
              ประเมินจาก 5 ทักษะหลัก · เลือกวิชาด้านล่าง
            </p>
          </div>

          <div className="divide-y divide-[#D3DEE8] border-t border-b border-[#D3DEE8]">
            {tracks.map((track) => (
              <article
                key={track.id}
                className="py-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
              >
                <div className="md:col-span-3">
                  <span className="font-mono-tech text-sm text-[#1E5079]">
                    {track.subjectLabel}
                  </span>
                  <p className="font-semibold text-[#0B7490] text-sm mt-1">
                    ระดับ: {track.gradeLabel}
                  </p>
                  <p className="font-mono-tech text-sm text-[#5A6F83] mt-1">
                    {track.questions.length} ข้อ · {track.durationMinutes} นาที
                  </p>
                </div>
                <div className="md:col-span-6">
                  <h3 className="font-display text-2xl text-[#0F2A42]">
                    {track.title}
                  </h3>
                  <p className="text-sm text-[#2B4660] mt-1">
                    {track.description}
                  </p>
                </div>
                <div className="md:col-span-3 flex md:justify-end">
                  <button
                    type="button"
                    onClick={() => startTrack(track.id)}
                    className="w-full md:w-auto bg-[#1E5079] hover:bg-[#143E61] text-white font-semibold px-6 py-3.5 text-sm transition-colors"
                  >
                    เริ่มทำข้อสอบชุดนี้ →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* STEP 1B: Active Mock Exam */}
      {step === "exam" && currentQuestion && (
        <section className="bg-white border border-[#D3DEE8] p-6 sm:p-10 space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech text-[#5A6F83]">
              <span>
                {activeTrack.title} · ข้อที่ {currentIndex + 1} /{" "}
                {activeTrack.questions.length}
              </span>
              <span>
                มิติที่ประเมิน: {SKILL_DIMENSION_LABELS[currentQuestion.dimension]} · เวลา{" "}
                {formatTimer(elapsedSeconds)}
              </span>
            </div>
            {/* CI Cyan Progress Bar */}
            <div className="w-full h-2 bg-[#F2F6F9]">
              <div
                className="h-full bg-[#00D1FF] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <fieldset className="space-y-5">
            <legend className="font-editorial text-xl sm:text-2xl text-[#0F2A42] leading-relaxed">
              {currentIndex + 1}. {currentQuestion.prompt}
            </legend>

            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = answers[currentQuestion.id] === idx;
                return (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                      isSelected
                        ? "border-[#1E5079] bg-[#F2F6F9] font-medium"
                        : "border-[#D3DEE8] bg-white hover:bg-[#F2F6F9]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      checked={isSelected}
                      onChange={() => handleSelectOption(currentQuestion.id, idx)}
                      className="mt-1 w-4 h-4 accent-[#1E5079]"
                    />
                    <span className="text-sm sm:text-base text-[#0F2A42]">
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="pt-6 hairline-t flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="px-5 py-3 border border-[#D3DEE8] text-sm font-medium text-[#0F2A42] disabled:opacity-40"
            >
              ← ข้อก่อนหน้า
            </button>

            <span className="font-mono-tech text-sm text-[#5A6F83]">
              ตอบแล้ว {answeredCount}/{activeTrack.questions.length} ข้อ
            </span>

            <button
              type="button"
              disabled={answers[currentQuestion.id] === undefined}
              onClick={handleNextOrFinish}
              className="px-6 py-3 bg-[#1E5079] hover:bg-[#143E61] disabled:opacity-40 text-white text-sm font-semibold transition-colors"
            >
              {currentIndex < activeTrack.questions.length - 1
                ? "ข้อถัดไป →"
                : "ส่งคำตอบและประมวลผลคะแนน →"}
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: Google OAuth Gate */}
      {step === "oauth_gate" && (
        <section className="bg-white border border-[#D3DEE8] p-8 sm:p-12 max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <span className="font-mono-tech text-sm text-[#188038] font-semibold">
              Assessment Complete · {answeredCount}/{activeTrack.questions.length} Questions
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-[#0F2A42]">
              ประมวลผลคะแนนและแผนการเรียนของคุณเสร็จสิ้น
            </h2>
            <p className="text-sm sm:text-base text-[#2B4660] leading-relaxed">
              เข้าสู่ระบบด้วยบัญชี Gmail เพียงคลิกเดียวเพื่อปลดล็อกผลวิเคราะห์ทักษะ 5 มิติ
              และบันทึกผลสอบไว้ในโปรไฟล์ผู้เรียนโดยไม่ต้องตั้งรหัสผ่านใหม่
              (ขอสิทธิ์เฉพาะชื่อและอีเมลเท่านั้น)
            </p>
          </div>

          {oauthError && (
            <div
              role="alert"
              className="p-4 bg-[#fdf2f2] border-l-4 border-[#B31B1B] text-[#B31B1B] text-sm space-y-1"
            >
              <p className="font-semibold">ไม่สามารถเข้าสู่ระบบ Google ได้</p>
              <p className="text-xs">{oauthError}</p>
            </div>
          )}

          {authUser ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-4 bg-[#F2F6F9] border border-[#D3DEE8]">
                {authUser.avatarUrl ? (
                  <img
                    src={authUser.avatarUrl}
                    alt={authUser.fullName}
                    className="w-12 h-12 rounded-full border border-[#D3DEE8] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#1E5079] text-white font-bold flex items-center justify-center text-base">
                    {authUser.fullName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F2A42] truncate">
                    {authUser.fullName}
                  </p>
                  <p className="text-xs text-[#5A6F83] truncate">{authUser.email}</p>
                  <p className="text-[11px] text-[#188038] font-medium mt-0.5">
                    เข้าสู่ระบบด้วย Google เรียบร้อยแล้ว
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep("enrichment")}
                  className="flex-1 bg-[#1E5079] hover:bg-[#143E61] text-white font-semibold py-3.5 px-6 text-sm transition-colors text-center"
                >
                  ดำเนินการต่อด้วยบัญชีนี้ →
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-3.5 border border-[#D3DEE8] text-[#5A6F83] hover:text-[#B31B1B] text-sm font-medium transition-colors"
                >
                  เปลี่ยนบัญชี
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={handleGoogleOAuth}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#F7F9FB] border-2 border-[#1E5079] text-[#0F2A42] font-semibold py-4 px-6 text-base transition-all shadow-sm hover:shadow"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.25 21.37 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
                  />
                </svg>
                <span>ดำเนินการต่อด้วย Google (Gmail) เพื่อดูผลวิเคราะห์</span>
              </button>
              {!supabaseConfigured && (
                <p className="font-mono-tech text-sm text-[#5A6F83] text-center">
                  Demo Mode: ยังไม่ได้ตั้งค่า Supabase URL — คลิกปุ่มด้านบนเพื่อจำลองการล็อกอิน Gmail และทดสอบขั้นตอนถัดไปได้ทันที
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-[#5A6F83] hairline-t pt-4">
            Somkid+ ปฏิบัติตามมาตรฐาน Google OAuth 2.0 และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA){" "}
            <Link href="/privacy-policy" className="underline text-[#1E5079]">
              อ่านนโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </section>
      )}

      {/* STEP 3: Contact Enrichment (Progressive Profiling) */}
      {step === "enrichment" && (
        <section className="bg-white border border-[#D3DEE8] p-8 sm:p-10 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4 pb-5 hairline-b">
            <div className="flex items-center gap-3 min-w-0">
              {authUser?.avatarUrl ? (
                <img
                  src={authUser.avatarUrl}
                  alt={authUser.fullName}
                  className="w-11 h-11 rounded-full border border-[#D3DEE8] object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#E0F8FF] text-[#1E5079] font-bold flex items-center justify-center text-sm shrink-0">
                  {authUser?.fullName?.charAt(0) || "G"}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[#0F2A42] leading-tight truncate">
                  {authUser?.fullName}
                </p>
                <p className="text-xs text-[#5A6F83] truncate">
                  {authUser?.email} · ยืนยันผ่าน Google แล้ว
                </p>
              </div>
            </div>
            {!authUser?.isDemo && (
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-[#5A6F83] hover:text-[#B31B1B] underline font-medium shrink-0"
              >
                เปลี่ยนบัญชี
              </button>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-2xl sm:text-3xl text-[#0F2A42]">
              กรอกเบอร์ติดต่อเพื่อรับไฟล์ PDF วิเคราะห์ผลและคูปองส่วนลดค่าเรียน
            </h2>
            <p className="text-sm text-[#5A6F83]">
              ขั้นตอนสุดท้ายก่อนแสดงผลคะแนนรวม กราฟ Radar Chart 5 มิติ และคอร์สที่แนะนำเฉพาะบุคคล
            </p>
          </div>

          <form onSubmit={handleEnrichmentSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="enrich-phone"
                className="block text-sm font-medium text-[#0F2A42] mb-1.5"
              >
                เบอร์โทรศัพท์ผู้ปกครอง <span aria-hidden="true">*</span>
              </label>
              <input
                id="enrich-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                autoFocus
                pattern="[0-9\-\s\+]{9,15}"
                className="somkid-input"
                placeholder="08X-XXX-XXXX"
              />
              <span className="field-error">
                กรุณากรอกเบอร์โทรศัพท์ 9–10 หลักให้ถูกต้อง
              </span>
            </div>

            <div>
              <label
                htmlFor="enrich-line"
                className="block text-sm font-medium text-[#0F2A42] mb-1.5"
              >
                LINE ID (สำหรับส่งไฟล์ PDF วิเคราะห์ผลสอบฉบับเต็ม)
              </label>
              <input
                id="enrich-line"
                name="lineId"
                type="text"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className="somkid-input"
                placeholder="@lineid"
              />
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input
                id="enrich-pdpa"
                name="pdpaConsent"
                type="checkbox"
                required
                className="mt-1 w-5 h-5 accent-[#1E5079] shrink-0"
              />
              <label
                htmlFor="enrich-pdpa"
                className="text-xs text-[#2B4660] leading-relaxed"
              >
                ยินยอมรับไฟล์ PDF วิเคราะห์ผลสอบ คูปองส่วนลดค่าเรียน และข้อมูลแนะนำหลักสูตรจากเจ้าหน้าที่ Somkid+ ตาม{" "}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  className="underline text-[#1E5079]"
                >
                  นโยบายความเป็นส่วนตัว (PDPA)
                </Link>
              </label>
            </div>

            {leadError && (
              <div
                role="alert"
                className="text-sm text-[#B31B1B] bg-[#fdf2f2] border border-[#B31B1B] px-4 py-3"
              >
                {leadError}
              </div>
            )}

            <button
              type="submit"
              disabled={submittingLead}
              className="w-full bg-[#1E5079] hover:bg-[#143E61] disabled:opacity-60 text-white font-semibold py-4 px-6 text-base transition-colors"
            >
              {submittingLead
                ? "กำลังสร้างรายงานผลวิเคราะห์..."
                : "ปลดล็อกผลคะแนนและแผนการเรียน 5 มิติ →"}
            </button>
          </form>
        </section>
      )}

      {/* STEP 4: Smart Recommendation & Radar Dashboard */}
      {step === "results" && (
        <div className="space-y-12">
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-[#D3DEE8] p-6 sm:p-10">
            <div className="lg:col-span-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-tech text-sm px-2.5 py-1 bg-[#1E5079] text-white">
                  {results.tierInfo.labelEn}
                </span>
                <span className="font-mono-tech text-sm px-2.5 py-1 bg-[#F2F6F9] text-[#0B7490]">
                  ช่วงคะแนน {results.tierInfo.rangeLabel}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  {authUser?.avatarUrl ? (
                    <img
                      src={authUser.avatarUrl}
                      alt={authUser.fullName}
                      className="w-10 h-10 rounded-full border border-[#D3DEE8] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#E0F8FF] text-[#1E5079] font-bold flex items-center justify-center text-sm">
                      {authUser?.fullName?.charAt(0) || "G"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#0F2A42]">
                      {authUser?.fullName}
                    </p>
                    <p className="text-xs text-[#5A6F83]">
                      {authUser?.email} · {activeTrack.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline gap-4 mt-2">
                  <span className="font-display text-6xl text-[#0F2A42]">
                    {results.scorePercent}%
                  </span>
                  <span className="font-mono-tech text-sm text-[#5A6F83]">
                    ({results.correctCount}/{results.totalQuestions} ข้อ · ใช้เวลา{" "}
                    {formatTimer(elapsedSeconds)})
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-[#1E5079] mt-2">
                  ระดับ: {results.tierInfo.labelTh}
                </h2>
              </div>

              <p className="text-sm sm:text-base text-[#2B4660] leading-relaxed">
                {results.tierInfo.summary}
              </p>

              <div className="bg-[#F2F6F9] p-4 border-l-4 border-[#1E5079] text-xs text-[#2B4660] space-y-1">
                <p className="font-semibold text-[#0F2A42]">
                  สิทธิพิเศษและขั้นตอนถัดไป ({webhookStatus})
                </p>
                <p>{results.tierInfo.adminAction}</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      sessionStorage.removeItem(SESSION_KEY);
                    } catch {}
                    setAnswers({});
                    setCurrentIndex(0);
                    setElapsedSeconds(0);
                    setStep("select");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#1E5079] text-[#1E5079] text-xs font-semibold hover:bg-[#E0F8FF] transition-colors"
                >
                  <span>← เลือกชุดข้อสอบวิชาอื่น</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#D3DEE8] text-[#5A6F83] text-xs font-medium hover:bg-[#F2F6F9] transition-colors"
                >
                  <span>🖨️ พิมพ์ผลวิเคราะห์</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col items-center justify-center lg:border-l lg:border-[#D3DEE8] lg:pl-8">
              <h3 className="font-mono-tech text-sm text-[#5A6F83] mb-2">
                5-Dimension Skill Profile
              </h3>
              <SkillRadarChart scores={results.skillBreakdown} size={310} />
              <div className="w-full grid grid-cols-2 gap-2 pt-4 hairline-t text-xs">
                {(Object.keys(results.skillBreakdown) as SkillDimensionKey[]).map(
                  (dim) => (
                    <div key={dim} className="flex justify-between">
                      <span className="text-[#5A6F83]">
                        {SKILL_DIMENSION_LABELS[dim]}
                      </span>
                      <span className="font-mono-tech font-semibold text-[#0F2A42]">
                        {results.skillBreakdown[dim]}%
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>

          {/* Auto-Matched Course Recommendations */}
          {results.recommendedCourses.length > 0 && (
          <section className="space-y-6">
            <div>
              <p className="font-mono-tech text-sm text-[#1E5079]">
                Recommended Pathways
              </p>
              <h2 className="font-display text-3xl text-[#0F2A42] mt-1">
                คอร์สเรียน Somkid+ ที่ระบบแนะนำตามผลคะแนนของคุณ
              </h2>
            </div>

            <div className="divide-y divide-[#D3DEE8] border-t border-b border-[#D3DEE8]">
              {results.recommendedCourses.map((course) => (
                <article
                  key={course.id}
                  className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
                >
                  <div className="lg:col-span-8 space-y-1.5">
                    <div className="flex items-center gap-2 font-mono-tech text-sm text-[#1E5079]">
                      <span>{course.code}</span>
                      <span>·</span>
                      <span>{course.gradeRange}</span>
                      <span>·</span>
                      <span>{course.schedule}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-[#0F2A42]">
                      {course.title}
                    </h3>
                    <p className="text-sm text-[#5A6F83]">{course.subtitle}</p>
                  </div>
                  <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEnrollCourse(course)}
                      className="bg-[#1E5079] hover:bg-[#143E61] text-white font-semibold px-5 py-3 text-sm transition-colors"
                    >
                      สมัครคอร์สนี้ทันที
                    </button>
                    <Link
                      href="/academics"
                      className="px-4 py-3 border border-[#0F2A42] text-sm font-medium text-[#0F2A42]"
                    >
                      ดูคอร์สทั้งหมด
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
          )}

          {/* Answer Key & Explanations */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-[#0F2A42]">
              เฉลยและคำอธิบายรายข้อ
            </h2>
            <div className="divide-y divide-[#D3DEE8] border-t border-b border-[#D3DEE8]">
              {activeTrack.questions.map((q, idx) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correctIndex;
                return (
                  <div key={q.id} className="py-4 space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#0F2A42]">
                        ข้อ {idx + 1}. {q.prompt}
                      </span>
                      <span
                        className={`font-mono-tech text-sm px-2 py-0.5 shrink-0 ${
                          isCorrect
                            ? "bg-[#e6f4ea] text-[#188038]"
                            : "bg-[#fdf2f2] text-[#B31B1B]"
                        }`}
                      >
                        {isCorrect ? "ถูกต้อง" : "ควรทบทวน"}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A6F83]">
                      คำตอบที่ถูกต้อง: <strong>{q.options[q.correctIndex]}</strong> —{" "}
                      {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <EnrollmentDialog
        open={Boolean(enrollCourse)}
        onClose={() => setEnrollCourse(null)}
        bookingType="enrollment"
        itemTitle={enrollCourse?.title ?? ""}
        itemCode={enrollCourse?.code}
        courseId={enrollCourse?.id}
      />
    </div>
  );
}
