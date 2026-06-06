import Link from "next/link";
import { cn } from "@/lib/format";
import { KIND_META } from "@/lib/anime/meta";
import {
  emojiFor,
  gradientFor,
  isBlocked,
  type AnimeSite,
} from "@/lib/anime/sites";
import { BlockedBadge, StatusBadge } from "./StatusBadge";

export function SiteCard({ site }: { site: AnimeSite }) {
  const kind = KIND_META[site.kind];
  const gradient = gradientFor(site);
  return (
    <Link
      href={`/anime/site/${site.slug}`}
      className="card card-hover group relative flex flex-col overflow-hidden p-5"
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-3xl",
          gradient,
        )}
      />
      <div className="relative flex items-start gap-3">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xl shadow-lg ring-1 ring-inset ring-white/20",
            gradient,
          )}
        >
          {emojiFor(site)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-white">{site.name}</h3>
          <div className="mt-0.5 text-xs text-zinc-500">
            {kind.emoji} {kind.label}
            {site.region ? ` · ${site.region}` : ""}
          </div>
        </div>
      </div>

      <p className="relative mt-3 line-clamp-3 flex-1 text-sm text-zinc-400">
        {site.blurb}
      </p>

      <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={site.status} />
        {isBlocked(site) && <BlockedBadge />}
        {site.endedYear && (
          <span className="text-[11px] text-zinc-500">· closed {site.endedYear}</span>
        )}
      </div>
    </Link>
  );
}
