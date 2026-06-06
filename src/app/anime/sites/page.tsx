import type { Metadata } from "next";
import { SiteExplorer } from "@/components/anime/SiteExplorer";
import type { FilterKey } from "@/lib/anime/meta";
import { getAllSites } from "@/lib/anime/sites";

export const metadata: Metadata = {
  title: "Directory",
  description: "Search and filter every anime site by status and type.",
};

const VALID: FilterKey[] = ["all", "legal", "free", "blocked", "shutdown"];

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const initial: FilterKey = VALID.includes(status as FilterKey)
    ? (status as FilterKey)
    : "all";

  const sites = getAllSites();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
        The <span className="gradient-text">directory</span>
      </h1>
      <p className="mt-2 max-w-xl text-zinc-400">
        Every site we track — filter by status or type, or search by name,
        feature, or region.
      </p>
      <div className="mt-8">
        <SiteExplorer sites={sites} initialStatus={initial} />
      </div>
    </section>
  );
}
