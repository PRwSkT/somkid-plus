import type { Metadata } from "next";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว (PDPA & Google OAuth)",
  description:
    "นโยบายการคุ้มครองข้อมูลส่วนบุคคลของสถาบัน Somkid+ และการขอสิทธิ์เข้าถึงข้อมูลผ่าน Google OAuth 2.0",
};

export default async function PrivacyPolicyPage() {
  const { settings } = await getSiteContent();

  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      <header className="pb-8 hairline-b space-y-2">
        <p className="font-mono-tech text-sm text-[#1E5079]">
          PDPA &amp; OAuth 2.0 Compliance
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-[#0F2A42]">
          นโยบายความเป็นส่วนตัว (Privacy Policy)
        </h1>
        <p className="text-sm text-[#5A6F83]">
          สถาบัน Somkid+ (เครือสมคิดวิทยา) · ปรับปรุงล่าสุด: พฤศจิกายน 2026
        </p>
      </header>

      <section className="space-y-3 text-sm sm:text-base text-[#2B4660] leading-relaxed">
        <h2 className="text-xl font-semibold text-[#0F2A42]">
          1. ข้อมูลที่จัดเก็บและการเชื่อมต่อ Google OAuth 2.0
        </h2>
        <p>
          เมื่อผู้ปกครองหรือนักเรียนเข้าสู่ระบบด้วยบัญชี Google (Gmail) เพื่อปลดล็อกผลสอบจำลอง
          Somkid+ จะขอสิทธิ์เข้าถึงเฉพาะข้อมูลพื้นฐานตามมาตรฐาน OpenID Connect ได้แก่{" "}
          <code className="font-mono-tech text-sm bg-white px-1.5 py-0.5 border border-[#D3DEE8]">
            openid
          </code>
          ,{" "}
          <code className="font-mono-tech text-sm bg-white px-1.5 py-0.5 border border-[#D3DEE8]">
            email
          </code>{" "}
          และ{" "}
          <code className="font-mono-tech text-sm bg-white px-1.5 py-0.5 border border-[#D3DEE8]">
            profile
          </code>{" "}
          เท่านั้น โดยไม่เข้าถึงอีเมลส่วนตัว รายชื่อผู้ติดต่อ หรือไฟล์ใน Google Drive ของท่าน
        </p>
      </section>

      <section className="space-y-3 text-sm sm:text-base text-[#2B4660] leading-relaxed">
        <h2 className="text-xl font-semibold text-[#0F2A42]">
          2. วัตถุประสงค์การใช้ข้อมูลเบอร์โทรศัพท์และ LINE ID
        </h2>
        <p>
          ข้อมูลเบอร์โทรศัพท์และ LINE ID ที่ท่านกรอกเพิ่มเติมหลังการทำข้อสอบจำลอง
          หรือผ่านแบบฟอร์มจองคลาสทดลองเรียนและนัดหมายเยี่ยมชมสถาบัน จะถูกนำไปใช้เฉพาะเพื่อ:
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>จัดส่งรายงานผลวิเคราะห์ทักษะ 5 มิติฉบับเต็ม (PDF) และแผนการเรียนแนะนำ</li>
          <li>ประสานงานยืนยันรอบทดลองเรียน ตารางเรียนกลุ่มย่อย และสิทธิ์ส่วนลดค่าเล่าเรียน</li>
          <li>ให้คำปรึกษาด้านการศึกษา 1:1 โดยทีมแนะแนวของสถาบัน Somkid+</li>
        </ul>
      </section>

      <section className="space-y-3 text-sm sm:text-base text-[#2B4660] leading-relaxed">
        <h2 className="text-xl font-semibold text-[#0F2A42]">
          3. สิทธิของเจ้าของข้อมูลส่วนบุคคลและช่องทางติดต่อ
        </h2>
        <p>
          ท่านสามารถขอตรวจสอบ แก้ไข หรือขอลบข้อมูลส่วนบุคคลของท่านออกจากระบบฐานข้อมูลได้ตลอดเวลา
          {(settings.email || settings.lineId || settings.phone) ? (
            <>
              {" "}ผ่านช่องทางติดต่อของสถาบัน:{" "}
              {settings.email && (
                <>
                  อีเมล{" "}
                  <a
                    href={`mailto:${settings.email}`}
                    className="underline text-[#1E5079]"
                  >
                    {settings.email}
                  </a>
                </>
              )}
              {settings.lineId && (
                <>
                  {settings.email ? " · " : ""}
                  LINE Official Account <strong>{settings.lineId}</strong>
                </>
              )}
              {settings.phone && (
                <>
                  {(settings.email || settings.lineId) ? " · " : ""}
                  โทรศัพท์ <strong>{settings.phone}</strong>
                </>
              )}
            </>
          ) : (
            " ผ่านแบบฟอร์มในหน้าติดต่อเรา"
          )}
        </p>
        {settings.address && (
          <p className="text-sm text-[#5A6F83]">ที่อยู่: {settings.address}</p>
        )}
      </section>
    </article>
  );
}
