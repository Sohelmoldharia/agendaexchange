"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import { BRAND } from "@/lib/anime/meta";

const LINKS = [
  { href: "/anime", label: "Home" },
  { href: "/anime/sites", label: "Directory" },
  { href: "/anime/sites?status=legal", label: "Legal" },
  { href: "/anime/sites?status=free", label: "Free" },
  { href: "/anime/sites?status=shutdown", label: "Defunct" },
];

export function AnimeHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/anime" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-lg shadow-lg shadow-violet-500/20">
            🗾
          </span>
          <span className="text-lg font-black tracking-tight text-white">
            Anime<span className="gradient-text">Index</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => {
            const active =
              l.href === "/anime"
                ? pathname === "/anime"
                : pathname.startsWith(l.href.split("?")[0]) &&
                  l.href.includes("?") === false;
            return (
              <Link
                key={l.label}
                href={l.href}
                className={cn(
                  "hidden rounded-lg px-3 py-1.5 font-medium transition-colors sm:block",
                  active
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/anime/sites"
            className="btn-primary ml-1 px-3 py-1.5 text-xs sm:hidden"
          >
            Browse
          </Link>
        </nav>
      </div>
      <p className="border-t border-white/5 bg-amber-500/[0.06] px-4 py-1.5 text-center text-[11px] text-amber-200/70">
        {BRAND.tagline} — a directory only. We don&apos;t host or stream any content.
      </p>
    </header>
  );
}
