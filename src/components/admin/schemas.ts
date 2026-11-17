import {
  SKILL_DIMENSION_LABELS,
  type SkillDimensionKey,
} from "@/data/somkid-data";

export type Field =
  | {
      key: string;
      label: string;
      type: "text" | "textarea" | "number" | "checkbox" | "lines";
      hint?: string;
      placeholder?: string;
      /** display offset for numbers (stored = shown - offset) */
      offset?: number;
    }
  | {
      key: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
      hint?: string;
    }
  | {
      key: string;
      label: string;
      type: "list";
      hint?: string;
      itemLabel: (item: Record<string, unknown>, index: number) => string;
      newItem: () => Record<string, unknown>;
      fields: Field[];
    };

export interface CollectionSchema {
  title: string;
  description: string;
  kind: "object" | "list";
  fields: Field[];
  itemLabel?: (item: Record<string, unknown>, index: number) => string;
  newItem?: () => Record<string, unknown>;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

const opts = (values: string[]) =>
  values.map((v) => ({ value: v, label: v }));

const GRADE_GROUPS = ["อนุบาล", "ประถม", "มัธยม"];
const SUBJECTS = ["คณิตศาสตร์", "วิทยาศาสตร์", "อังกฤษ MEP", "สอบเข้า & Olympiad"];
const GOALS = [
  "ปูพื้นฐานและเพิ่มเกรด",
  "สอบเข้าหลักสูตร EP/MEP",
  "สอบแข่งขันระดับสากล",
];
const TIERS = [
  { value: "foundation", label: "Foundation (0–49%)" },
  { value: "accelerator", label: "Accelerator (50–79%)" },
  { value: "achiever", label: "Achiever (80–100%)" },
];
const DISCIPLINES = ["กีฬา & ว่ายน้ำ", "ดนตรีสากล", "ศิลปะ & Design", "Coding & Robotics"];
const DIMENSIONS = (
  Object.keys(SKILL_DIMENSION_LABELS) as SkillDimensionKey[]
).map((k) => ({ value: k, label: SKILL_DIMENSION_LABELS[k] }));

const str = (v: unknown) => (typeof v === "string" ? v : "");

export const SCHEMAS: Record<string, CollectionSchema> = {
  settings: {
    title: "ข้อมูลสถาบันและการติดต่อ",
    description:
      "ข้อมูลนี้แสดงที่ footer หน้าติดต่อ และหน้าแรก ช่องที่เว้นว่างจะไม่แสดงบนเว็บไซต์",
    kind: "object",
    fields: [
      { key: "phone", label: "เบอร์โทรศัพท์", type: "text", placeholder: "เช่น 038-000-000" },
      { key: "lineId", label: "LINE Official Account", type: "text", placeholder: "@yourline" },
      { key: "email", label: "อีเมล", type: "text" },
      { key: "address", label: "ที่อยู่สถาบัน", type: "textarea" },
      {
        key: "hoursText",
        label: "เวลาทำการ",
        type: "textarea",
        hint: "พิมพ์ได้หลายบรรทัด เช่น จันทร์–ศุกร์ 16:00–20:00 น.",
      },
      {
        key: "mapEmbedUrl",
        label: "ลิงก์แผนที่แบบฝัง (Google Maps Embed)",
        type: "text",
        hint: "Google Maps → แชร์ → ฝังแผนที่ → คัดลอกเฉพาะค่า src=\"...\"",
      },
      {
        key: "mapLinkUrl",
        label: "ลิงก์เปิดนำทางใน Google Maps",
        type: "text",
      },
      { key: "transitNote", label: "การเดินทาง", type: "textarea" },
      { key: "parkingNote", label: "ที่จอดรถ", type: "textarea" },
      {
        key: "highlights",
        label: "ตัวเลขจุดเด่นหน้าแรก (แนะนำ 3 ข้อ)",
        type: "list",
        hint: "ใส่เฉพาะตัวเลขที่เป็นความจริงเท่านั้น เช่น จำนวนนักเรียนต่อห้อง",
        itemLabel: (it) => `${str(it.value)} ${str(it.label)}`.trim() || "รายการใหม่",
        newItem: () => ({ value: "", label: "" }),
        fields: [
          { key: "value", label: "ตัวเลข/ข้อความเด่น", type: "text", placeholder: "เช่น 6–10 คน" },
          { key: "label", label: "คำอธิบาย", type: "text", placeholder: "เช่น ต่อห้อง" },
        ],
      },
    ],
  },

  courses: {
    title: "หลักสูตรวิชาการ",
    description: "คอร์สที่แสดงในหน้าวิชาการ หน้าแรก และเป็นตัวเลือกแนะนำหลังทำข้อสอบ",
    kind: "list",
    itemLabel: (it) => `${str(it.code)} ${str(it.title)}`.trim() || "คอร์สใหม่",
    newItem: () => ({
      id: `course-${uid()}`,
      published: false,
      code: "",
      title: "",
      subtitle: "",
      subject: SUBJECTS[0],
      gradeGroup: GRADE_GROUPS[1],
      gradeRange: "",
      examGoal: GOALS[0],
      tierMatch: "foundation",
      schedule: "",
      format: "",
      seatsTotal: 10,
      seatsRemaining: 10,
      tuitionThb: 0,
      durationWeeks: 12,
      outcomes: [],
    }),
    fields: [
      { key: "published", label: "แสดงบนเว็บไซต์", type: "checkbox" },
      { key: "code", label: "รหัสคอร์ส", type: "text", placeholder: "เช่น SMK-M101" },
      { key: "title", label: "ชื่อคอร์ส", type: "text" },
      { key: "subtitle", label: "คำอธิบายสั้น", type: "textarea" },
      { key: "subject", label: "วิชา", type: "select", options: opts(SUBJECTS) },
      { key: "gradeGroup", label: "ช่วงชั้น", type: "select", options: opts(GRADE_GROUPS) },
      { key: "gradeRange", label: "ระดับชั้นที่รับ", type: "text", placeholder: "เช่น ป.4 – ป.6" },
      { key: "examGoal", label: "เป้าหมายการเรียน", type: "select", options: opts(GOALS) },
      {
        key: "tierMatch",
        label: "แนะนำให้นักเรียนระดับคะแนน",
        type: "select",
        options: TIERS,
        hint: "ใช้จับคู่คอร์สอัตโนมัติหลังทำข้อสอบจำลอง",
      },
      { key: "schedule", label: "รอบเรียน", type: "text", placeholder: "เช่น เสาร์ 09:30 – 11:30 น." },
      { key: "format", label: "รูปแบบการสอน", type: "text" },
      { key: "seatsTotal", label: "จำนวนที่นั่งทั้งหมด", type: "number" },
      { key: "seatsRemaining", label: "ที่นั่งคงเหลือ", type: "number" },
      { key: "tuitionThb", label: "ค่าเล่าเรียน (บาท)", type: "number" },
      { key: "durationWeeks", label: "ระยะเวลา (สัปดาห์)", type: "number" },
      {
        key: "outcomes",
        label: "สิ่งที่ผู้เรียนจะทำได้ (1 บรรทัด = 1 ข้อ)",
        type: "lines",
      },
    ],
  },

  activities: {
    title: "กิจกรรมและกีฬา",
    description: "โปรแกรมที่แสดงในหน้ากิจกรรมและกีฬา พร้อมระบบจองคลาสทดลองเรียน",
    kind: "list",
    itemLabel: (it) => `${str(it.code)} ${str(it.title)}`.trim() || "กิจกรรมใหม่",
    newItem: () => ({
      id: `act-${uid()}`,
      published: false,
      code: "",
      discipline: DISCIPLINES[0],
      title: "",
      subtitle: "",
      ageRange: "",
      coachRatio: "",
      safetyAndEquipment: "",
      schedule: "",
      campDate: "",
      seatsRemaining: 10,
      trialFeeThb: 0,
      comboDiscountNote: "",
    }),
    fields: [
      { key: "published", label: "แสดงบนเว็บไซต์", type: "checkbox" },
      { key: "code", label: "รหัสกิจกรรม", type: "text" },
      { key: "discipline", label: "ประเภท", type: "select", options: opts(DISCIPLINES) },
      { key: "title", label: "ชื่อกิจกรรม", type: "text" },
      { key: "subtitle", label: "คำอธิบายสั้น", type: "textarea" },
      { key: "ageRange", label: "ช่วงอายุ", type: "text", placeholder: "เช่น 4 – 15 ปี" },
      { key: "coachRatio", label: "อัตราส่วนผู้สอนต่อผู้เรียน", type: "text" },
      { key: "safetyAndEquipment", label: "มาตรฐานอุปกรณ์และความปลอดภัย", type: "textarea" },
      { key: "schedule", label: "ตารางเรียนประจำสัปดาห์", type: "text" },
      { key: "campDate", label: "แคมป์ / กิจกรรมพิเศษ", type: "text" },
      { key: "seatsRemaining", label: "ที่นั่งคงเหลือ", type: "number" },
      { key: "trialFeeThb", label: "ค่าทดลองเรียน (บาท)", type: "number" },
      { key: "comboDiscountNote", label: "ข้อเสนอเมื่อเรียนควบคู่", type: "text" },
    ],
  },

  instructors: {
    title: "ทีมอาจารย์",
    description: "แสดงที่หน้าแรก ถ้าไม่มีรายการที่เปิดแสดง ส่วนนี้จะถูกซ่อนอัตโนมัติ",
    kind: "list",
    itemLabel: (it) => str(it.name) || "อาจารย์ใหม่",
    newItem: () => ({
      id: `inst-${uid()}`,
      published: true,
      name: "",
      role: "",
      credentials: "",
      focus: "",
      experienceYears: 0,
    }),
    fields: [
      { key: "published", label: "แสดงบนเว็บไซต์", type: "checkbox" },
      { key: "name", label: "ชื่อ-นามสกุล", type: "text" },
      { key: "role", label: "ตำแหน่ง", type: "text" },
      { key: "credentials", label: "วุฒิการศึกษา / ใบรับรอง", type: "text" },
      { key: "focus", label: "จุดเด่นการสอน", type: "textarea" },
      { key: "experienceYears", label: "ประสบการณ์ (ปี)", type: "number" },
    ],
  },

  testimonials: {
    title: "เสียงจากผู้ปกครอง / ผลลัพธ์ผู้เรียน",
    description:
      "ใช้เฉพาะเรื่องจริงที่ได้รับอนุญาตแล้วเท่านั้น ถ้าไม่มีรายการที่เปิดแสดง ส่วนนี้จะถูกซ่อน",
    kind: "list",
    itemLabel: (it) => str(it.studentInitial) || "รายการใหม่",
    newItem: () => ({
      id: `story-${uid()}`,
      published: true,
      studentInitial: "",
      grade: "",
      track: "",
      beforeAfter: "",
      quote: "",
    }),
    fields: [
      { key: "published", label: "แสดงบนเว็บไซต์", type: "checkbox" },
      { key: "studentInitial", label: "ชื่อที่แสดง", type: "text", placeholder: "เช่น น้อง A (ป.5)" },
      { key: "grade", label: "ระดับชั้น", type: "text" },
      { key: "track", label: "คอร์สที่เรียน", type: "text" },
      { key: "beforeAfter", label: "ผลลัพธ์ที่วัดได้", type: "text", placeholder: "เช่น คะแนนจาก 46% เป็น 84%" },
      { key: "quote", label: "ข้อความจากผู้ปกครอง", type: "textarea" },
    ],
  },

  examTracks: {
    title: "ชุดข้อสอบวัดระดับ",
    description:
      "แก้ชื่อชุดข้อสอบ ข้อคำถาม ตัวเลือก เฉลย และมิติทักษะที่วัด (ข้อสอบชุดเริ่มต้นเป็นตัวอย่าง ควรแทนที่ด้วยข้อสอบของสถาบัน)",
    kind: "list",
    itemLabel: (it) => str(it.title) || "ชุดข้อสอบใหม่",
    newItem: () => ({
      id: `exam-${uid()}`,
      published: false,
      title: "",
      subjectLabel: "",
      gradeLabel: "",
      durationMinutes: 15,
      description: "",
      questions: [],
    }),
    fields: [
      { key: "published", label: "เปิดให้ทำข้อสอบ", type: "checkbox" },
      { key: "title", label: "ชื่อชุดข้อสอบ", type: "text" },
      { key: "subjectLabel", label: "ชื่อวิชา (ภาษาอังกฤษสั้นๆ)", type: "text" },
      { key: "gradeLabel", label: "ระดับชั้น", type: "text" },
      { key: "durationMinutes", label: "เวลาที่แนะนำ (นาที)", type: "number" },
      { key: "description", label: "คำอธิบาย", type: "textarea" },
      {
        key: "questions",
        label: "ข้อสอบ",
        type: "list",
        itemLabel: (it, i) => `ข้อ ${i + 1}: ${str(it.prompt).slice(0, 48)}`,
        newItem: () => ({
          id: `q-${uid()}`,
          dimension: "conceptual",
          prompt: "",
          options: ["", "", "", ""],
          correctIndex: 0,
          explanation: "",
        }),
        fields: [
          { key: "dimension", label: "มิติทักษะที่วัด", type: "select", options: DIMENSIONS },
          { key: "prompt", label: "โจทย์", type: "textarea" },
          { key: "options", label: "ตัวเลือก (1 บรรทัด = 1 ตัวเลือก)", type: "lines" },
          {
            key: "correctIndex",
            label: "ตัวเลือกที่ถูก (นับจาก 1)",
            type: "number",
            offset: 1,
            hint: "เช่น ถ้าข้อที่ 2 ถูก ให้ใส่ 2",
          },
          { key: "explanation", label: "คำอธิบายเฉลย", type: "textarea" },
        ],
      },
    ],
  },
};
