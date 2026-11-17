import type { Metadata } from "next";
import { ActivitiesClient } from "@/components/ActivitiesClient";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "กิจกรรมและกีฬา",
  description: "กิจกรรม กีฬา ดนตรี ศิลปะ และทักษะอื่นๆ พร้อมระบบจองคลาสทดลองเรียน",
};

export default async function ActivitiesSportsPage() {
  const content = await getSiteContent();
  const activities = content.activities.filter((a) => a.published);
  if (activities.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center space-y-3">
        <h1 className="text-4xl text-[#0F2A42]">กิจกรรมและกีฬา</h1>
        <p className="text-[#5A6F83]">กำลังเตรียมข้อมูลกิจกรรม โปรดติดตามเร็วๆ นี้</p>
      </div>
    );
  }
  return <ActivitiesClient activities={activities} />;
}
