import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import {
  SUBMISSION_STATUSES,
  updateSubmission,
  type SubmissionStatus,
} from "@/lib/content-store";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const patch: { status?: SubmissionStatus; adminNote?: string } = {};
  if (body.status !== undefined) {
    if (!(SUBMISSION_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = body.status as SubmissionStatus;
  }
  if (body.adminNote !== undefined) {
    patch.adminNote = String(body.adminNote).slice(0, 1000);
  }
  const ok = await updateSubmission(id, patch);
  if (!ok) {
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
