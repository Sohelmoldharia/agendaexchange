import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/anime/meta";
import { getAllSites } from "@/lib/anime/sites";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const sitePages = getAllSites().map((s) => ({
    url: `${SITE_URL}/anime/site/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: `${SITE_URL}/anime`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/anime/graveyard`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...sitePages,
  ];
}
