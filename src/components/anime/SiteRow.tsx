import Link from "next/link";
import { cn } from "@/lib/format";
import { isBlocked, type AnimeSite } from "@/lib/anime/sites";
import { Favicon } from "./Favicon";

/** One compact, flat directory row — rank + favicon + name + muted right tag. */
export function SiteRow({ site, rank }: { site: AnimeSite; rank?: number }) {
  const blocked = isBlocked(site);
  const right =
    site.status === "shutdown" && site.endedYear
      ? `closed ${site.endedYear}`
      : (site.region ?? "");

  return (
    <Link
      href={`/anime/site/${site.slug}`}
      className="group flex items-center gap-2 rounded px-2 py-[5px] hover:bg-white/[0.05]"
    >
      {rank != null && (
        <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-zinc-600">
          {rank}
        </span>
      )}
      <Favicon site={site} />
      <span
        className={cn(
          "truncate text-[13px]",
          site.status === "shutdown"
            ? "text-zinc-500 line-through decoration-zinc-700"
            : "text-zinc-300 group-hover:text-white",
        )}
      >
        {site.name}
      </span>
      {site.status === "legal" && (
        <span className="shrink-0 rounded-sm bg-emerald-500/10 px-1 text-[9px] font-semibold uppercase text-emerald-400/80">
          official
        </span>
      )}
      {blocked && (
        <span
          title="Blocked in one or more countries"
          className="shrink-0 text-[10px] font-bold text-rose-400"
        >
          ⊘
        </span>
      )}
      {right && (
        <span className="ml-auto shrink-0 truncate pl-2 text-[10px] text-zinc-600">
          {right}
        </span>
      )}
    </Link>
  );
}
