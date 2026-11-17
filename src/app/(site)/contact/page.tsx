import type { Metadata } from "next";
import { ContactClient } from "@/components/ContactClient";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "ข้อมูลติดต่อ & นัดเยี่ยมชม",
  description:
    "แผนที่การเดินทาง ที่อยู่ ช่องทางติดต่อ และระบบนัดหมายเยี่ยมชมสถาบัน Somkid+",
};

export default async function ContactPage() {
  const { settings } = await getSiteContent();
  return <ContactClient settings={settings} />;
}
