"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/", label: "หน้าหลัก" },
  { href: "/academics", label: "วิชาการ" },
  { href: "/activities-sports", label: "กิจกรรมและกีฬา" },
  { href: "/contact", label: "ติดต่อเรา" },
];

interface HeaderUser {
  email: string;
  name: string;
  avatarUrl?: string;
}

export function SiteHeader() {
  const pathname = usePathname();
  const popoverRef = useRef<HTMLUListElement>(null);
  const [user, setUser] = useState<HeaderUser | null>(null);

  useEffect(() => {
    if (
      typeof HTMLElement !== "undefined" &&
      !Object.hasOwn(HTMLElement.prototype, "popover")
    ) {
      import("@oddbird/popover-polyfill").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email || "",
          avatarUrl:
            (data.user.user_metadata?.avatar_url as string) ||
            (data.user.user_metadata?.picture as string) ||
            undefined,
          name:
            (data.user.user_metadata?.full_name as string) ||
            (data.user.user_metadata?.name as string) ||
            data.user.email?.split("@")[0] ||
            "ผู้ปกครอง",
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email || "",
          avatarUrl:
            (session.user.user_metadata?.avatar_url as string) ||
            (session.user.user_metadata?.picture as string) ||
            undefined,
          name:
            (session.user.user_metadata?.full_name as string) ||
            (session.user.user_metadata?.name as string) ||
            session.user.email?.split("@")[0] ||
            "ผู้ปกครอง",
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const el = popoverRef.current as
      | (HTMLUListElement & { hidePopover?: () => void })
      | null;
    if (el && el.matches(":popover-open")) {
      el.hidePopover?.();
    }
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      window.location.reload();
    }
  };

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#D3DEE8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0 py-1" aria-label="Somkid+ หน้าหลัก">
          <Image
            src="/images/somkid-logo.png"
            alt="Somkid+"
            width={150}
            height={30}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-3 lg:gap-6">
          <ul className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className={`relative px-3 py-2 text-[15px] whitespace-nowrap transition-colors ${
                    isCurrent(item.href)
                      ? "font-semibold text-[#1E5079] after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-[3px] after:bg-[#00D1FF]"
                      : "text-[#2B4660] hover:text-[#1E5079]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/mock-exam"
            className="inline-flex items-center gap-2 bg-[#00D1FF] hover:bg-[#33DCFF] text-[#0F2A42] text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
          >
            <span
              className="plus-mark-navy plus-mark text-[0.9rem]"
              aria-hidden="true"
            />
            <span>วัดระดับฟรี</span>
          </Link>

          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#D3DEE8]">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-[#D3DEE8] object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1E5079] text-white text-xs font-bold flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left text-xs leading-tight">
                <span className="font-semibold text-[#0F2A42] block max-w-[120px] truncate">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-[11px] text-[#5A6F83] hover:text-[#B31B1B] underline"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center min-w-11 min-h-11 px-3 border border-[#D3DEE8] rounded-full bg-white text-[#0F2A42] text-sm font-semibold"
            popoverTarget="mobile-site-menu"
            popoverTargetAction="toggle"
            aria-controls="mobile-site-menu"
          >
            เมนู
          </button>

          <ul
            ref={popoverRef}
            id="mobile-site-menu"
            popover="auto"
            className="md:hidden fixed top-20 right-4 left-auto w-72 max-w-[calc(100dvw-2rem)] bg-white border border-[#D3DEE8] rounded-xl p-2 shadow-xl m-0"
          >
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className={`block px-4 py-3 rounded-lg text-[15px] ${
                    isCurrent(item.href)
                      ? "font-semibold text-[#1E5079] bg-[#E0F8FF]"
                      : "text-[#0F2A42] hover:bg-[#F2F6F9]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {user && (
              <li className="pt-2 mt-2 border-t border-[#D3DEE8] px-4 py-3 flex items-center justify-between text-xs">
                <div className="truncate mr-2">
                  <p className="font-semibold text-[#0F2A42] truncate">
                    {user.name}
                  </p>
                  <p className="text-[#5A6F83] truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-[#B31B1B] hover:underline font-semibold shrink-0"
                >
                  ออกจากระบบ
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
