import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/format";
import { isBlocked, type AnimeSite } from "@/lib/anime/sites";
import { Favicon } from "./Favicon";

/**
 * A directory row. If the site has a URL (official services, trackers, tools,
 * etc.) the row opens the real site in a new tab. Unofficial/defunct entries
 * (no stored URL) open their info page instead.
 */
export function SiteRow({ site, rank }: { site: AnimeSite; rank?: number }) {
  const blocked = isBlocked(site);
  const right =
    site.status === "shutdown" && site.endedYear
      ? `closed ${site.endedYear}`
      : (site.region ?? "");
  const external = site.status !== "shutdown" ? site.url : undefined;
  const cls =
    "group flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-white/[0.06]";

  const inner = (
    <>
      {rank != null && (
        <span className="w-5 shrink-0 text-right text-xs tabular-nums text-zinc-600">
          {rank}
        </span>
      )}
      <Favicon site={site} />
      <span
        className={cn(
          "truncate text-sm",
          site.status === "shutdown"
            ? "text-zinc-500 line-through decoration-zinc-700"
            : "text-zinc-200 group-hover:text-white",
        )}
      >
        {site.name}
      </span>
      {site.status === "legal" && (
        <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90">
          official
        </span>
      )}
      {blocked && (
        <span
          title="Blocked in one or more countries"
          className="shrink-0 text-xs font-bold text-rose-400"
        >
          ⊘
        </span>
      )}
      {external && (
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-600 group-hover:text-violet-300" />
      )}
      {right && (
        <span className="ml-auto shrink-0 truncate pl-2 text-xs text-zinc-500">
          {right}
        </span>
      )}
    </>
  );

  if (external) {
    return (
      <a href={external} target="_blank" rel="noopener noreferrer nofollow" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={`/anime/site/${site.slug}`} className={cls}>
      {inner}
    </Link>
  );
}
