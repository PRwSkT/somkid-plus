"use client";

import { useState } from "react";

const OPTIONS: { value: string; label: string }[] = [
  { value: "new", label: "ใหม่" },
  { value: "contacted", label: "ติดต่อแล้ว" },
  { value: "trial_booked", label: "นัดทดลองเรียน" },
  { value: "enrolled", label: "สมัครแล้ว" },
  { value: "closed", label: "ปิดเคส" },
];

export default function SubmissionStatus({
  id,
  status,
  note,
}: {
  id: string;
  status: string;
  note: string;
}) {
  const [value, setValue] = useState(status);
  const [noteValue, setNoteValue] = useState(note);
  const [savedNote, setSavedNote] = useState(note);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(body: Record<string, string>) {
    setMsg("กำลังบันทึก...");
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setMsg("บันทึกแล้ว");
      return true;
    }
    setMsg("บันทึกไม่สำเร็จ");
    return false;
  }

  return (
    <div className="space-y-1.5 min-w-[190px]">
      <select
        value={value}
        onChange={async (e) => {
          const prev = value;
          setValue(e.target.value);
          if (!(await patch({ status: e.target.value }))) setValue(prev);
        }}
        className="w-full border border-[#D3DEE8] rounded-lg px-2 py-1.5 text-sm bg-white"
        aria-label="สถานะการติดตาม"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <input
        value={noteValue}
        onChange={(e) => setNoteValue(e.target.value)}
        onBlur={async () => {
          if (noteValue !== savedNote && (await patch({ adminNote: noteValue }))) {
            setSavedNote(noteValue);
          }
        }}
        maxLength={1000}
        placeholder="บันทึกการติดตาม"
        className="w-full border border-[#D3DEE8] rounded-lg px-2 py-1.5 text-sm"
        aria-label="บันทึกการติดตาม"
      />
      {msg && <div className="text-xs text-[#5A6F83]">{msg}</div>}
    </div>
  );
}
