"use client";

import { useState } from "react";
import Link from "next/link";
import { type ActivityProgram } from "@/data/somkid-data";
import { EnrollmentDialog } from "@/components/EnrollmentDialog";

export function ActivitiesClient({
  activities,
}: {
  activities: ActivityProgram[];
}) {
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityProgram | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      {/* Header */}
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 hairline-b">
        <div className="lg:col-span-7 space-y-3">
          <p className="font-mono-tech text-sm text-[#1E5079]">
            03 · Holistic Skills, Sports &amp; Creative Arts
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-[#0F2A42]">
            กิจกรรม กีฬา ดนตรี และทักษะแห่งการลงมือทำ
          </h1>
        </div>
        <div className="lg:col-span-5 flex flex-col justify-end space-y-3">
          <p className="text-sm sm:text-base text-[#2B4660]">
            การเรียนรู้ไม่ได้จบที่โต๊ะหนังสือ Somkid+ ออกแบบตารางกิจกรรมหลังเลิกเรียนและแคมป์วันหยุด
            ที่ผสานวินัยด้านกีฬา สมาธิด้านดนตรี และความคิดสร้างสรรค์เชิงโครงสร้างเข้ากับหลักสูตรวิชาการ
          </p>
        </div>
      </header>

      {/* Activity Programs Grid (Editorial Split Rows) */}
      <div className="divide-y divide-[#D3DEE8] border-b border-[#D3DEE8] mt-6">
        {activities.map((prog, index) => (
          <article
            key={prog.id}
            className="py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Visual Documentary Placeholder / Editorial Frame (0px radius) */}
            <div className="lg:col-span-5 bg-[#0F2A42] text-white p-8 min-h-60 flex flex-col justify-between border border-[#0F2A42]">
              <div className="flex items-center justify-between text-xs font-mono-tech text-[#00D1FF]">
                <span>0{index + 1} · {prog.code}</span>
                <span>{prog.discipline}</span>
              </div>
              <div className="py-6">
                <p className="font-display text-2xl sm:text-3xl leading-snug text-white">
                  {prog.title}
                </p>
              </div>
              <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-[#D3DEE8] font-mono-tech">
                <span>ช่วงวัย: {prog.ageRange}</span>
                <span>ว่าง {prog.seatsRemaining} ที่นั่ง</span>
              </div>
            </div>

            {/* Program Details */}
            <div className="lg:col-span-7 space-y-5">
              <p className="text-base text-[#2B4660] leading-relaxed">
                {prog.subtitle}
              </p>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 hairline-t text-sm">
                <div>
                  <dt className="font-mono-tech text-[11px] text-[#5A6F83]">
                    อัตราส่วนผู้สอน
                  </dt>
                  <dd className="font-medium text-[#0F2A42] mt-0.5">
                    {prog.coachRatio}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono-tech text-[11px] text-[#5A6F83]">
                    ตารางเรียนประจำสัปดาห์
                  </dt>
                  <dd className="font-medium text-[#0F2A42] mt-0.5">
                    {prog.schedule}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-mono-tech text-[11px] text-[#5A6F83]">
                    มาตรฐานอุปกรณ์และความปลอดภัย
                  </dt>
                  <dd className="text-[#2B4660] mt-0.5">
                    {prog.safetyAndEquipment}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono-tech text-[11px] text-[#0B7490]">
                    ปฏิทินแคมป์ / Showcase
                  </dt>
                  <dd className="font-medium text-[#0F2A42] mt-0.5">
                    {prog.campDate}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono-tech text-[11px] text-[#1E5079]">
                    แพ็กเกจควบคู่
                  </dt>
                  <dd className="text-[#2B4660] mt-0.5">
                    {prog.comboDiscountNote}
                  </dd>
                </div>
              </dl>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedActivity(prog)}
                  className="bg-[#1E5079] hover:bg-[#143E61] text-white font-semibold px-6 py-3 text-sm transition-colors"
                >
                  จองคลาสทดลองเรียน (฿{prog.trialFeeThb})
                </button>
                <Link
                  href="/academics"
                  className="text-sm font-medium text-[#1E5079] hover:underline"
                >
                  จับคู่กับคอร์สวิชาการ →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <EnrollmentDialog
        open={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        bookingType="trial_class"
        itemTitle={selectedActivity?.title ?? ""}
        itemCode={selectedActivity?.code}
        courseId={selectedActivity?.id}
      />
    </div>
  );
}
