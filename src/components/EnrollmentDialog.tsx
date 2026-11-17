"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface EnrollmentDialogProps {
  open: boolean;
  onClose: () => void;
  bookingType: "enrollment" | "trial_class";
  itemTitle: string;
  itemCode?: string;
  courseId?: string;
}

export function EnrollmentDialog({
  open,
  onClose,
  bookingType,
  itemTitle,
  itemCode,
  courseId,
}: EnrollmentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setStatusMessage(null);
      setErrorMessage(null);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = "";
      onClose();
    };
    dialog.addEventListener("close", handleClose);

    // Light-dismiss fallback where closedBy is not natively supported
    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!("closedBy" in HTMLDialogElement.prototype)) {
        pressedOutside = isOutside(e);
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (
        !("closedBy" in HTMLDialogElement.prototype) &&
        pressedOutside &&
        isOutside(e)
      ) {
        dialog.close();
      }
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector(":invalid") as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    const fd = new FormData(form);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType,
          courseId,
          courseTitle: itemTitle,
          studentName: fd.get("studentName"),
          gradeLevel: fd.get("gradeLevel"),
          parentName: fd.get("parentName"),
          phone: fd.get("phone"),
          lineId: fd.get("lineId"),
          preferredDate: fd.get("preferredDate"),
          pdpaConsent: fd.get("pdpaConsent") === "on",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      }

      setStatusMessage(
        bookingType === "enrollment"
          ? "บันทึกคำขอสมัครเรียนเรียบร้อยแล้ว เจ้าหน้าที่ฝ่ายแนะแนวจะติดต่อกลับทางโทรศัพท์/LINE ภายใน 24 ชั่วโมง"
          : "จองคลาสทดลองเรียนสำเร็จแล้ว ทีมโค้ชและฝ่ายต้อนรับจะยืนยันรอบเวลาทาง LINE Official"
      );
      form.reset();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งข้อมูล"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: "any" } as Record<string, string>)}
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 pb-5 hairline-b">
          <div>
            <p className="font-mono-tech text-sm text-[#1E5079]">
              {bookingType === "enrollment"
                ? "One-Step Enrollment"
                : "Trial Class Booking"}{" "}
              {itemCode ? `· ${itemCode}` : ""}
            </p>
            <h2
              id={titleId}
              className="font-display text-2xl sm:text-3xl text-[#0F2A42] mt-1 leading-tight"
            >
              {itemTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="ปิดหน้าต่าง"
            className="min-w-11 min-h-11 border border-[#D3DEE8] bg-white text-[#0F2A42] hover:bg-[#E2E8F0] text-sm font-medium px-3"
          >
            ปิด
          </button>
        </div>

        {statusMessage ? (
          <div role="status" aria-live="polite" className="py-8 space-y-5">
            <div className="border-l-4 border-[#188038] bg-white p-5">
              <p className="font-semibold text-[#0F2A42]">ดำเนินการสำเร็จ</p>
              <p className="text-sm text-[#2B4660] mt-1">{statusMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="w-full bg-[#1E5079] text-white font-semibold py-3 px-5 hover:bg-[#0F2A42]"
            >
              กลับสู่หน้าหลักสูตร
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-6 space-y-5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${titleId}-student`}
                  className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                >
                  ชื่อ-นามสกุลนักเรียน <span aria-hidden="true">*</span>
                </label>
                <input
                  id={`${titleId}-student`}
                  name="studentName"
                  type="text"
                  required
                  autoFocus
                  className="somkid-input"
                  placeholder="เช่น ด.ช. ภูมิพัฒน์"
                />
                <span className="field-error">กรุณาระบุชื่อนักเรียน</span>
              </div>

              <div>
                <label
                  htmlFor={`${titleId}-grade`}
                  className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                >
                  ระดับชั้นปัจจุบัน <span aria-hidden="true">*</span>
                </label>
                <input
                  id={`${titleId}-grade`}
                  name="gradeLevel"
                  type="text"
                  required
                  className="somkid-input"
                  placeholder="เช่น ป.5 / ม.2"
                />
                <span className="field-error">กรุณาระบุระดับชั้น</span>
              </div>
            </div>

            <div>
              <label
                htmlFor={`${titleId}-parent`}
                className="block text-sm font-medium text-[#0F2A42] mb-1.5"
              >
                ชื่อผู้ปกครอง <span aria-hidden="true">*</span>
              </label>
              <input
                id={`${titleId}-parent`}
                name="parentName"
                type="text"
                required
                autoComplete="name"
                className="somkid-input"
              />
              <span className="field-error">กรุณาระบุชื่อผู้ปกครอง</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${titleId}-phone`}
                  className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                >
                  เบอร์โทรศัพท์ติดต่อ <span aria-hidden="true">*</span>
                </label>
                <input
                  id={`${titleId}-phone`}
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
                  กรุณากรอกเบอร์โทรศัพท์ 9–10 หลักให้ถูกต้อง
                </span>
              </div>

              <div>
                <label
                  htmlFor={`${titleId}-line`}
                  className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                >
                  LINE ID (ถ้ามี)
                </label>
                <input
                  id={`${titleId}-line`}
                  name="lineId"
                  type="text"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="somkid-input"
                  placeholder="@lineid"
                />
              </div>
            </div>

            {bookingType === "trial_class" && (
              <div>
                <label
                  htmlFor={`${titleId}-date`}
                  className="block text-sm font-medium text-[#0F2A42] mb-1.5"
                >
                  วัน/เวลาที่สะดวกทดลองเรียน
                </label>
                <input
                  id={`${titleId}-date`}
                  name="preferredDate"
                  type="text"
                  className="somkid-input"
                  placeholder="เช่น วันเสาร์ช่วงเช้า 09:30 น."
                />
              </div>
            )}

            <div className="flex items-start gap-3 pt-1">
              <input
                id={`${titleId}-pdpa`}
                name="pdpaConsent"
                type="checkbox"
                required
                className="mt-1 w-5 h-5 accent-[#1E5079] shrink-0"
              />
              <label
                htmlFor={`${titleId}-pdpa`}
                className="text-xs text-[#2B4660] leading-relaxed"
              >
                ยินยอมให้ Somkid+ ใช้ข้อมูลติดต่อเพื่อการประสานงานเรื่องตารางเรียนและสิทธิพิเศษตาม{" "}
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-[#1E5079]"
                >
                  นโยบายความเป็นส่วนตัว (PDPA)
                </a>
              </label>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="text-sm text-[#B31B1B] bg-[#fdf2f2] border border-[#B31B1B] px-4 py-3"
              >
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 hairline-t">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="px-5 py-3 border border-[#D3DEE8] bg-white text-sm font-medium text-[#0F2A42] hover:bg-[#E2E8F0]"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-[#1E5079] hover:bg-[#143E61] disabled:opacity-60 text-white text-sm font-semibold"
              >
                {submitting
                  ? "กำลังบันทึก..."
                  : bookingType === "enrollment"
                    ? "ยืนยันคำขอสมัครเรียน"
                    : "ยืนยันจองคลาสทดลองเรียน"}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
