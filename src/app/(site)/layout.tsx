import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSiteContent } from "@/lib/site-content";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = await getSiteContent();
  return (
    <>
      <a
        href="#main-content"
        className="visually-hidden focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[#0F2A42] focus:text-white focus:px-4 focus:py-2"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
