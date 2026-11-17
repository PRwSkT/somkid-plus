import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdmin } from "@/lib/admin-auth";
import {
  COLLECTIONS,
  readContent,
  writeCollection,
  type CollectionName,
} from "@/lib/content-store";

function validName(name: string): name is CollectionName {
  return (COLLECTIONS as readonly string[]).includes(name);
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ collection: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { collection } = await ctx.params;
  if (!validName(collection)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const content = await readContent();
  return NextResponse.json({ data: content[collection] });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ collection: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { collection } = await ctx.params;
  if (!validName(collection)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  if (!body || body.data === undefined) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const isList = collection !== "settings";
  if (isList && !Array.isArray(body.data)) {
    return NextResponse.json({ error: "Expected a list" }, { status: 400 });
  }
  try {
    await writeCollection(collection, body.data);
  } catch {
    return NextResponse.json(
      { error: "บันทึกไม่สำเร็จ: เซิร์ฟเวอร์เขียนไฟล์ไม่ได้" },
      { status: 500 }
    );
  }
  revalidateTag("content", { expire: 0 });
  return NextResponse.json({ ok: true });
}
