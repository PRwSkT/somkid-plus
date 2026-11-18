import type { MetadataRoute } from "next";

const BASE = "https://somkidplus.somkidvittaya.ac.th";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/academics", "/activities-sports", "/mock-exam", "/contact", "/privacy-policy"].map(
    (path) => ({
      url: `${BASE}${path}`,
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : path === "/mock-exam" ? 0.9 : 0.7,
    })
  );
}
