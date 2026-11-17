import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { readContent, readSubmissions } from "@/lib/content-store";

export const instant = false;

async function AdminHomeContent() {
  await connection();
  const [content, subs] = await Promise.all([readContent(), readSubmissions()]);
  const s = content.settings;

  const cards = [
    { href: "/admin/courses", label: "หลักสูตรวิชาการ", n: content.courses.length, on: content.courses.filter((c) => c.published).length },
    { href: "/admin/activities", label: "กิจกรรมและกีฬา", n: content.activities.length, on: content.activities.filter((c) => c.published).length },
    { href: "/admin/exams", label: "ชุดข้อสอบ", n: content.examTracks.length, on: content.examTracks.filter((c) => c.published).length },
    { href: "/admin/instructors", label: "ทีมอาจารย์", n: content.instructors.length, on: content.instructors.filter((c) => c.published).length },
    { href: "/admin/testimonials", label: "เสียงผู้ปกครอง", n: content.testimonials.length, on: content.testimonials.filter((c) => c.published).length },
  ];

  const todo: string[] = [];
  if (!s.phone && !s.lineId && !s.email) todo.push("ยังไม่ได้ใส่ช่องทางติดต่อ (โทร / LINE / อีเมล)");
  if (!s.address) todo.push("ยังไม่ได้ใส่ที่อยู่และแผนที่สถาบัน");
  if (!s.hoursText) todo.push("ยังไม่ได้ใส่เวลาทำการ");
  if (content.instructors.length === 0) todo.push("ยังไม่มีข้อมูลทีมอาจารย์ (ส่วนนี้ถูกซ่อนในหน้าแรก)");
  if (content.testimonials.length === 0) todo.push("ยังไม่มีเสียงจากผู้ปกครอง (ส่วนนี้ถูกซ่อนในหน้าแรก)");
  todo.push("ตรวจสอบหลักสูตร ราคา และตารางเรียนตัวอย่างให้ตรงกับของจริงก่อนเปิดใช้งาน");
  todo.push("ข้อสอบวัดระดับชุดเริ่มต้นเป็นตัวอย่าง ควรแทนที่ด้วยข้อสอบของสถาบัน");

  return (
    <div className="py-8 space-y-10 max-w-4xl">
      <h1 className="text-3xl text-[#0F2A42]">ภาพรวมระบบ</h1>

      <section>
        <h2 className="text-xl text-[#0F2A42] mb-3">สิ่งที่ยังต้องทำ</h2>
        <ul className="space-y-2">
          {todo.map((t) => (
            <li key={t} className="flex gap-3 bg-white border border-[#D3DEE8] rounded-lg px-4 py-3 text-[15px] text-[#2B4660]">
              <span className="plus-mark plus-mark-navy text-base mt-1 shrink-0" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl text-[#0F2A42] mb-3">เนื้อหาบนเว็บไซต์</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cards.map((c) => (
            <Link key={c.href} href={c.href} className="bg-white border border-[#D3DEE8] rounded-xl p-5 hover:border-[#1E5079]">
              <p className="text-3xl font-semibold text-[#1E5079]">{c.on}<span className="text-base text-[#5A6F83] font-normal"> / {c.n}</span></p>
              <p className="text-[15px] text-[#2B4660] mt-1">{c.label} (แสดงอยู่ / ทั้งหมด)</p>
            </Link>
          ))}
          <Link href="/admin/submissions" className="bg-[#E0F8FF] border border-[#00D1FF] rounded-xl p-5">
            <p className="text-3xl font-semibold text-[#0F2A42]">{subs.length}</p>
            <p className="text-[15px] text-[#2B4660] mt-1">ผู้สนใจและการจองทั้งหมด</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function AdminHome() {
  return (
    <Suspense fallback={<div className="py-8 text-[#5A6F83]">กำลังโหลดภาพรวม...</div>}>
      <AdminHomeContent />
    </Suspense>
  );
}
