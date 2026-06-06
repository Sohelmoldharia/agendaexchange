import Link from "next/link";
import { cn } from "@/lib/format";
import { isBlocked, type AnimeSite } from "@/lib/anime/sites";

const DOT: Record<AnimeSite["status"], string> = {
  legal: "bg-emerald-400",
  free: "bg-amber-400",
  shutdown: "bg-zinc-600",
};

/** One compact, flat directory row — favicon-dot + name + a muted right tag. */
export function SiteRow({ site }: { site: AnimeSite }) {
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
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[site.status])}
        aria-hidden
      />
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
