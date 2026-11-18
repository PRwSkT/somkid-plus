import "server-only";
import { promises as fs } from "fs";
import path from "path";
import {
  SEED_ACTIVITIES,
  SEED_COURSES,
  SEED_EXAM_TRACKS,
  type SiteContent,
} from "@/data/somkid-data";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

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
  const base = defaultContent();
  let localData: Partial<SiteContent> = {};

  try {
    const raw = await fs.readFile(CONTENT_FILE, "utf-8");
    localData = JSON.parse(raw) as Partial<SiteContent>;
  } catch {
    // Local file does not exist or unreadable; proceed with defaults
  }

  const supabase = getAdminSupabaseClient();
  let dbData: Partial<SiteContent> = {};

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("collection, data");
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (row.collection && row.data !== undefined) {
            (dbData as Record<string, unknown>)[row.collection] = row.data;
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch site_content from Supabase, using local fallback:", err);
    }
  }

  return {
    ...base,
    ...localData,
    ...dbData,
    settings: {
      ...base.settings,
      ...(localData.settings ?? {}),
      ...(dbData.settings ?? {}),
    },
  };
}

export async function writeCollection(
  name: CollectionName,
  value: unknown
): Promise<void> {
  const supabase = getAdminSupabaseClient();
  let supabasePersisted = false;

  if (supabase) {
    const { error } = await supabase
      .from("site_content")
      .upsert(
        {
          collection: name,
          data: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "collection" }
      );

    if (error) {
      console.error(`Supabase writeCollection error for [${name}]:`, error);
      throw new Error(`Failed to save to database: ${error.message}`);
    }
    supabasePersisted = true;
  }

  // Attempt local file write for local development environment (read-only on serverless)
  try {
    const current = await readContent();
    const next = { ...current, [name]: value } as SiteContent;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(CONTENT_FILE, JSON.stringify(next, null, 2), "utf-8");
  } catch (fsError) {
    if (!supabasePersisted) {
      console.error("Filesystem write failed and Supabase is not available:", fsError);
      throw fsError;
    }
    // Expected on serverless runtimes with read-only root filesystems
  }
}

export interface Submission {
  id: string;
  type: "mock_exam_lead" | "enrollment" | "trial_class" | "campus_visit";
  createdAt: string;
  data: Record<string, unknown>;
}

export async function readSubmissions(): Promise<Submission[]> {
  const supabase = getAdminSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("site_submissions")
        .select("id, type, data, created_at")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          type: row.type as Submission["type"],
          createdAt: row.created_at,
          data: (row.data ?? {}) as Record<string, unknown>,
        }));
      }
    } catch (err) {
      console.warn("Failed to fetch site_submissions from Supabase:", err);
    }
  }

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
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const supabase = getAdminSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("site_submissions").insert({
        id,
        type,
        data,
        created_at: createdAt,
      });
    } catch (err) {
      console.error("Supabase appendSubmission error:", err);
    }
  }

  try {
    const list = await readSubmissions();
    list.unshift({
      id,
      type,
      createdAt,
      data,
    });
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // Read-only filesystem on serverless; database persistence handles it
  }
}
