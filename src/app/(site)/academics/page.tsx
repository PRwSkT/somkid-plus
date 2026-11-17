import type { Metadata } from "next";
import { Suspense } from "react";
import { AcademicsClient } from "@/components/AcademicsClient";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "หลักสูตรวิชาการ",
  description:
    "หลักสูตรคณิตศาสตร์ วิทยาศาสตร์ และภาษาอังกฤษ MEP ระดับอนุบาล ประถม มัธยม พร้อมตัวกรองและที่นั่งคงเหลือ",
};

async function AcademicsContent({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string; subject?: string }>;
}) {
  const [params, content] = await Promise.all([searchParams, getSiteContent()]);
  return (
    <AcademicsClient
      courses={content.courses.filter((c) => c.published)}
      initialGrade={params.grade}
      initialSubject={params.subject}
    />
  );
}

export default function AcademicsPage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string; subject?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-sm text-[#5A6F83]">
          กำลังโหลดหลักสูตร...
        </div>
      }
    >
      <AcademicsContent searchParams={searchParams} />
    </Suspense>
  );
}
