import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { readContent } from "@/lib/content-store";
import type { SiteContent } from "@/data/somkid-data";

/** Public, cached read of site content. Invalidated by admin saves via tag "content". */
export async function getSiteContent(): Promise<SiteContent> {
  "use cache";
  cacheTag("content");
  cacheLife("hours");
  return readContent();
}
