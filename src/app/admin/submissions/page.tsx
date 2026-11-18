import { Suspense } from "react";
import { connection } from "next/server";
import SubmissionStatus from "@/components/admin/SubmissionStatus";
import { readSubmissions, type Submission } from "@/lib/content-store";

export const instant = false;

const TYPE_LABEL: Record<Submission["type"], string> = {
  mock_exam_lead: "ทำข้อสอบวัดระดับ",
  enrollment: "สมัครเรียน",
  trial_class: "จองทดลองเรียน",
  campus_visit: "นัดเยี่ยมชม",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
}

function pick(d: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = d[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

async function SubmissionsContent() {
  await connection();
  const subs = await readSubmissions();

  return (
    <div className="py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-[#0F2A42]">ผู้สนใจ / การจอง</h1>
          <p className="text-sm text-[#5A6F83]">
            ข้อมูลที่ผู้ปกครองกรอกผ่านเว็บไซต์ เรียงจากล่าสุด (ข้อมูลส่วนบุคคล โปรดเก็บรักษาตาม PDPA)
          </p>
        </div>
        <a
          href="/api/admin/submissions.csv"
          className="px-5 py-2.5 rounded-full border-2 border-[#1E5079] text-[#1E5079] font-semibold text-sm hover:bg-[#E0F8FF]"
        >
          ดาวน์โหลด CSV
        </a>
      </div>

      {subs.length === 0 ? (
        <p className="bg-white border border-[#D3DEE8] rounded-xl p-8 text-[#5A6F83]">
          ยังไม่มีข้อมูล เมื่อมีผู้ปกครองทำข้อสอบหรือกรอกฟอร์ม จะแสดงที่นี่
        </p>
      ) : (
        <div className="overflow-x-auto bg-white border border-[#D3DEE8] rounded-xl">
          <table className="w-full text-[15px] text-left">
            <thead>
              <tr className="border-b border-[#D3DEE8] text-sm text-[#5A6F83]">
                <th className="px-4 py-3 font-semibold">เวลา</th>
                <th className="px-4 py-3 font-semibold">ประเภท</th>
                <th className="px-4 py-3 font-semibold">ชื่อ</th>
                <th className="px-4 py-3 font-semibold">ติดต่อ</th>
                <th className="px-4 py-3 font-semibold">รายละเอียด</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const d = s.data;
                const name = pick(d, "parentName", "fullName");
                const student = pick(d, "studentName");
                const detail =
                  s.type === "mock_exam_lead"
                    ? `${pick(d, "trackLabel")} · ${String(d.scorePercent ?? "")}% (${pick(d, "tier")})`
                    : `${pick(d, "courseTitle")}${student ? ` · นักเรียน: ${student}` : ""}${pick(d, "gradeLevel") ? ` (${pick(d, "gradeLevel")})` : ""}${pick(d, "preferredDate") ? ` · สะดวก: ${pick(d, "preferredDate")}` : ""}${pick(d, "notes") ? ` · ${pick(d, "notes")}` : ""}`;
                return (
                  <tr key={s.id} className="border-b border-[#EDF2F6] last:border-0 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-[#5A6F83]">{fmt(s.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-block text-sm font-semibold bg-[#E0F8FF] text-[#1E5079] px-2.5 py-0.5 rounded-full">
                        {TYPE_LABEL[s.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">{name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {pick(d, "phone")}
                      {pick(d, "lineId") && <div className="text-sm text-[#5A6F83]">LINE: {pick(d, "lineId")}</div>}
                      {pick(d, "email") && <div className="text-sm text-[#5A6F83]">{pick(d, "email")}</div>}
                    </td>
                    <td className="px-4 py-3 text-[#2B4660]">{detail}</td>
                    <td className="px-4 py-3">
                      <SubmissionStatus
                        id={s.id}
                        status={s.status ?? "new"}
                        note={s.adminNote ?? ""}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function SubmissionsPage() {
  return (
    <Suspense fallback={<div className="py-8 text-[#5A6F83]">กำลังโหลดรายการผู้สนใจ...</div>}>
      <SubmissionsContent />
    </Suspense>
  );
}
