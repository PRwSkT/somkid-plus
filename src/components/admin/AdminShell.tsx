"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "ภาพรวม" },
  { href: "/admin/submissions", label: "ผู้สนใจ / การจอง" },
  { href: "/admin/courses", label: "หลักสูตรวิชาการ" },
  { href: "/admin/activities", label: "กิจกรรมและกีฬา" },
  { href: "/admin/exams", label: "ข้อสอบวัดระดับ" },
  { href: "/admin/instructors", label: "ทีมอาจารย์" },
  { href: "/admin/testimonials", label: "เสียงผู้ปกครอง" },
  { href: "/admin/settings", label: "ข้อมูลติดต่อ" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] md:flex">
      <aside className="md:w-64 md:min-h-screen bg-[#0F2A42] text-white md:sticky md:top-0 md:h-screen flex md:flex-col">
        <div className="p-5 hidden md:block">
          <div className="inline-flex bg-white rounded-md px-3 py-2">
            <Image
              src="/images/somkid-logo.png"
              alt="Somkid+"
              width={120}
              height={24}
              className="h-6 w-auto"
            />
          </div>
          <p className="text-sm text-[#9DB4C8] mt-3">ระบบจัดการเว็บไซต์</p>
        </div>
        <nav aria-label="Admin" className="flex md:flex-col overflow-x-auto md:overflow-visible px-2 md:px-3 py-2 gap-1 flex-1">
          {LINKS.map((l) => {
            const active =
              l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap px-3 py-2.5 rounded-lg text-[15px] ${
                  active
                    ? "bg-[#00D1FF] text-[#0F2A42] font-semibold"
                    : "text-[#D6E4F0] hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 hidden md:flex flex-col gap-2 text-sm">
          <Link href="/" target="_blank" className="px-3 py-2 rounded-lg text-[#D6E4F0] hover:bg-white/10">
            ดูหน้าเว็บไซต์ ↗
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-left px-3 py-2 rounded-lg text-[#D6E4F0] hover:bg-white/10"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 px-4 sm:px-8 pb-16">
        <div className="md:hidden flex justify-end gap-3 py-2 text-sm">
          <Link href="/" target="_blank" className="text-[#1E5079] underline">เว็บไซต์</Link>
          <button type="button" onClick={logout} className="text-[#1E5079] underline">ออกจากระบบ</button>
        </div>
        {children}
      </div>
    </div>
  );
}
