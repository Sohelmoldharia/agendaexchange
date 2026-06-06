"use client";

import { useState } from "react";
import { cn } from "@/lib/format";
import type { AnimeSite } from "@/lib/anime/sites";

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
 * Real favicon for sites we have a URL for (official ones); a tinted letter
 * tile otherwise — so free/defunct entries (whose domains we don't store)
 * still get a consistent icon.
 */
export function Favicon({ site }: { site: AnimeSite }) {
  const [failed, setFailed] = useState(false);
  const host = hostOf(site.url);

  if (host && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
        alt=""
        width={16}
        height={16}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
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
