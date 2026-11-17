"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: fd.get("password") }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "เข้าสู่ระบบไม่สำเร็จ");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F7F9FB]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white border border-[#D3DEE8] rounded-2xl p-8 space-y-5 shadow-sm"
      >
        <div>
          <p className="text-sm font-semibold text-[#1E5079]">Somkid+ Admin</p>
          <h1 className="text-2xl text-[#0F2A42]">เข้าสู่ระบบจัดการเว็บไซต์</h1>
        </div>
        {!configured && (
          <p className="text-sm text-[#B3261E] bg-[#fdf3f2] rounded-md p-3">
            ยังไม่ได้ตั้งค่า ADMIN_PASSWORD และ ADMIN_SESSION_SECRET ในไฟล์ .env.local
          </p>
        )}
        <div>
          <label htmlFor="pw" className="block font-semibold text-[#0F2A42] mb-1.5">
            รหัสผ่านผู้ดูแล
          </label>
          <input
            id="pw"
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            className="somkid-input"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-[#B3261E]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-[#1E5079] hover:bg-[#143E61] disabled:opacity-50 text-white font-semibold py-3 rounded-full"
        >
          {busy ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}
