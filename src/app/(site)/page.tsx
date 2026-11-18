import Link from "next/link";
import { getSiteContent } from "@/lib/site-content";
import { SkillRadarChart } from "@/components/SkillRadarChart";

const SAMPLE_RADAR_SCORES = {
  conceptual: 78,
  applied: 62,
  logic: 84,
  accuracy: 70,
  expression: 74,
};

const STEPS = [
  { n: "1", t: "เริ่มทำได้เลย", d: "เลือกวิชา แล้วทำข้อสอบได้เลย ไม่ต้องกรอกอะไรก่อน" },
  { n: "2", t: "ยืนยันด้วย Gmail", d: "คลิกเดียว ไม่ต้องตั้งรหัสผ่าน คำตอบไม่หาย" },
  { n: "3", t: "ฝากเบอร์ไว้ให้ทีมงานติดต่อกลับ", d: "เบอร์โทรเพื่อรับผลวิเคราะห์ทางอีเมลและให้ทีมงานติดต่อกลับ" },
  { n: "4", t: "ดูผลและคอร์สที่เหมาะ", d: "เห็นจุดแข็ง-จุดอ่อน 5 ด้าน พร้อมคำแนะนำ" },
];

export default async function HomePage() {
  const content = await getSiteContent();
  const featuredCourses = content.courses.filter((c) => c.published).slice(0, 3);
  const instructors = content.instructors.filter((i) => i.published);
  const testimonials = content.testimonials.filter((t) => t.published);
  const highlights = content.settings.highlights.filter((h) => h.value);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white border-b border-[#D3DEE8]">
        <span
          className="plus-mark absolute -left-24 top-20 text-[26rem] opacity-[0.12] pointer-events-none hidden lg:block"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-16 lg:pt-24 lg:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-7">
            <p className="text-base font-semibold text-[#1E5079]">
              ติวเตอร์กลุ่มเล็ก · อนุบาล ประถม มัธยม
            </p>
            <h1 className="text-[2.5rem] sm:text-6xl lg:text-[4.25rem] leading-[1.12] text-[#0F2A42]">
              รู้ก่อนว่าลูกเก่งตรงไหน
              <br />
              แล้วค่อยเลือก<span className="mark-cyan">คอร์สที่ใช่</span>
            </h1>
            <p className="text-lg sm:text-xl font-light text-[#2B4660] leading-relaxed max-w-xl">
              ทำข้อสอบวัดระดับ เห็นผลเป็นกราฟ 5 ด้าน
              แล้วทีมอาจารย์ช่วยวางแผนการเรียนให้ตรงกับเด็กคนนั้นจริงๆ
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/mock-exam"
                className="inline-flex items-center gap-2.5 bg-[#1E5079] hover:bg-[#143E61] text-white font-semibold px-7 py-4 rounded-full text-base transition-colors"
              >
                <span className="plus-mark text-base" aria-hidden="true" />
                ทำข้อสอบวัดระดับฟรี
              </Link>
              <Link
                href="/academics"
                className="inline-flex items-center px-6 py-4 rounded-full border-2 border-[#1E5079] text-[#1E5079] hover:bg-[#E0F8FF] font-semibold text-base transition-colors"
              >
                ดูหลักสูตร
              </Link>
            </div>
            {highlights.length > 0 && (
              <ul className="flex flex-wrap gap-x-8 gap-y-2 pt-4 text-[15px] text-[#2B4660]">
                {highlights.map((h) => (
                  <li key={h.value + h.label}>
                    <b className="font-semibold text-[#0F2A42]">{h.value}</b> {h.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Result sheet */}
          <div className="lg:col-span-5">
            <div className="relative lg:rotate-[1.5deg]">
              <div className="absolute inset-0 translate-x-3 translate-y-3 bg-[#00D1FF] rounded-2xl" aria-hidden="true" />
              <div className="relative bg-white border-2 border-[#0F2A42] rounded-2xl p-6 sm:p-7">
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-dashed border-[#9FB4C7]">
                  <div>
                    <p className="text-sm text-[#5A6F83]">ตัวอย่างหน้าตารายงาน (ข้อมูลสมมติ)</p>
                    <p className="text-xl font-semibold text-[#0F2A42]">น้อง A · ป.5</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-semibold text-[#1E5079] leading-none">74%</p>
                    <p className="text-sm text-[#5A6F83] mt-1">ต่อยอดและปิดจุดอ่อน</p>
                  </div>
                </div>
                <SkillRadarChart scores={SAMPLE_RADAR_SCORES} size={290} />
                <p className="text-sm text-[#2B4660] pt-3 border-t border-dashed border-[#9FB4C7]">
                  ระบบจะแนะนำคอร์สที่ตรงกับผลคะแนนในแต่ละด้านให้อัตโนมัติ
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Age groups */}
      <section aria-label="เลือกดูหลักสูตรตามช่วงวัย" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl sm:text-4xl text-[#0F2A42] mb-8">ลูกของคุณอยู่ชั้นไหน</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/academics?grade=อนุบาล"
            className="group rounded-2xl bg-[#E0F8FF] p-7 flex flex-col justify-between min-h-56 hover:-translate-y-1 transition-transform"
          >
            <span className="text-sm font-semibold text-[#1E5079]">อ.2 – อ.3</span>
            <div>
              <h3 className="text-3xl text-[#0F2A42]">อนุบาล</h3>
              <p className="text-[15px] text-[#2B4660] mt-2">
                ฟังพูดสองภาษา ฝึกสมาธิ และเตรียมพร้อมขึ้น ป.1
              </p>
            </div>
          </Link>
          <Link
            href="/academics?grade=ประถม"
            className="group rounded-2xl bg-[#1E5079] text-white p-7 flex flex-col justify-between min-h-56 hover:-translate-y-1 transition-transform"
          >
            <span className="text-sm font-semibold text-[#00D1FF]">ป.1 – ป.6</span>
            <div>
              <h3 className="text-3xl">ประถม</h3>
              <p className="text-[15px] text-[#D6E4F0] mt-2">
                คณิตแบบเห็นภาพ วิทย์เชิงทดลอง และ English MEP
              </p>
            </div>
          </Link>
          <Link
            href="/academics?grade=มัธยม"
            className="group rounded-2xl bg-white border-2 border-[#0F2A42] p-7 flex flex-col justify-between min-h-56 hover:-translate-y-1 transition-transform"
          >
            <span className="text-sm font-semibold text-[#1E5079]">ม.1 – ม.6</span>
            <div>
              <h3 className="text-3xl text-[#0F2A42]">มัธยม</h3>
              <p className="text-[15px] text-[#2B4660] mt-2">
                ติวสอบเข้า ม.4 โอลิมปิกวิชาการ และ Cambridge/IELTS
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Mock exam band */}
      <section className="relative overflow-hidden bg-[#1E5079] text-white py-16 lg:py-20">
        <span
          className="plus-mark absolute -right-20 -top-20 text-[24rem] opacity-[0.1] pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-3xl sm:text-4xl leading-tight">
              ไม่แน่ใจว่าควรเริ่มตรงไหน? ลองทำข้อสอบก่อน
            </h2>
            <p className="text-[#D6E4F0] font-light text-lg">
              ไม่ต้องสมัครสมาชิกก่อนทำ เสร็จแล้วค่อยยืนยันตัวตนเพื่อดูผล
            </p>
            <Link
              href="/mock-exam"
              className="inline-flex items-center gap-2 bg-[#00D1FF] hover:bg-[#33DCFF] text-[#0F2A42] font-semibold px-7 py-4 rounded-full transition-colors"
            >
              เริ่มทำข้อสอบ
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ol className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="text-5xl font-semibold text-[#00D1FF] leading-none w-8 shrink-0">
                  {s.n}
                </span>
                <div>
                  <h3 className="text-lg">{s.t}</h3>
                  <p className="text-[15px] text-[#D6E4F0] font-light mt-1">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Featured courses */}
      {featuredCourses.length > 0 && (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <h2 className="text-3xl sm:text-4xl text-[#0F2A42]">คอร์สที่เปิดรับตอนนี้</h2>
          <Link href="/academics" className="font-semibold text-[#1E5079] underline underline-offset-4 decoration-[#00D1FF] decoration-2">
            ดูทั้งหมด
          </Link>
        </div>
        <div className="divide-y divide-[#D3DEE8] border-y border-[#D3DEE8]">
          {featuredCourses.map((course) => (
            <article
              key={course.id}
              className="py-7 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
            >
              <div className="lg:col-span-2">
                <span className="inline-block text-sm font-semibold bg-[#E0F8FF] text-[#1E5079] px-3 py-1 rounded-full">
                  {course.gradeRange}
                </span>
              </div>
              <div className="lg:col-span-6">
                <h3 className="text-xl text-[#0F2A42]">{course.title}</h3>
                <p className="text-[15px] text-[#5A6F83] mt-1 font-light">{course.subtitle}</p>
              </div>
              <div className="lg:col-span-2 text-[15px] text-[#2B4660]">
                <p>{course.schedule}</p>
                <p className="font-semibold text-[#1E5079] mt-0.5">
                  เหลือ {course.seatsRemaining} ที่นั่ง
                </p>
              </div>
              <div className="lg:col-span-2 flex lg:justify-end">
                <Link
                  href={`/academics?subject=${encodeURIComponent(course.subject)}`}
                  className="inline-flex items-center px-5 py-2.5 rounded-full border-2 border-[#0F2A42] text-sm font-semibold text-[#0F2A42] hover:bg-[#0F2A42] hover:text-white transition-colors"
                >
                  ดูรายละเอียด
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      )}

      {/* Outcomes and instructors */}
      {(testimonials.length > 0 || instructors.length > 0) && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-14">
          {testimonials.length > 0 && (
            <div>
              <h2 className="text-3xl text-[#0F2A42] mb-6">เสียงจากผู้ปกครอง</h2>
              <div className="space-y-5">
                {testimonials.map((item) => (
                  <blockquote key={item.id} className="bg-white rounded-2xl border border-[#D3DEE8] p-6">
                    <p className="text-lg font-light text-[#0F2A42] leading-relaxed">
                      “{item.quote}”
                    </p>
                    <footer className="mt-4 text-[15px]">
                      <b className="font-semibold text-[#0F2A42]">{item.studentInitial}</b>
                      {item.beforeAfter && (
                        <span className="text-[#5A6F83]"> · {item.beforeAfter}</span>
                      )}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          )}

          {instructors.length > 0 && (
            <div>
              <h2 className="text-3xl text-[#0F2A42] mb-6">ทีมอาจารย์</h2>
              <div className="divide-y divide-[#D3DEE8] border-y border-[#D3DEE8]">
                {instructors.map((prof) => (
                  <div key={prof.id} className="py-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-lg text-[#0F2A42]">{prof.name}</h3>
                      {prof.experienceYears > 0 && (
                        <span className="text-sm text-[#5A6F83]">{prof.experienceYears} ปี</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#1E5079]">{prof.role}</p>
                    {prof.credentials && (
                      <p className="text-sm text-[#5A6F83]">{prof.credentials}</p>
                    )}
                    <p className="text-[15px] text-[#2B4660] font-light mt-1">{prof.focus}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
