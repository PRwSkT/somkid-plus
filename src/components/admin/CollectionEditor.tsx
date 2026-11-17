"use client";

import { useEffect, useId, useState } from "react";
import { SCHEMAS, type Field } from "./schemas";

type Obj = Record<string, unknown>;

const inputCls =
  "w-full min-h-11 px-3 py-2 border-[1.5px] border-[#D3DEE8] rounded-md bg-white text-[#0F2A42] text-[15px] focus-visible:outline-[3px] focus-visible:outline-[#00D1FF]";

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const id = useId();

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 min-h-11 cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 accent-[#1E5079]"
        />
        <span className="font-semibold text-[#0F2A42]">{field.label}</span>
      </label>
    );
  }

  if (field.type === "list") {
    const items = (Array.isArray(value) ? value : []) as Obj[];
    return (
      <div className="space-y-3">
        <div>
          <p className="font-semibold text-[#0F2A42]">{field.label}</p>
          {field.hint && <p className="text-sm text-[#5A6F83]">{field.hint}</p>}
        </div>
        {items.map((item, i) => (
          <details
            key={i}
            className="border border-[#D3DEE8] rounded-lg bg-[#F7F9FB] open:bg-white"
          >
            <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between gap-3">
              <span className="font-semibold text-[#0F2A42] truncate">
                {field.itemLabel(item, i)}
              </span>
              <span className="flex gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
                <MiniBtn
                  label="ย้ายขึ้น"
                  disabled={i === 0}
                  onClick={() => {
                    const next = [...items];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    onChange(next);
                  }}
                >
                  ↑
                </MiniBtn>
                <MiniBtn
                  label="ย้ายลง"
                  disabled={i === items.length - 1}
                  onClick={() => {
                    const next = [...items];
                    [next[i + 1], next[i]] = [next[i], next[i + 1]];
                    onChange(next);
                  }}
                >
                  ↓
                </MiniBtn>
                <MiniBtn
                  label="ลบรายการนี้"
                  danger
                  onClick={() => {
                    if (confirm("ลบรายการนี้?")) {
                      onChange(items.filter((_, idx) => idx !== i));
                    }
                  }}
                >
                  ลบ
                </MiniBtn>
              </span>
            </summary>
            <div className="px-4 pb-5 pt-2 space-y-4 border-t border-[#D3DEE8]">
              <ObjectFields
                fields={field.fields}
                value={item}
                onChange={(nv) => onChange(items.map((x, idx) => (idx === i ? nv : x)))}
              />
            </div>
          </details>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, field.newItem()])}
          className="px-4 py-2.5 rounded-full border-2 border-dashed border-[#1E5079] text-[#1E5079] font-semibold text-sm hover:bg-[#E0F8FF]"
        >
          + เพิ่มรายการ
        </button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="block font-semibold text-[#0F2A42] mb-1.5">
        {field.label}
      </label>
      {field.type === "textarea" ? (
        <textarea
          id={id}
          rows={3}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      ) : field.type === "lines" ? (
        <textarea
          id={id}
          rows={5}
          value={Array.isArray(value) ? (value as string[]).join("\n") : ""}
          onChange={(e) => onChange(e.target.value.split("\n"))}
          className={inputCls}
        />
      ) : field.type === "number" ? (
        <input
          id={id}
          type="number"
          value={
            typeof value === "number" ? value + (field.offset ?? 0) : ""
          }
          onChange={(e) =>
            onChange(
              e.target.value === "" ? 0 : Number(e.target.value) - (field.offset ?? 0)
            )
          }
          className={inputCls}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type="text"
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      )}
      {field.hint && <p className="text-sm text-[#5A6F83] mt-1">{field.hint}</p>}
    </div>
  );
}

function MiniBtn({
  children,
  onClick,
  label,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`min-w-9 h-9 px-2 rounded-md border text-sm font-semibold disabled:opacity-30 ${
        danger
          ? "border-[#B3261E] text-[#B3261E] hover:bg-[#fdf3f2]"
          : "border-[#D3DEE8] text-[#0F2A42] hover:bg-[#F2F6F9]"
      }`}
    >
      {children}
    </button>
  );
}

function ObjectFields({
  fields,
  value,
  onChange,
}: {
  fields: Field[];
  value: Obj;
  onChange: (v: Obj) => void;
}) {
  return (
    <>
      {fields.map((f) => (
        <FieldInput
          key={f.key}
          field={f}
          value={value[f.key]}
          onChange={(v) => onChange({ ...value, [f.key]: v })}
        />
      ))}
    </>
  );
}

export function CollectionEditor({ collection }: { collection: string }) {
  const schema = SCHEMAS[collection];
  const [data, setData] = useState<unknown>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/content/${collection}`)
      .then((r) => r.json())
      .then((j) => {
        if (active) setData(j.data);
      })
      .catch(() => {
        if (active) setStatus({ kind: "err", text: "โหลดข้อมูลไม่สำเร็จ" });
      });
    return () => {
      active = false;
    };
  }, [collection]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/content/${collection}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "บันทึกไม่สำเร็จ");
      setDirty(false);
      setStatus({ kind: "ok", text: "บันทึกแล้ว เว็บไซต์อัปเดตเรียบร้อย" });
    } catch (e) {
      setStatus({ kind: "err", text: e instanceof Error ? e.message : "บันทึกไม่สำเร็จ" });
    } finally {
      setSaving(false);
    }
  }

  if (!schema) return <p>ไม่พบหมวดข้อมูลนี้</p>;
  if (data === null) return <p className="text-[#5A6F83]">กำลังโหลด...</p>;

  const set = (v: unknown) => {
    setData(v);
    setDirty(true);
    setStatus(null);
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 bg-[#F7F9FB]/95 backdrop-blur border-b border-[#D3DEE8] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl text-[#0F2A42]">{schema.title}</h1>
          <p className="text-sm text-[#5A6F83]">{schema.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <span
              role="status"
              className={`text-sm font-semibold ${
                status.kind === "ok" ? "text-[#17803D]" : "text-[#B3261E]"
              }`}
            >
              {status.text}
            </span>
          )}
          {dirty && !status && (
            <span className="text-sm text-[#5A6F83]">มีการแก้ไขที่ยังไม่บันทึก</span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="px-6 py-2.5 rounded-full bg-[#1E5079] hover:bg-[#143E61] disabled:opacity-40 text-white font-semibold"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>

      {schema.kind === "object" ? (
        <div className="bg-white border border-[#D3DEE8] rounded-xl p-6 space-y-5 max-w-3xl">
          <ObjectFields
            fields={schema.fields}
            value={data as Obj}
            onChange={(v) => set(v)}
          />
        </div>
      ) : (
        <div className="max-w-4xl">
          <FieldInput
            field={{
              key: "_root",
              label: "รายการทั้งหมด",
              type: "list",
              itemLabel: schema.itemLabel!,
              newItem: schema.newItem!,
              fields: schema.fields,
            }}
            value={data}
            onChange={set}
          />
        </div>
      )}
    </div>
  );
}
