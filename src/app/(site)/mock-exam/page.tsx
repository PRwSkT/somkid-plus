import type { Metadata } from "next";
import { MockExamClient } from "@/components/MockExamClient";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "ข้อสอบวัดระดับฟรี",
  description:
    "ทำข้อสอบวัดระดับฟรี พร้อมวิเคราะห์จุดแข็ง-จุดอ่อน 5 ด้านและแนะนำคอร์สที่เหมาะสม",
};

export default async function MockExamPage() {
  const content = await getSiteContent();
  const tracks = content.examTracks
    .filter((t) => t.published)
    .map((t) => ({
      ...t,
      questions: t.questions.filter(
        (q) =>
          q.prompt.trim() &&
          q.options.filter((o) => o.trim()).length >= 2 &&
          q.correctIndex >= 0 &&
          q.correctIndex < q.options.length
      ),
    }))
    .filter((t) => t.questions.length > 0);

  if (tracks.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center space-y-3">
        <h1 className="text-4xl text-[#0F2A42]">ข้อสอบวัดระดับ</h1>
        <p className="text-[#5A6F83]">ขณะนี้ยังไม่เปิดให้ทำข้อสอบ โปรดติดตามเร็วๆ นี้</p>
      </div>
    );
  }

  return (
    <MockExamClient
      tracks={tracks}
      courses={content.courses.filter((c) => c.published)}
    />
  );
}
