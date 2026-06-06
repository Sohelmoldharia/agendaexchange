"use client";

import { useState } from "react";
import { cn } from "@/lib/format";
import type { AnimeSite } from "@/lib/anime/sites";
import { LOCAL_ICONS } from "@/lib/anime/icons-manifest";

const TILE: Record<AnimeSite["status"], string> = {
  legal: "bg-emerald-500/15 text-emerald-300",
  free: "bg-amber-500/15 text-amber-300",
  shutdown: "bg-zinc-700/40 text-zinc-500",
};

function hostOf(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Icon resolution order:
 *   1. self-hosted /anime-icons/<slug>.png (after `npm run icons`)
 *   2. live favicon service (for sites with a URL)
 *   3. tinted letter tile (free/defunct entries with no stored URL)
 */
export function Favicon({ site }: { site: AnimeSite }) {
  const sources: string[] = [];
  if (LOCAL_ICONS.has(site.slug)) sources.push(`/anime-icons/${site.slug}.png`);
  const host = hostOf(site.url);
  if (host) sources.push(`https://www.google.com/s2/favicons?domain=${host}&sz=64`);

  const [idx, setIdx] = useState(0);

  if (idx < sources.length) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sources[idx]}
        alt=""
        width={16}
        height={16}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setIdx((i) => i + 1)}
        className="h-4 w-4 shrink-0 rounded-sm bg-white/5"
      />
    );
  }

  const letter = site.name.replace(/[^a-zA-Z0-9]/g, "").charAt(0) || "?";
  return (
    <span
      className={cn(
        "grid h-4 w-4 shrink-0 place-items-center rounded-sm text-[9px] font-bold uppercase",
        TILE[site.status],
      )}
      aria-hidden
    >
      {letter}
    </span>
  );
}
