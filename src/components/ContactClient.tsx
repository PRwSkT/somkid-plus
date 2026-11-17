"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/data/somkid-data";
import { createClient } from "@/lib/supabase/client";

export function ContactClient({ settings }: { settings: SiteSettings }) {
  const [prefilledName, setPrefilledName] = useState("");
  const [prefilledEmail, setPrefilledEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setPrefilledName(
          (data.user.user_metadata?.full_name as string) || ""
        );
        setPrefilledEmail(data.user.email || "");
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector(":invalid") as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    const fd = new FormData(form);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType: "campus_visit",
          courseTitle: "นัดหมายเยี่ยมชมสถาบันและวางแผนการเรียน 1:1",
          studentName: fd.get("studentName"),
          gradeLevel: fd.get("gradeLevel"),
          parentName: fd.get("parentName"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          lineId: fd.get("lineId"),
          preferredDate: fd.get("preferredDate"),
          notes: fd.get("notes"),
          pdpaConsent: fd.get("pdpaConsent") === "on",
        }),
      });

      if (!res.ok) {
        throw new Error("ไม่สามารถส่งข้อมูลนัดหมายได้ กรุณาลองใหม่อีกครั้ง");
      }
      setSubmitted(true);
      form.reset();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งข้อมูล"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 hairline-b">
        <div className="lg:col-span-7 space-y-3">
          <p className="font-mono-tech text-sm text-[#1E5079]">
            04 · Campus Visit &amp; Advisory
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-[#0F2A42]">
            ข้อมูลติดต่อ การเดินทาง และนัดหมายเยี่ยมชมสถาบัน 1:1
          </h1>
        </div>
        <div className="lg:col-span-5 flex flex-col justify-end">
          <p className="text-sm sm:text-base text-[#2B4660]">
            ผู้ปกครองสามารถนัดหมายเข้ามาชมห้องเรียนจริง สระว่ายน้ำ สตูดิโอดนตรี
            และปรึกษาแผนการเรียนรายบุคคลกับผู้อำนวยการหลักสูตรได้โดยไม่มีค่าใช้จ่าย
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-12">
        {/* Left 6 cols: Real Map & Direct Channels */}
        <div className="lg:col-span-6 space-y-8">
          {(settings.mapEmbedUrl || settings.address || settings.transitNote || settings.parkingNote) && (
            <section className="bg-white border border-[#D3DEE8] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-[#0F2A42]">
                  ที่ตั้งและแผนที่สถาบัน
                </h2>
                {settings.mapLinkUrl && (
                  <a
                    href={settings.mapLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[#1E5079] underline hover:text-[#143E61]"
                  >
                    เปิดใน Google Maps ↗
                  </a>
                )}
              </div>

              {settings.mapEmbedUrl && (
                <div className="border border-[#D3DEE8] bg-[#F2F6F9] overflow-hidden rounded-lg aspect-[16/10]">
                  <iframe
                    title="แผนที่สถาบัน Somkid+"
                    src={settings.mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              )}

              <div className="space-y-2 text-sm text-[#2B4660]">
                {settings.address && (
                  <p className="whitespace-pre-line">
                    <strong className="text-[#0F2A42]">ที่อยู่:</strong>{" "}
                    {settings.address}
                  </p>
                )}
                {settings.transitNote && (
                  <p className="whitespace-pre-line">
                    <strong className="text-[#0F2A42]">การเดินทาง:</strong>{" "}
                    {settings.transitNote}
                  </p>
                )}
                {settings.parkingNote && (
                  <p className="whitespace-pre-line">
                    <strong className="text-[#0F2A42]">ที่จอดรถ:</strong>{" "}
                    {settings.parkingNote}
                  </p>
                )}
              </div>
            </section>
          )}

          {(settings.phone || settings.lineId || settings.email || settings.hoursText) && (
            <section className="divide-y divide-[#D3DEE8] border-t border-b border-[#D3DEE8]">
              {settings.phone && (
                <div className="py-4 flex justify-between items-center text-sm gap-4">
                  <span className="text-[#5A6F83]">โทรศัพท์ฝ่ายแนะแนว</span>
                  <a
                    href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`}
                    className="font-semibold text-[#0F2A42] hover:underline"
                  >
                    {settings.phone}
                  </a>
                </div>
              )}
              {settings.lineId && (
                <div className="py-4 flex justify-between items-center text-sm gap-4">
                  <span className="text-[#5A6F83]">LINE Official Account</span>
                  <span className="font-semibold text-[#1E5079]">
                    {settings.lineId}
                  </span>
                </div>
              )}
              {settings.email && (
                <div className="py-4 flex justify-between items-center text-sm gap-4">
                  <span className="text-[#5A6F83]">อีเมล</span>
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-[#0F2A42] hover:underline"
                  >
                    {settings.email}
                  </a>
                </div>
              )}
              {settings.hoursText && (
                <div className="py-4 flex justify-between items-start text-sm gap-4">
                  <span className="text-[#5A6F83] shrink-0">เวลาทำการ</span>
                  <span className="text-right text-[#2B4660] whitespace-pre-line">
                    {settings.hoursText}
                  </span>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right 6 cols: 1:1 Campus Visit Appointment Form */}
        <div className="lg:col-span-6 bg-white border border-[#D3DEE8] p-6 sm:p-8">
          <div className="pb-5 hairline-b">
            <p className="font-mono-tech text-sm text-[#1E5079]">
              1:1 Study Plan &amp; Campus Tour
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-[#0F2A42] mt-1">
              นัดหมายเยี่ยมชมสถาบันและปรึกษาแผนการเรียน
            </h2>
            {prefilledEmail && (
              <p className="text-xs text-[#188038] mt-2 font-medium">
                ดึงข้อมูลจากบัญชี Google ({prefilledEmail}) ให้อัตโนมัติแล้ว
              </p>
            )}
          </div>

          {submitted ? (
            <div role="status" aria-live="polite" className="py-10 space-y-4">
              <div className="border-l-4 border-[#188038] bg-[#F2F6F9] p-5">
                <h3 className="font-semibold text-[#0F2A42]">
                  บันทึกการนัดหมายเรียบร้อยแล้ว
                </h3>
                <p className="text-sm text-[#2B4660] mt-1">
                  ฝ่ายแนะแนว Somkid+ จะติดต่อยืนยันวันและเวลาพร้อมส่งแผนที่จอดรถทาง LINE / โทรศัพท์ภายในวันทำการถัดไป
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-5 py-2.5 border border-[#0F2A42] text-sm font-medium"
              >
                ทำรายการนัดหมายเพิ่มเติม
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-6 space-y-5" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="visit-parent"
                    className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                  >
                    ชื่อผู้ปกครอง <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="visit-parent"
                    name="parentName"
                    type="text"
                    required
                    defaultValue={prefilledName}
                    autoComplete="name"
                    className="somkid-input"
                  />
                  <span className="field-error">กรุณาระบุชื่อผู้ปกครอง</span>
                </div>

                <div>
                  <label
                    htmlFor="visit-email"
                    className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                  >
                    อีเมล
                  </label>
                  <input
                    id="visit-email"
                    name="email"
                    type="email"
                    defaultValue={prefilledEmail}
                    autoComplete="email"
                    className="somkid-input"
                  />
                  <span className="field-error">รูปแบบอีเมลไม่ถูกต้อง</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="visit-student"
                    className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                  >
                    ชื่อนักเรียน <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="visit-student"
                    name="studentName"
                    type="text"
                    required
                    className="somkid-input"
                  />
                  <span className="field-error">กรุณาระบุชื่อนักเรียน</span>
                </div>

                <div>
                  <label
                    htmlFor="visit-grade"
                    className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                  >
                    ระดับชั้นปัจจุบัน <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="visit-grade"
                    name="gradeLevel"
                    type="text"
                    required
                    placeholder="เช่น อ.3 / ป.5 / ม.2"
                    className="somkid-input"
                  />
                  <span className="field-error">กรุณาระบุระดับชั้น</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="visit-phone"
                    className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                  >
                    เบอร์โทรศัพท์ <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="visit-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    pattern="[0-9\-\s\+]{9,15}"
                    className="somkid-input"
                    placeholder="08X-XXX-XXXX"
                  />
                  <span className="field-error">
                    กรุณากรอกเบอร์โทรศัพท์ที่ติดต่อได้
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="visit-line"
                    className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                  >
                    LINE ID
                  </label>
                  <input
                    id="visit-line"
                    name="lineId"
                    type="text"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="somkid-input"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="visit-date"
                  className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                >
                  วันและเวลาที่สะดวกเข้าเยี่ยมชม
                </label>
                <input
                  id="visit-date"
                  name="preferredDate"
                  type="text"
                  className="somkid-input"
                  placeholder="เช่น วันเสาร์ที่ 28 พ.ย. เวลา 10:30 น."
                />
              </div>

              <div>
                <label
                  htmlFor="visit-notes"
                  className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                >
                  เรื่องที่ต้องการปรึกษาเป็นพิเศษ
                </label>
                <textarea
                  id="visit-notes"
                  name="notes"
                  rows={3}
                  className="somkid-input"
                  placeholder="เช่น เตรียมสอบเข้า ม.1 ห้อง EP หรือสนใจจับคู่วิชาการกับว่ายน้ำ"
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="visit-pdpa"
                  name="pdpaConsent"
                  type="checkbox"
                  required
                  className="mt-1 w-5 h-5 accent-[#1E5079] shrink-0"
                />
                <label
                  htmlFor="visit-pdpa"
                  className="text-xs text-[#2B4660] leading-relaxed"
                >
                  ยินยอมให้ Somkid+ เก็บและใช้ข้อมูลเพื่อนัดหมายเยี่ยมชมสถาบันตาม{" "}
                  <a
                    href="/privacy-policy"
                    className="underline text-[#1E5079]"
                  >
                    นโยบายความเป็นส่วนตัว (PDPA)
                  </a>
                </label>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="text-sm text-[#B31B1B] bg-[#fdf2f2] border border-[#B31B1B] px-4 py-3"
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1E5079] hover:bg-[#143E61] disabled:opacity-60 text-white font-semibold py-3.5 px-6 text-sm transition-colors"
              >
                {submitting ? "กำลังบันทึกนัดหมาย..." : "ยืนยันนัดหมายเยี่ยมชมสถาบัน"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
