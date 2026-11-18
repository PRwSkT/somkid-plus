import "server-only";
import { SKILL_DIMENSION_LABELS } from "@/data/somkid-data";

export interface AnalysisInput {
  trackLabel: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  tier: string;
  skillBreakdown: Record<string, number>;
}

export interface Analysis {
  overview: string;
  strengths: string[];
  improvements: string[];
  plan: string[];
  parentTips: string[];
  source: "ai" | "rules";
}

const EMOJI = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;
const clean = (s: unknown, max = 600) =>
  String(s ?? "").replace(EMOJI, "").replace(/\s+/g, " ").trim().slice(0, max);
const cleanList = (v: unknown, n: number) =>
  Array.isArray(v) ? v.map((x) => clean(x, 300)).filter(Boolean).slice(0, n) : [];

export function skillLabel(key: string): string {
  return SKILL_DIMENSION_LABELS[key] ?? key;
}

const TIER_TH: Record<string, string> = {
  foundation: "กลุ่มปูพื้นฐาน",
  accelerator: "กลุ่มเร่งพัฒนา",
  achiever: "กลุ่มก้าวหน้า",
};
export const tierLabel = (t: string) => TIER_TH[t] ?? t;

export function rulesAnalysis(i: AnalysisInput): Analysis {
  const sorted = Object.entries(i.skillBreakdown).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 2);
  const low = sorted.slice(-2).reverse();
  const tierText =
    i.tier === "achiever"
      ? "พื้นฐานแน่นและพร้อมต่อยอดโจทย์ระดับท้าทาย"
      : i.tier === "accelerator"
        ? "มีพื้นฐานที่ดี และเพิ่มคะแนนได้อีกมากหากฝึกเป็นระบบ"
        : "ควรเริ่มจากการปูพื้นฐานแนวคิดให้มั่นคงก่อนเพิ่มความยาก";
  return {
    overview: `ผลสอบ ${clean(i.trackLabel, 120)} ได้ ${i.correctCount} จาก ${i.totalQuestions} ข้อ (${i.scorePercent}%) จัดอยู่ใน${tierLabel(i.tier)} ${tierText}`,
    strengths: top.map(([k, v]) => `${skillLabel(k)} (${v}%)`),
    improvements: low.map(([k, v]) => `${skillLabel(k)} (${v}%)`),
    plan: [
      `สัปดาห์ที่ 1-2: ทบทวนแนวคิดของ${low[0] ? skillLabel(low[0][0]) : "หัวข้อที่ได้คะแนนน้อย"} วันละ 15-20 นาที`,
      `สัปดาห์ที่ 3: ฝึกโจทย์ผสมที่เชื่อม${low[1] ? skillLabel(low[1][0]) : "ทักษะที่เหลือ"} กับทักษะที่ถนัด`,
      "สัปดาห์ที่ 4: ทำข้อสอบจำลองซ้ำโดยจับเวลา แล้วเปรียบเทียบคะแนนกับครั้งนี้",
    ],
    parentTips: [
      "ให้ลูกอธิบายวิธีคิดด้วยตัวเอง แทนการบอกคำตอบ",
      "ชื่นชมกระบวนการแก้โจทย์ ไม่เน้นแค่คะแนน",
    ],
    source: "rules",
  };
}

export async function generateAnalysis(i: AnalysisInput): Promise<Analysis> {
  const key = process.env.GEMINI_API_KEY;
  const fallback = rulesAnalysis(i);
  if (!key) return fallback;

  const skills = Object.entries(i.skillBreakdown)
    .map(([k, v]) => `- ${skillLabel(k)}: ${v}%`)
    .join("\n");
  const prompt = `คุณคือที่ปรึกษาวิชาการของสถาบันกวดวิชา Somkid+ เขียนภาษาไทยที่สุภาพ กระชับ เป็นมืออาชีพ ห้ามใช้อีโมจิเด็ดขาด ห้ามรับประกันผลสอบหรือเปรียบเทียบกับเด็กคนอื่น ใช้เฉพาะข้อมูลด้านล่าง ห้ามแต่งตัวเลขเพิ่ม

ผลสอบวัดระดับ: ${clean(i.trackLabel, 120)}
คะแนนรวม: ${i.correctCount}/${i.totalQuestions} (${i.scorePercent}%) กลุ่ม: ${tierLabel(i.tier)}
คะแนนรายทักษะ:
${skills}

ตอบเป็น JSON เท่านั้น รูปแบบ:
{"overview":"สรุปภาพรวม 2-3 ประโยค","strengths":["2-3 ข้อ"],"improvements":["2-3 ข้อ พร้อมเหตุผลสั้นๆ"],"plan":["แผนฝึก 4 สัปดาห์ สัปดาห์ละ 1 ข้อ"],"parentTips":["2-3 ข้อสำหรับผู้ปกครอง"]}`;

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
            maxOutputTokens: 1500,
          },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );
    if (!res.ok) {
      console.error("Gemini analysis HTTP", res.status);
      return fallback;
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const out: Analysis = {
      overview: clean(parsed.overview, 700),
      strengths: cleanList(parsed.strengths, 4),
      improvements: cleanList(parsed.improvements, 4),
      plan: cleanList(parsed.plan, 5),
      parentTips: cleanList(parsed.parentTips, 4),
      source: "ai",
    };
    if (!out.overview || out.strengths.length === 0 || out.improvements.length === 0) {
      return fallback;
    }
    if (out.plan.length === 0) out.plan = fallback.plan;
    if (out.parentTips.length === 0) out.parentTips = fallback.parentTips;
    return out;
  } catch (err) {
    console.error("Gemini analysis failed:", err instanceof Error ? err.message : err);
    return fallback;
  }
}
