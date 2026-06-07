import type { Metadata } from "next";
import Link from "next/link";
import { AnimeHeader } from "@/components/anime/AnimeHeader";
import { BRAND, SITE_URL } from "@/lib/anime/meta";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: BRAND.full, template: `%s · ${BRAND.name}` },
  description: BRAND.blurb,
  applicationName: BRAND.name,
  keywords: [
    "anime sites",
    "watch anime online",
    "anime streaming sites",
    "manga reading sites",
    "anime directory",
    "legal anime streaming",
    "free anime sites",
    "everythingmoe alternative",
    "where to watch anime",
  ],
  alternates: { canonical: "/anime" },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: BRAND.full,
    description: BRAND.blurb,
    url: "/anime",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.full,
    description: BRAND.blurb,
  },
  robots: { index: true, follow: true },
};

export default function AnimeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0b0b0f] text-zinc-100">
      <AnimeHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="max-w-md">
            <div className="text-base font-semibold text-white">
              Anime<span className="text-zinc-500">Index</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              {BRAND.blurb}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
            <Link href="/anime" className="hover:text-white">
              Browse
            </Link>
            <Link href="/anime?status=legal" className="hover:text-white">
              Official
            </Link>
            <Link href="/anime?status=free" className="hover:text-white">
              Free
            </Link>
            <Link href="/anime/graveyard" className="hover:text-white">
              Graveyard
            </Link>
          </nav>
        </div>
        <div className="border-t border-white/[0.08] py-4 text-center text-xs text-zinc-600">
          Informational directory. Listing a site is not an endorsement; using
          unofficial sites may be illegal where you live. Support creators —
          watch legally when you can.
        </div>
      </footer>
    </div>
  );
}
