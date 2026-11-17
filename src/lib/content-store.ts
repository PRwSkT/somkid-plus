import "server-only";
import { promises as fs } from "fs";
import path from "path";
import {
  SEED_ACTIVITIES,
  SEED_COURSES,
  SEED_EXAM_TRACKS,
  type SiteContent,
} from "@/data/somkid-data";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

export const COLLECTIONS = [
  "settings",
  "courses",
  "activities",
  "instructors",
  "testimonials",
  "examTracks",
] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

export function defaultContent(): SiteContent {
  return {
    settings: {
      phone: "038-611251",
      lineId: "@404hylms",
      email: "mail@somkidvittaya.ac.th",
      address: "80/5 ถ.หลังวัดป่าประดู่ ต.ท่าประดู่ อ.เมืองระยอง จ.ระยอง 21000",
      hoursText: "",
      mapEmbedUrl:
        "https://maps.google.com/maps?q=%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B8%AA%E0%B8%A1%E0%B8%84%E0%B8%B4%E0%B8%94%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2&t=&z=16&ie=UTF8&iwloc=B&output=embed",
      mapLinkUrl:
        "https://maps.google.com/?q=%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B9%80%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%99%E0%B8%AA%E0%B8%A1%E0%B8%84%E0%B8%B4%E0%B8%94%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2",
      transitNote: "",
      parkingNote: "",
      highlights: [
        { value: "66 ปี", label: "เครือสมคิดวิทยา จ.ระยอง" },
        { value: "กลุ่มย่อย", label: "ดูแลรายบุคคล" },
        { value: "5 ทักษะ", label: "ประเมินก่อนเริ่มเรียน" },
      ],
    },
    courses: SEED_COURSES,
    activities: SEED_ACTIVITIES,
    instructors: [],
    testimonials: [],
    examTracks: SEED_EXAM_TRACKS,
  };
}

export async function readContent(): Promise<SiteContent> {
  try {
    const raw = await fs.readFile(CONTENT_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<SiteContent>;
    const base = defaultContent();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return defaultContent();
  }
}

export async function writeCollection(
  name: CollectionName,
  value: unknown
): Promise<void> {
  const current = await readContent();
  const next = { ...current, [name]: value } as SiteContent;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CONTENT_FILE, JSON.stringify(next, null, 2), "utf-8");
}

export interface Submission {
  id: string;
  type: "mock_exam_lead" | "enrollment" | "trial_class" | "campus_visit";
  createdAt: string;
  data: Record<string, unknown>;
}

export async function readSubmissions(): Promise<Submission[]> {
  try {
    const raw = await fs.readFile(SUBMISSIONS_FILE, "utf-8");
    return JSON.parse(raw) as Submission[];
  } catch {
    return [];
  }
}

export async function appendSubmission(
  type: Submission["type"],
  data: Record<string, unknown>
): Promise<void> {
  try {
    const list = await readSubmissions();
    list.unshift({
      id: crypto.randomUUID(),
      type,
      createdAt: new Date().toISOString(),
      data,
    });
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // read-only filesystems (serverless) cannot persist; Supabase/webhook remain
  }
}
