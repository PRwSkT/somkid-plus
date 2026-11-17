import { isAdmin } from "@/lib/admin-auth";
import { readSubmissions } from "@/lib/content-store";

function esc(v: unknown): string {
  let s = v === undefined || v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  // Mitigate CSV Formula Injection (CWE-1236): prefix dangerous formula characters with single quote
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) {
    return new Response("Unauthorized", { status: 401 });
  }
  const subs = await readSubmissions();
  const keys = Array.from(new Set(subs.flatMap((s) => Object.keys(s.data))));
  const header = ["createdAt", "type", ...keys].map(esc).join(",");
  const rows = subs.map((s) =>
    [s.createdAt, s.type, ...keys.map((k) => s.data[k])].map(esc).join(",")
  );
  // BOM so Excel opens Thai text correctly
  const body = "\uFEFF" + [header, ...rows].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="somkid-submissions.csv"',
    },
  });
}
