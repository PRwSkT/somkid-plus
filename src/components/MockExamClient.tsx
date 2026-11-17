"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  SKILL_DIMENSION_LABELS,
  TIER_MATRIX,
  classifyScoreTier,
  type AcademicCourse,
  type DiagramType,
  type MockExamTrack,
  type MockQuestion,
  type SkillDimensionKey,
} from "@/data/somkid-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { SkillRadarChart } from "@/components/SkillRadarChart";
import { EnrollmentDialog } from "@/components/EnrollmentDialog";
import { MathText } from "@/components/MathText";

const SESSION_KEY = "somkid_mock_exam_v1";

type FunnelStep = "select" | "exam" | "oauth_gate" | "enrichment" | "results";

interface PersistedExamState {
  trackId: string;
  answers: Record<string, unknown>;
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

function isAnswerCorrect(q: MockQuestion, userVal: unknown): boolean {
  if (userVal === undefined || userVal === null) return false;
  const qType = q.type || "single_choice";

  if (qType === "single_choice" || qType === "true_false") {
    return userVal === q.correctIndex;
  }

  if (qType === "multiple_choice") {
    if (!Array.isArray(userVal)) return false;
    const target =
      q.correctIndices && q.correctIndices.length > 0
        ? q.correctIndices
        : [q.correctIndex ?? 0];
    if (userVal.length !== target.length) return false;
    const s1 = [...userVal].map(Number).sort();
    const s2 = [...target].map(Number).sort();
    return s1.every((v, i) => v === s2[i]);
  }

  if (qType === "numeric_input") {
    const raw = String(userVal).trim();
    if (!raw) return false;
    const expected = String(q.correctAnswer ?? "").trim();
    if (raw.toLowerCase() === expected.toLowerCase()) return true;
    if (
      q.acceptedAnswers &&
      q.acceptedAnswers.some(
        (a) => a.trim().toLowerCase() === raw.toLowerCase()
      )
    ) {
      return true;
    }
    const numUser = parseFloat(raw.replace(/,/g, ""));
    const numExp = parseFloat(expected.replace(/,/g, ""));
    if (!isNaN(numUser) && !isNaN(numExp) && Math.abs(numUser - numExp) < 0.001) {
      return true;
    }
    return false;
  }

  return false;
}

function isQuestionAnswered(q: MockQuestion, userVal: unknown): boolean {
  if (userVal === undefined || userVal === null) return false;
  const qType = q.type || "single_choice";
  if (qType === "single_choice" || qType === "true_false") {
    return typeof userVal === "number";
  }
  if (qType === "multiple_choice") {
    return Array.isArray(userVal) && userVal.length > 0;
  }
  if (qType === "numeric_input") {
    return typeof userVal === "string" && userVal.trim().length > 0;
  }
  return false;
}

function formatUserAnswer(q: MockQuestion, userVal: unknown): string {
  if (userVal === undefined || userVal === null) return "(ยังไม่ได้ตอบ)";
  const qType = q.type || "single_choice";
  if (qType === "true_false") {
    return userVal === 0 ? "จริง / ถูกต้อง" : "ไม่จริง / ผิด";
  }
  if (qType === "numeric_input") {
    return `${userVal} ${q.unit ?? ""}`.trim();
  }
  if (qType === "multiple_choice") {
    if (!Array.isArray(userVal)) return String(userVal);
    return userVal
      .map((i) => q.options?.[Number(i)] ?? `ตัวเลือก ${Number(i) + 1}`)
      .join(", ");
  }
  return typeof userVal === "number"
    ? q.options?.[userVal] ?? `ตัวเลือก ${userVal + 1}`
    : String(userVal);
}

function formatCorrectAnswer(q: MockQuestion): string {
  const qType = q.type || "single_choice";
  if (qType === "true_false") {
    return q.correctIndex === 0 ? "จริง / ถูกต้อง" : "ไม่จริง / ผิด";
  }
  if (qType === "numeric_input") {
    return `${q.correctAnswer ?? "-"} ${q.unit ?? ""}`.trim();
  }
  if (qType === "multiple_choice") {
    const target =
      q.correctIndices && q.correctIndices.length > 0
        ? q.correctIndices
        : [q.correctIndex ?? 0];
    return target
      .map((i) => q.options?.[i] ?? `ตัวเลือก ${i + 1}`)
      .join(", ");
  }
  return q.options?.[q.correctIndex ?? 0] ?? "-";
}

function QuestionDiagram({ type }: { type?: DiagramType }) {
  if (!type || type === "none") return null;

  if (type === "bar_model") {
    return (
      <div className="bg-[#F7F9FB] border border-[#D3DEE8] p-4 rounded-sm my-3">
        <p className="text-xs font-mono-tech text-[#1E5079] mb-2 font-semibold">
          Bar Model (แบบจำลองแท่งสัดส่วนเศษส่วน):
        </p>
        <svg viewBox="0 0 500 135" className="w-full max-w-lg h-auto mx-auto select-none" fill="none">
          <rect x="20" y="32" width="460" height="48" rx="4" fill="#FFFFFF" stroke="#0F2A42" strokeWidth="2" />
          <rect x="20" y="32" width="276" height="48" fill="#00D1FF" fillOpacity="0.25" stroke="#00C7FF" strokeWidth="2" />
          {[1, 2, 3, 4].map((i) => (
            <line key={i} x1={20 + i * 92} y1="32" x2={20 + i * 92} y2="80" stroke="#0F2A42" strokeWidth="1.5" strokeDasharray="3 3" />
          ))}
          <path d="M 22 26 Q 158 15 294 26" fill="none" stroke="#0094B8" strokeWidth="1.5" />
          <text x="158" y="13" fill="#007A99" fontSize="12" fontWeight="bold" textAnchor="middle">มีน้ำอยู่ 3/5 ของถัง</text>
          <path d="M 298 87 Q 390 98 478 87" fill="none" stroke="#D9381E" strokeWidth="1.5" />
          <text x="388" y="115" fill="#B31B1B" fontSize="12" fontWeight="bold" textAnchor="middle">เติมเพิ่มอีก 24 ลิตร (2/5)</text>
          {[0, 1, 2, 3, 4].map((i) => (
            <text key={i} x={20 + i * 92 + 46} y="61" fill="#0F2A42" fontSize="12" fontWeight="600" textAnchor="middle">1/5</text>
          ))}
        </svg>
      </div>
    );
  }

  if (type === "geometry_triangle") {
    return (
      <div className="bg-[#F7F9FB] border border-[#D3DEE8] p-4 rounded-sm my-3">
        <p className="text-xs font-mono-tech text-[#1E5079] mb-2 font-semibold">
          แผนภาพเรขาคณิตสามเหลี่ยมมุมฉาก:
        </p>
        <svg viewBox="0 0 360 160" className="w-full max-w-md h-auto mx-auto select-none" fill="none">
          <polygon points="50,130 290,130 50,30" fill="#E0F8FF" fillOpacity="0.5" stroke="#1E5079" strokeWidth="2.5" />
          <rect x="50" y="112" width="18" height="18" fill="none" stroke="#1E5079" strokeWidth="1.5" />
          <text x="170" y="148" fill="#0F2A42" fontSize="12" fontWeight="bold" textAnchor="middle">ฐาน = 14 ซม.</text>
          <text x="32" y="85" fill="#0F2A42" fontSize="12" fontWeight="bold" textAnchor="end">สูง = 9 ซม.</text>
          <circle cx="50" cy="130" r="3" fill="#1E5079" />
          <circle cx="290" cy="130" r="3" fill="#1E5079" />
          <circle cx="50" cy="30" r="3" fill="#1E5079" />
        </svg>
      </div>
    );
  }

  if (type === "science_beaker") {
    return (
      <div className="bg-[#F7F9FB] border border-[#D3DEE8] p-4 rounded-sm my-3">
        <p className="text-xs font-mono-tech text-[#1E5079] mb-2 font-semibold">
          กระบอกตวงวัดปริมาตรของเหลว (Graduated Cylinder):
        </p>
        <svg viewBox="0 0 260 180" className="w-full max-w-xs h-auto mx-auto select-none" fill="none">
          <rect x="100" y="20" width="60" height="140" rx="3" fill="#FFFFFF" stroke="#0F2A42" strokeWidth="2" />
          <rect x="80" y="155" width="100" height="10" rx="2" fill="#5A6F83" />
          <rect x="101" y="66" width="58" height="93" fill="#00D1FF" fillOpacity="0.35" />
          <path d="M 101 66 Q 130 69 159 66" fill="none" stroke="#0094B8" strokeWidth="2" />
          {[100, 80, 60, 40, 20].map((ml, idx) => {
            const y = 25 + idx * 26;
            return (
              <g key={ml}>
                <line x1="145" y1={y} x2="160" y2={y} stroke="#0F2A42" strokeWidth="1.5" />
                <text x="175" y={y + 4} fill="#5A6F83" fontSize="10" fontFamily="monospace">{ml}</text>
              </g>
            );
          })}
          <line x1="75" y1="66" x2="98" y2="66" stroke="#D9381E" strokeWidth="1.5" strokeDasharray="2 2" />
          <text x="70" y="69" fill="#B31B1B" fontSize="11" fontWeight="bold" textAnchor="end">ระดับของเหลว</text>
        </svg>
      </div>
    );
  }

  if (type === "circuit") {
    return (
      <div className="bg-[#F7F9FB] border border-[#D3DEE8] p-4 rounded-sm my-3">
        <p className="text-xs font-mono-tech text-[#1E5079] mb-2 font-semibold">
          แผนผังวงจรไฟฟ้าอย่างง่าย (Electrical Circuit):
        </p>
        <svg viewBox="0 0 340 140" className="w-full max-w-sm h-auto mx-auto select-none" fill="none">
          <rect x="40" y="25" width="260" height="90" fill="none" stroke="#0F2A42" strokeWidth="2" />
          <rect x="150" y="20" width="40" height="10" fill="#FFFFFF" />
          <line x1="160" y1="18" x2="160" y2="32" stroke="#1E5079" strokeWidth="3" />
          <line x1="175" y1="21" x2="175" y2="29" stroke="#1E5079" strokeWidth="1.5" />
          <text x="153" y="14" fill="#0F2A42" fontSize="10" fontWeight="bold">+</text>
          <text x="180" y="14" fill="#0F2A42" fontSize="10" fontWeight="bold">−</text>
          <circle cx="170" cy="115" r="14" fill="#FFF9D2" stroke="#0F2A42" strokeWidth="2" />
          <line x1="163" y1="108" x2="177" y2="122" stroke="#D97706" strokeWidth="1.5" />
          <line x1="163" y1="122" x2="177" y2="108" stroke="#D97706" strokeWidth="1.5" />
          <rect x="295" y="55" width="10" height="30" fill="#FFFFFF" />
          <circle cx="300" cy="55" r="3" fill="#0F2A42" />
          <circle cx="300" cy="85" r="3" fill="#0F2A42" />
          <line x1="300" y1="85" x2="315" y2="60" stroke="#B31B1B" strokeWidth="2" />
          <text x="325" y="75" fill="#B31B1B" fontSize="10" fontWeight="bold">สวิตช์เปิด (Open)</text>
        </svg>
      </div>
    );
  }

  return null;
}

function PassageCard({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <div className="bg-[#F8FAFC] border-l-4 border-[#1E5079] p-4 text-[#2B4660] text-sm leading-relaxed my-3 space-y-1">
      <div className="text-xs font-mono-tech text-[#1E5079] font-bold uppercase tracking-wider">
        <span>บริบท / สถานการณ์ประกอบโจทย์ (Passage Context)</span>
      </div>
      <MathText text={text} as="p" className="whitespace-pre-line text-sm text-[#0F2A42] font-serif" />
    </div>
  );
}

function HintBox({ hint }: { hint?: string }) {
  const [open, setOpen] = useState(false);
  if (!hint) return null;
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs text-[#0B7490] hover:text-[#085468] font-medium transition-colors cursor-pointer"
      >
        <span>{open ? "▲ ซ่อนคำใบ้แนวคิด" : "คำใบ้แนวคิด (คลิกเพื่อแสดง)"}</span>
      </button>
      {open && (
        <div className="mt-2 p-3 bg-[#E0F8FF]/50 border border-[#00D1FF]/40 rounded-sm text-xs text-[#0F2A42] leading-relaxed">
          <strong className="text-[#0B7490]">แนวคิดเบื้องต้น: </strong>
          <MathText text={hint} />
        </div>
      )}
    </div>
  );
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
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
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
        const raw =
          localStorage.getItem(SESSION_KEY) ||
          sessionStorage.getItem(SESSION_KEY);
        if (raw) {
          restored = JSON.parse(raw) as PersistedExamState;
        }
      } catch {
        // ignore malformed storage
      }

