"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  type AcademicCourse,
  type AcademicSubject,
  type ExamGoal,
  type GradeGroup,
} from "@/data/somkid-data";
import { EnrollmentDialog } from "@/components/EnrollmentDialog";

interface AcademicsClientProps {
  courses: AcademicCourse[];
  initialGrade?: string;
  initialSubject?: string;
}

const GRADES: ("ทั้งหมด" | GradeGroup)[] = ["ทั้งหมด", "อนุบาล", "ประถม", "มัธยม"];
const SUBJECTS: ("ทั้งหมด" | AcademicSubject)[] = [
  "ทั้งหมด",
  "คณิตศาสตร์",
  "วิทยาศาสตร์",
  "อังกฤษ MEP",
  "สอบเข้า & Olympiad",
];
const GOALS: ("ทั้งหมด" | ExamGoal)[] = [
  "ทั้งหมด",
  "ปูพื้นฐานและเพิ่มเกรด",
  "สอบเข้าหลักสูตร EP/MEP",
  "สอบแข่งขันระดับสากล",
];

export function AcademicsClient({
  courses,
  initialGrade,
  initialSubject,
}: AcademicsClientProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>(
    GRADES.includes(initialGrade as GradeGroup) ? (initialGrade as string) : "ทั้งหมด"
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    SUBJECTS.includes(initialSubject as AcademicSubject)
      ? (initialSubject as string)
      : "ทั้งหมด"
  );
  const [selectedGoal, setSelectedGoal] = useState<string>("ทั้งหมด");
  const [activeCourse, setActiveCourse] = useState<AcademicCourse | null>(null);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (selectedGrade !== "ทั้งหมด" && c.gradeGroup !== selectedGrade) {
        return false;
      }
      if (selectedSubject !== "ทั้งหมด" && c.subject !== selectedSubject) {
        return false;
      }
      if (selectedGoal !== "ทั้งหมด" && c.examGoal !== selectedGoal) {
        return false;
      }
      return true;
    });
  }, [courses, selectedGrade, selectedSubject, selectedGoal]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      {/* Page Header */}
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 hairline-b">
        <div className="lg:col-span-7 space-y-3">
          <p className="font-mono-tech text-sm text-[#1E5079]">
            02 · Academic Curriculum
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-[#0F2A42]">
            หลักสูตรวิชาการเชิงลึกและตารางเรียนกลุ่มย่อย
          </h1>
        </div>
        <div className="lg:col-span-5 flex flex-col justify-end space-y-4">
          <p className="text-sm sm:text-base text-[#2B4660]">
            เปรียบเทียบโครงสร้างหลักสูตรและตรวจสอบที่นั่งคงเหลือ
            และสมัครเรียนได้ทันทีในหน้าเดียว หรือทำข้อสอบวัดระดับก่อนตัดสินใจ
          </p>
          <div>
            <Link
              href="/mock-exam"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E5079] hover:underline"
            >
              <span>ยังไม่แน่ใจระดับชั้นที่เหมาะสม? ลองทำข้อสอบวัดระดับฟรี →</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Smart Course Filter (<search> landmark per forms guide) */}
      <search className="py-8 hairline-b">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="filter-grade"
              className="block font-mono-tech text-sm text-[#5A6F83] mb-2"
            >
              1. ระดับชั้น (Grade Level)
            </label>
            <select
              id="filter-grade"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="somkid-input"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-subject"
              className="block font-mono-tech text-sm text-[#5A6F83] mb-2"
            >
              2. รายวิชา (Subject)
            </label>
            <select
              id="filter-subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="somkid-input"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-goal"
              className="block font-mono-tech text-sm text-[#5A6F83] mb-2"
            >
              3. เป้าหมายการเรียน (Goal)
            </label>
            <select
              id="filter-goal"
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
              className="somkid-input"
            >
              {GOALS.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-[#5A6F83]">
          <span>พบ {filteredCourses.length} หลักสูตรที่ตรงกับเงื่อนไข</span>
          {(selectedGrade !== "ทั้งหมด" ||
            selectedSubject !== "ทั้งหมด" ||
            selectedGoal !== "ทั้งหมด") && (
            <button
              type="button"
              onClick={() => {
                setSelectedGrade("ทั้งหมด");
                setSelectedSubject("ทั้งหมด");
                setSelectedGoal("ทั้งหมด");
              }}
              className="underline text-[#1E5079] font-medium"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </search>

      {/* Course List with Curriculum Timeline & Real-time Seats */}
      <div className="divide-y divide-[#D3DEE8] border-b border-[#D3DEE8]">
        {filteredCourses.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <p className="text-lg text-[#2B4660]">
              ไม่พบหลักสูตรที่ตรงกับตัวกรองทั้ง 3 เงื่อนไขพร้อมกัน
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedGrade("ทั้งหมด");
                setSelectedSubject("ทั้งหมด");
                setSelectedGoal("ทั้งหมด");
              }}
              className="px-5 py-2.5 bg-[#1E5079] text-white text-sm font-semibold"
            >
              แสดงหลักสูตรทั้งหมด
            </button>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <article
              key={course.id}
              className="py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left 4 cols: Meta & Pricing */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-tech text-sm px-2 py-0.5 bg-[#0F2A42] text-white">
                    {course.code}
                  </span>
                  <span className="font-mono-tech text-sm px-2 py-0.5 bg-white border border-[#D3DEE8] text-[#1E5079]">
                    {course.gradeRange}
                  </span>
                  <span className="font-mono-tech text-sm px-2 py-0.5 bg-white border border-[#D3DEE8] text-[#0B7490]">
                    {course.examGoal}
                  </span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl text-[#0F2A42] leading-snug">
                  {course.title}
                </h2>
                <p className="text-sm text-[#5A6F83]">{course.subtitle}</p>

                <dl className="pt-3 space-y-1.5 text-sm hairline-t">
                  <div className="flex justify-between">
                    <dt className="text-[#5A6F83]">รอบเรียน:</dt>
                    <dd className="font-medium text-[#0F2A42]">{course.schedule}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#5A6F83]">รูปแบบ:</dt>
                    <dd className="text-[#2B4660]">{course.format}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#5A6F83]">ค่าเล่าเรียน ({course.durationWeeks} สัปดาห์):</dt>
                    <dd className="font-mono-tech font-semibold text-[#0F2A42]">
                      ฿{course.tuitionThb.toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Middle 5 cols: 12-Week Curriculum Timeline */}
              <div className="lg:col-span-5 bg-white border border-[#D3DEE8] p-6 space-y-4">
                <h3 className="font-mono-tech text-sm text-[#1E5079]">
                  Curriculum Timeline · สิ่งที่จะทำได้หลังเรียนจบ
                </h3>
                <ol className="space-y-3">
                  {course.outcomes.map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm text-[#2B4660] leading-relaxed"
                    >
                      <span className="font-mono-tech text-sm font-semibold text-[#1E5079] shrink-0 pt-0.5">
                        0{i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Right 3 cols: Real-time seats + Enrollment CTA */}
              <div className="lg:col-span-3 flex flex-col justify-between h-full space-y-4 lg:pl-4 lg:border-l lg:border-[#D3DEE8]">
                <div className="space-y-2">
                  <p className="font-mono-tech text-sm text-[#5A6F83]">
                    Live Seat Availability
                  </p>
                  <p className="text-2xl font-display text-[#0F2A42]">
                    เหลือ {course.seatsRemaining} จาก {course.seatsTotal} ที่นั่ง
                  </p>
                  <div className="w-full h-2 bg-[#D3DEE8]">
                    <div
                      className="h-full bg-[#1E5079]"
                      style={{
                        width: `${Math.round(
                          ((course.seatsTotal - course.seatsRemaining) /
                            course.seatsTotal) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveCourse(course)}
                    className="w-full bg-[#1E5079] hover:bg-[#143E61] text-white font-semibold py-3.5 px-4 text-sm transition-colors"
                  >
                    สมัครเรียนคอร์สนี้ (1-Step)
                  </button>
                  <Link
                    href="/mock-exam"
                    className="block text-center w-full border border-[#0F2A42] text-[#0F2A42] hover:bg-[#0F2A42] hover:text-white font-medium py-3 px-4 text-xs transition-colors"
                  >
                    วัดระดับก่อนสมัคร (Mock Exam)
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* One-Step Enrollment Drawer Dialog */}
      <EnrollmentDialog
        open={Boolean(activeCourse)}
        onClose={() => setActiveCourse(null)}
        bookingType="enrollment"
        itemTitle={activeCourse?.title ?? ""}
        itemCode={activeCourse?.code}
        courseId={activeCourse?.id}
      />
    </div>
  );
}
