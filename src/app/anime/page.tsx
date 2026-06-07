import type { Metadata } from "next";
import { Directory } from "@/components/anime/Directory";
import { BRAND, SITE_URL } from "@/lib/anime/meta";
import { getAllSites } from "@/lib/anime/sites";

type StatusFilter = "all" | "legal" | "free" | "blocked" | "shutdown";
const VALID: StatusFilter[] = ["all", "legal", "free", "blocked", "shutdown"];

export const metadata: Metadata = {
  title: "The anime site index — every anime & manga site, mapped",
  description: BRAND.blurb,
  alternates: { canonical: "/anime" },
};

export default async function AnimeHome({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const initial: StatusFilter = VALID.includes(status as StatusFilter)
    ? (status as StatusFilter)
    : "all";

  const sites = getAllSites();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: BRAND.full,
    description: BRAND.blurb,
    url: `${SITE_URL}/anime`,
    isPartOf: { "@type": "WebSite", name: BRAND.name, url: `${SITE_URL}/anime` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: sites.length,
      itemListElement: sites.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: s.name,
        url: s.url ?? `${SITE_URL}/anime/site/${s.slug}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Directory sites={sites} initialStatus={initial} />
    </>
  );
}