      if (!restored && typeof document !== "undefined") {
        const match = document.cookie.match(/sk_exam_backup=([^;]+)/);
        if (match) {
          try {
            restored = JSON.parse(
              decodeURIComponent(match[1])
            ) as PersistedExamState;
          } catch {
            // ignore
          }
        }
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

      const hasAnswers =
        Boolean(restored?.answers) &&
        Object.keys(restored?.answers || {}).length > 0;
      const isFinished = Boolean(
        restored?.completedAt ||
          (restored?.answers &&
            Object.keys(restored.answers).length >= 6)
      );

      // 1. Check direct Google OAuth session first (somkidplus project)
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (active && meData.authenticated && meData.user) {
            setAuthUser({
              fullName:
                meData.user.name ||
                meData.user.email?.split("@")[0] ||
                "ผู้ปกครอง Somkid+",
              email: meData.user.email || "",
              avatarUrl: meData.user.picture || undefined,
              isDemo: false,
            });

            // Show results immediately if answers exist, or let them resume
            if (isFinished || hasAnswers) {
              setStep("results");
            }
            return;
          }
        }
      } catch {
        // ignore network error
      }

      // 2. Check Supabase auth session as fallback
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
          if (isFinished || hasAnswers) {
            setStep("results");
          }
        } else if (isFinished) {
          setStep("oauth_gate");
        } else if (hasAnswers) {
          setStep("exam");
        }
      } else if (isFinished) {
        setStep("oauth_gate");
      } else if (hasAnswers) {
        setStep("exam");
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setAuthUser(null);
    setStep("oauth_gate");
  }

  // Persist exam progress on changes (multi-layer: localStorage + sessionStorage + cookie backup)
  const persistState = useCallback(
    (
      nextAnswers: Record<string, unknown>,
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
        const raw = JSON.stringify(payload);
        localStorage.setItem(SESSION_KEY, raw);
        sessionStorage.setItem(SESSION_KEY, raw);
        if (typeof document !== "undefined") {
          document.cookie = `sk_exam_backup=${encodeURIComponent(
            raw
          )}; path=/; max-age=86400; SameSite=Lax`;
        }
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
      if (isAnswerCorrect(q, answers[q.id])) {
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

  function handleSelectOption(questionId: string, value: unknown) {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);
    persistState(updated, currentIndex, elapsedSeconds);
  }

  function handleNextOrFinish() {
    if (currentIndex < activeTrack.questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      persistState(answers, nextIdx, elapsedSeconds);
    } else {
      const completedAt = new Date().toISOString();
      persistState(answers, currentIndex, elapsedSeconds, completedAt);
      if (authUser) {
        setStep("results");
      } else {
        setStep("oauth_gate");
      }
    }
  }

  async function handleGoogleOAuth() {
    setOauthError(null);
    const completedAt = new Date().toISOString();
    persistState(answers, currentIndex, elapsedSeconds, completedAt);

    // Direct Google OAuth route using somkidplus credentials (no SV-Portal branding)
    window.location.href = `/api/auth/google?next=/mock-exam`;
  }

  function handleDemoContinue() {
    // Demo fallback for instant preview without live OAuth redirect
    setAuthUser({
      fullName: "ผู้ปกครอง (บัญชีทดสอบ สมคิดวิทยา)",
      email: "parent.demo@somkidvittaya.ac.th",
      isDemo: true,
    });
    setStep("results");
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
  const answeredCount = activeTrack.questions.filter((q) =>
    isQuestionAnswered(q, answers[q.id])
  ).length;
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
            {/* Question Badges & Tags */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
              {currentQuestion.topic && (
                <span className="px-2.5 py-1 bg-[#F2F6F9] border border-[#D3DEE8] text-xs font-medium text-[#1E5079]">
                  <span className="font-semibold">หัวข้อ:</span> {currentQuestion.topic}
                </span>
              )}
              {currentQuestion.difficulty && (
                <span
                  className={`px-2.5 py-1 text-xs font-medium ${
                    currentQuestion.difficulty === "foundation"
                      ? "bg-[#e6f4ea] text-[#188038]"
                      : currentQuestion.difficulty === "challenge"
                      ? "bg-[#fef7e0] text-[#b06000]"
                      : "bg-[#e8f0fe] text-[#1a73e8]"
                  }`}
                >
                  {currentQuestion.difficulty === "foundation"
                    ? "ระดับพื้นฐาน"
                    : currentQuestion.difficulty === "challenge"
                    ? "ระดับประยุกต์ท้าทาย (Challenge)"
                    : "ระดับปานกลาง"}
                </span>
              )}
              <span className="px-2.5 py-1 bg-[#F2F6F9] text-[#5A6F83] text-xs font-mono-tech border border-[#D3DEE8]">
                {currentQuestion.type === "multiple_choice"
                  ? "เลือกตอบได้หลายข้อ"
                  : currentQuestion.type === "numeric_input"
                  ? "อัตนัยเติมคำตอบตัวเลข"
                  : currentQuestion.type === "true_false"
                  ? "วิเคราะห์ถูก / ผิด"
                  : "ปรนัย 4 ตัวเลือก"}
              </span>
            </div>

            {/* Context Passage (if present) */}
            <PassageCard text={currentQuestion.contextPassage} />

            {/* Visual Vector Diagram (if present) */}
            <QuestionDiagram type={currentQuestion.diagramType} />

            {/* External Image (if present) */}
            {currentQuestion.imageUrl && (
              <div className="my-3 border border-[#D3DEE8] p-2 bg-[#F7F9FB] max-w-lg">
                <img
                  src={currentQuestion.imageUrl}
                  alt={`ภาพประกอบข้อ ${currentIndex + 1}`}
                  className="w-full h-auto object-contain"
                />
              </div>
            )}

            <legend className="font-editorial text-xl sm:text-2xl text-[#0F2A42] leading-relaxed">
              <span className="font-mono-tech mr-1">{currentIndex + 1}.</span>{" "}
              <MathText text={currentQuestion.prompt} as="span" />
            </legend>

            {/* Input by Question Type */}
            {currentQuestion.type === "multiple_choice" ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-[#0B7490] font-mono-tech">
                  <span>(เลือกได้มากกว่า 1 คำตอบ) ข้อนี้สามารถเลือกตัวเลือกที่ถูกต้องได้หลายข้อ</span>
                  <span>
                    เลือกแล้ว{" "}
                    {Array.isArray(answers[currentQuestion.id])
                      ? (answers[currentQuestion.id] as number[]).length
                      : 0}{" "}
                    ข้อ
                  </span>
                </div>
                {currentQuestion.options?.map((opt, idx) => {
                  const selectedList = (
                    Array.isArray(answers[currentQuestion.id])
                      ? answers[currentQuestion.id]
                      : []
                  ) as number[];
                  const isSelected = selectedList.includes(idx);
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
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          const nextList = isSelected
                            ? selectedList.filter((i) => i !== idx)
                            : [...selectedList, idx];
                          handleSelectOption(currentQuestion.id, nextList);
                        }}
                        className="mt-1 w-4 h-4 accent-[#1E5079] rounded"
                      />
                      <MathText
                        text={opt}
                        as="span"
                        className="text-sm sm:text-base text-[#0F2A42]"
                      />
                    </label>
                  );
                })}
              </div>
            ) : currentQuestion.type === "numeric_input" ? (
              <div className="space-y-4 pt-2">
                <p className="text-xs text-[#0B7490] font-mono-tech">
                  คำนวณผลลัพธ์แล้วพิมพ์คำตอบเป็นตัวเลขลงในช่องด้านล่าง
                </p>
                <div className="flex items-center gap-3 max-w-md">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="พิมพ์คำตอบที่คำนวณได้..."
                    value={
                      typeof answers[currentQuestion.id] === "string"
                        ? (answers[currentQuestion.id] as string)
                        : ""
                    }
                    onChange={(e) =>
                      handleSelectOption(currentQuestion.id, e.target.value)
                    }
                    className="w-full px-4 py-3.5 border-2 border-[#1E5079] text-xl font-mono-tech text-[#0F2A42] bg-white focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                  />
                  {currentQuestion.unit && (
                    <span className="px-4 py-3.5 bg-[#F2F6F9] border border-[#D3DEE8] text-[#0F2A42] font-semibold text-sm whitespace-nowrap">
                      {currentQuestion.unit}
                    </span>
                  )}
                </div>
              </div>
            ) : currentQuestion.type === "true_false" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  {
                    idx: 0,
                    label: "จริง (True)",
                    hoverColor: "hover:border-[#188038] hover:bg-[#e6f4ea]/40",
                  },
                  {
                    idx: 1,
                    label: "เท็จ (False)",
                    hoverColor: "hover:border-[#B31B1B] hover:bg-[#fdf2f2]/40",
                  },
                ].map((item) => {
                  const isSelected = answers[currentQuestion.id] === item.idx;
                  return (
                    <button
                      key={item.idx}
                      type="button"
                      onClick={() =>
                        handleSelectOption(currentQuestion.id, item.idx)
                      }
                      className={`p-6 border-2 text-center text-base sm:text-lg font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#1E5079] bg-[#1E5079] text-white shadow-sm"
                          : `border-[#D3DEE8] bg-white text-[#0F2A42] ${item.hoverColor}`
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {currentQuestion.options?.map((opt, idx) => {
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
                        onChange={() =>
                          handleSelectOption(currentQuestion.id, idx)
                        }
                        className="mt-1 w-4 h-4 accent-[#1E5079]"
                      />
                      <MathText
                        text={opt}
                        as="span"
                        className="text-sm sm:text-base text-[#0F2A42]"
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {/* Hint Drawer */}
            <HintBox hint={currentQuestion.hint} />
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
              disabled={!isQuestionAnswered(currentQuestion, answers[currentQuestion.id])}
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
                  onClick={() => setStep("results")}
                  className="flex-1 bg-[#1E5079] hover:bg-[#143E61] text-white font-semibold py-3.5 px-6 text-sm transition-colors text-center"
                >
                  ดูผลคะแนนและกราฟ 5 มิติทันที →
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
              <button
                type="button"
                onClick={handleDemoContinue}
                className="w-full text-center text-xs text-[#5A6F83] hover:text-[#1E5079] font-medium pt-2 transition-colors cursor-pointer"
              >
                หรือดูผลวิเคราะห์ทันทีโดยไม่ต้องล็อกอิน (โหมดทดสอบ) →
              </button>
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
                  <span>พิมพ์ผลวิเคราะห์</span>
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

          {/* Consultation & Full PDF Request Card */}
          <section className="bg-[#F8FAFC] border-2 border-[#1E5079] p-6 sm:p-8 space-y-4">
            <div className="max-w-3xl space-y-1">
              <span className="font-mono-tech text-xs text-[#0B7490] font-semibold uppercase tracking-wider">
                Full Diagnostic PDF & Academic Consultation
              </span>
              <h3 className="font-display text-2xl text-[#0F2A42]">
                รับไฟล์รายงานผลวิเคราะห์ 5 มิติฉบับสมบูรณ์ (PDF) และปรึกษาอาจารย์ Somkid+
              </h3>
              <p className="text-sm text-[#5A6F83]">
                กรอกเบอร์โทรศัพท์และ LINE ID เพื่อให้ทีมวิชาการจัดส่งรายงาน PDF ฉบับเต็ม พร้อมวิเคราะห์แผนการเรียนปิดจุดอ่อนเฉพาะบุคคล
              </p>
            </div>

            {webhookStatus ? (
              <div className="p-4 bg-[#e6f4ea] border-l-4 border-[#188038] text-[#188038] text-sm">
                <p className="font-semibold">บันทึกข้อมูลเรียบร้อยแล้ว</p>
                <p className="text-xs mt-0.5">{webhookStatus}</p>
              </div>
            ) : (
              <form onSubmit={handleEnrichmentSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
                <div className="sm:col-span-4">
                  <label htmlFor="res-phone" className="block text-xs font-semibold text-[#0F2A42] mb-1">
                    เบอร์โทรศัพท์ผู้ปกครอง *
                  </label>
                  <input
                    id="res-phone"
                    name="phone"
                    type="tel"
                    required
                    pattern="[0-9\-\s\+]{9,15}"
                    placeholder="08X-XXX-XXXX"
                    className="somkid-input text-sm py-2.5"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="res-line" className="block text-xs font-semibold text-[#0F2A42] mb-1">
                    LINE ID (สำหรับส่ง PDF)
                  </label>
                  <input
                    id="res-line"
                    name="lineId"
                    type="text"
                    placeholder="@lineid"
                    className="somkid-input text-sm py-2.5"
                  />
                </div>
                <div className="sm:col-span-4 flex items-end">
                  <button
                    type="submit"
                    disabled={submittingLead}
                    className="w-full bg-[#1E5079] hover:bg-[#143E61] disabled:opacity-60 text-white font-semibold py-2.5 px-4 text-sm transition-colors cursor-pointer"
                  >
                    {submittingLead ? "กำลังส่ง..." : "ส่งรายงานเข้า LINE →"}
                  </button>
                </div>
                <div className="sm:col-span-12 flex items-center gap-2 pt-1 text-xs text-[#5A6F83]">
                  <input id="res-pdpa" name="pdpaConsent" type="checkbox" required defaultChecked className="accent-[#1E5079]" />
                  <label htmlFor="res-pdpa">
                    ยินยอมให้ Somkid+ ติดต่อกลับเพื่อส่งผลสอบและให้คำปรึกษาตามนโยบาย PDPA
                  </label>
                </div>
                {leadError && (
                  <div className="sm:col-span-12 text-xs text-[#B31B1B] bg-[#fdf2f2] p-2 border border-[#B31B1B]">
                    {leadError}
                  </div>
                )}
              </form>
            )}
          </section>

          {/* Answer Key & Explanations */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-[#0F2A42]">
              เฉลยและคำอธิบายรายข้อ
            </h2>
            <div className="divide-y divide-[#D3DEE8] border-t border-b border-[#D3DEE8]">
              {activeTrack.questions.map((q, idx) => {
                const userAns = answers[q.id];
                const isCorrect = isAnswerCorrect(q, userAns);
                const userFormatted = formatUserAnswer(q, userAns);
                const correctFormatted = formatCorrectAnswer(q);
                return (
                  <div key={q.id} className="py-5 space-y-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#0F2A42]">
                          ข้อ {idx + 1}. <MathText text={q.prompt} as="span" />
                        </span>
                        {q.topic && (
                          <span className="text-xs px-2 py-0.5 bg-[#F2F6F9] text-[#1E5079] font-mono-tech border border-[#D3DEE8]">
                            {q.topic}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 font-mono-tech">
                          {q.type === "multiple_choice"
                            ? "เลือกตอบหลายข้อ"
                            : q.type === "numeric_input"
                            ? "อัตนัยเติมคำตอบ"
                            : q.type === "true_false"
                            ? "วิเคราะห์ถูก/ผิด"
                            : "ปรนัย"}
                        </span>
                      </div>
                      <span
                        className={`font-mono-tech text-xs px-2.5 py-1 font-semibold shrink-0 ${
                          isCorrect
                            ? "bg-[#e6f4ea] text-[#188038]"
                            : "bg-[#fdf2f2] text-[#B31B1B]"
                        }`}
                      >
                        {isCorrect ? "ถูกต้อง" : "ควรทบทวน"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#F7F9FB] p-3 border border-[#D3DEE8]">
                      <div>
                        <span className="text-[#5A6F83]">คำตอบของคุณ: </span>
                        <MathText
                          text={userFormatted}
                          as="strong"
                          className={
                            isCorrect ? "text-[#188038]" : "text-[#B31B1B]"
                          }
                        />
                      </div>
                      <div>
                        <span className="text-[#5A6F83]">คำตอบที่ถูกต้อง: </span>
                        <MathText
                          text={correctFormatted}
                          as="strong"
                          className="text-[#0F2A42]"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-[#2B4660] leading-relaxed pt-1">
                      <span className="font-semibold text-[#1E5079]">
                        แนวคิดเฉลย:
                      </span>{" "}
                      <MathText text={q.explanation} as="span" />
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
