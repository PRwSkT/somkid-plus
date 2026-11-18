import "server-only";
import { generateAnalysis, skillLabel, tierLabel, type AnalysisInput } from "@/lib/ai-analysis";
import { readContent } from "@/lib/content-store";
import { mailConfigured, sendMail } from "@/lib/mailer";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export interface LeadRecord extends AnalysisInput {
  fullName: string;
  email: string;
  phone: string;
  lineId: string;
  recommendedCourseIds: string[];
}

export function emailEnabled(): boolean {
  return mailConfigured();
}

function list(items: string[]): string {
  return `<ul style="margin:8px 0 0;padding-left:20px;color:#2B4660;line-height:1.7">${items
    .map((x) => `<li>${esc(x)}</li>`)
    .join("")}</ul>`;
}

function section(title: string, body: string): string {
  return `<h3 style="margin:22px 0 4px;font-size:16px;color:#0F2A42">${esc(title)}</h3>${body}`;
}

export async function sendParentResultEmail(rec: LeadRecord): Promise<boolean> {
  const [analysis, content] = await Promise.all([generateAnalysis(rec), readContent()]);
  const s = content.settings;
  const courses = content.courses.filter(
    (c) => c.published && rec.recommendedCourseIds.includes(c.id)
  );

  const bars = Object.entries(rec.skillBreakdown)
    .map(
      ([k, v]) => `<tr><td style="padding:4px 10px 4px 0;font-size:14px;color:#2B4660;white-space:nowrap">${esc(skillLabel(k))}</td>
<td style="width:100%"><div style="background:#E6EEF4;height:10px;border-radius:5px"><div style="background:#1E5079;height:10px;border-radius:5px;width:${Math.max(2, Math.min(100, v))}%"></div></div></td>
<td style="padding-left:10px;font-size:14px;color:#0F2A42">${v}%</td></tr>`
    )
    .join("");

  const courseHtml = courses.length
    ? section(
        "หลักสูตรที่เหมาะกับผลสอบนี้",
        list(courses.map((c) => `${c.title} (${c.gradeRange}, ${c.schedule})`))
      )
    : "";

  const html = `<div style="font-family:'Sukhumvit Set',Tahoma,Arial,sans-serif;max-width:620px;margin:auto;padding:24px;color:#0F2A42">
<div style="font-size:22px;font-weight:700;color:#1E5079">Somkid+</div>
<p style="margin:14px 0 0">เรียนคุณ ${esc(rec.fullName)}</p>
<p style="margin:6px 0 0;color:#2B4660">สรุปผลสอบวัดระดับ <b>${esc(rec.trackLabel)}</b> ของบุตรหลานของท่าน</p>
<div style="margin:18px 0;padding:16px;background:#F4F8FB;border-left:4px solid #1E5079">
<div style="font-size:30px;font-weight:700">${rec.scorePercent}%</div>
<div style="color:#2B4660">${rec.correctCount} จาก ${rec.totalQuestions} ข้อ | ${esc(tierLabel(rec.tier))}</div></div>
${section("คะแนนรายทักษะ", `<table style="width:100%;border-collapse:collapse;margin-top:6px">${bars}</table>`)}
${section("ภาพรวม", `<p style="margin:8px 0 0;color:#2B4660;line-height:1.7">${esc(analysis.overview)}</p>`)}
${section("จุดแข็ง", list(analysis.strengths))}
${section("จุดที่ควรพัฒนา", list(analysis.improvements))}
${section("แผนฝึก 4 สัปดาห์", list(analysis.plan))}
${section("คำแนะนำสำหรับผู้ปกครอง", list(analysis.parentTips))}
${courseHtml}
<div style="margin-top:26px;padding:16px;background:#E0F8FF">
<b>ต้องการปรึกษาอาจารย์หรือจองทดลองเรียน</b><br>
โทร ${esc(s.phone)}${s.lineId ? ` | LINE ${esc(s.lineId)}` : ""}</div>
<p style="margin-top:22px;font-size:12px;color:#5A6F83;line-height:1.6">${
    analysis.source === "ai"
      ? "คำแนะนำนี้จัดทำด้วยระบบ AI จากคะแนนที่ได้ เพื่อใช้ประกอบการวางแผนเท่านั้น ไม่ใช่การประเมินวุฒิภาวะหรือการรับประกันผลสอบจริง "
      : "คำแนะนำนี้จัดทำจากคะแนนที่ได้ เพื่อใช้ประกอบการวางแผนเท่านั้น "
  }อีเมลนี้ส่งตามที่ท่านยินยอมไว้ภายใต้นโยบาย PDPA ของ Somkid+</p></div>`;

  const text = [
    `Somkid+ สรุปผลสอบ ${rec.trackLabel}`,
    `คะแนน ${rec.scorePercent}% (${rec.correctCount}/${rec.totalQuestions}) ${tierLabel(rec.tier)}`,
    analysis.overview,
    `จุดแข็ง: ${analysis.strengths.join("; ")}`,
    `ควรพัฒนา: ${analysis.improvements.join("; ")}`,
    `แผน 4 สัปดาห์: ${analysis.plan.join(" | ")}`,
    `ติดต่อ ${s.phone}${s.lineId ? ` LINE ${s.lineId}` : ""}`,
  ].join("\n");

  return sendMail({
    to: rec.email,
    subject: `ผลวิเคราะห์ข้อสอบวัดระดับ ${rec.trackLabel} | Somkid+`,
    html,
    text,
    replyTo: s.email || undefined,
  });
}

export async function sendAdminNotification(
  subject: string,
  rows: Record<string, unknown>
): Promise<boolean> {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) return false;
  const body = Object.entries(rows)
    .filter(([, v]) => v !== "" && v !== undefined && v !== null)
    .map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)]);
  const html = `<div style="font-family:Tahoma,Arial,sans-serif;max-width:560px"><h3>${esc(subject)}</h3><table style="border-collapse:collapse">${body
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#5A6F83;vertical-align:top">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`
    )
    .join("")}</table><p style="color:#5A6F83;font-size:12px">ดูและอัปเดตสถานะที่ /admin/submissions</p></div>`;
  const text = `${subject}\n` + body.map(([k, v]) => `${k}: ${v}`).join("\n");
  return sendMail({ to, subject, html, text });
}
