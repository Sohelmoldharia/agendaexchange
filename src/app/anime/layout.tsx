import type { Metadata } from "next";
import Link from "next/link";
import { AnimeHeader } from "@/components/anime/AnimeHeader";
import { BRAND } from "@/lib/anime/meta";

export const metadata: Metadata = {
  title: { default: BRAND.full, template: `%s · ${BRAND.name}` },
  description: BRAND.blurb,
};

export default function AnimeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnimeHeader />
      <div className="flex-1">{children}</div>
      <footer className="mt-20 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <div className="text-lg font-bold text-white">
              Anime<span className="text-violet-300">Index</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">{BRAND.blurb}</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
            <Link href="/anime" className="hover:text-white">
              All sites
            </Link>
            <Link href="/anime?status=legal" className="hover:text-white">
              Official
            </Link>
            <Link href="/anime?status=free" className="hover:text-white">
              Free
            </Link>
            <Link href="/anime?status=blocked" className="hover:text-white">
              Blocked
            </Link>
            <Link href="/anime?status=shutdown" className="hover:text-white">
              Defunct
            </Link>
          </nav>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-zinc-600">
          Informational directory. Listing a site is not an endorsement; using
          unofficial sites may be illegal where you live. Support creators —
          watch legally when you can.
        </div>
      </footer>
    </div>
  );
}
