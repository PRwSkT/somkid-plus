import type { Metadata } from "next";
import { Suspense } from "react";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminShell } from "@/components/admin/AdminShell";

export const instant = false;

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

async function Gate({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) {
    return <AdminLogin configured={adminConfigured()} />;
  }
  return <AdminShell>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8 text-[#5A6F83]">กำลังโหลด...</div>}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
