import { NextResponse } from "next/server";
import { createSession, passwordMatches, adminConfigured } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า ADMIN_PASSWORD ในไฟล์ .env.local" },
      { status: 500 }
    );
  }
  const body = await request.json().catch(() => ({}));
  if (!passwordMatches(String(body?.password ?? ""))) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  await createSession();
  return NextResponse.json({ ok: true });
}
