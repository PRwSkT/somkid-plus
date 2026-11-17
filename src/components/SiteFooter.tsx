import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/data/somkid-data";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const hasContact = Boolean(
    settings.phone || settings.lineId || settings.email || settings.hoursText || settings.address
  );
  return (
    <footer className="relative overflow-hidden bg-[#0F2A42] text-white mt-24">
      <span
        className="plus-mark absolute -right-16 -bottom-16 text-[22rem] opacity-[0.07] pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/15">
          <div className="md:col-span-5 space-y-5">
            <div className="inline-flex bg-white rounded-md px-4 py-2.5">
              <Image
                src="/images/somkid-logo.png"
                alt="Somkid+"
                width={132}
                height={26}
                className="h-7 w-auto object-contain"
              />
            </div>
            <p className="text-[15px] text-[#C3D4E3] max-w-md leading-relaxed">
              สถาบันพัฒนาศักยภาพวิชาการและทักษะรอบด้านในเครือสมคิดวิทยา
              เรียนเป็นกลุ่มเล็ก ดูแลทีละคน และเริ่มจากการรู้ว่าเด็กแต่ละคนอยู่ตรงไหนก่อนเสมอ
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h2 className="text-sm font-semibold text-[#00D1FF]">เมนู</h2>
            <ul className="space-y-2 text-[15px]">
              <li><Link href="/" className="hover:text-[#00D1FF]">หน้าหลัก</Link></li>
              <li><Link href="/academics" className="hover:text-[#00D1FF]">หลักสูตรวิชาการ</Link></li>
              <li><Link href="/activities-sports" className="hover:text-[#00D1FF]">กิจกรรมและกีฬา</Link></li>
              <li><Link href="/mock-exam" className="hover:text-[#00D1FF]">ทำข้อสอบวัดระดับฟรี</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#00D1FF]">ติดต่อสถาบัน</h2>
            {hasContact ? (
              <div className="space-y-2 text-[15px] text-[#C3D0DE] leading-relaxed">
                {settings.address && <p className="whitespace-pre-line">{settings.address}</p>}
                {settings.hoursText && <p className="whitespace-pre-line">{settings.hoursText}</p>}
                {(settings.phone || settings.lineId) && (
                  <p className="text-lg font-semibold text-white">
                    {[settings.phone, settings.lineId && `LINE ${settings.lineId}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {settings.email && <p>{settings.email}</p>}
              </div>
            ) : (
              <p className="text-[15px] text-[#C3D0DE]">
                ติดต่อผ่านแบบฟอร์มนัดหมายในหน้าติดต่อเรา
              </p>
            )}
            <div className="pt-1 flex flex-wrap gap-5 text-sm text-[#C3D0DE]">
              <Link href="/contact" className="underline hover:text-white">นัดชมสถาบัน</Link>
              <Link href="/privacy-policy" className="underline hover:text-white">นโยบายความเป็นส่วนตัว</Link>
            </div>
          </div>
        </div>

        <p className="pt-6 text-sm text-[#9DB4C8]">
          © 2026 Somkid+ เครือสมคิดวิทยา
        </p>
      </div>
    </footer>
  );
}
