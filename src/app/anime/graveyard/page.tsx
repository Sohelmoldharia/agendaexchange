import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { KIND_META } from "@/lib/anime/meta";
import { getAllSites, type AnimeSite, type SiteKind } from "@/lib/anime/sites";
import { SiteRow } from "@/components/anime/SiteRow";

export const metadata: Metadata = {
  title: "Graveyard",
  description:
    "The anime sites that are gone for good — closed, seized, or merged away.",
};

const KIND_ORDER: SiteKind[] = [
  "stream",
  "donghua",
  "manga",
  "novel",
  "download",
  "database",
  "schedule",
  "app",
  "news",
];

export default function Graveyard() {
  const dead = getAllSites().filter((s) => s.status === "shutdown");

  const byKind = new Map<SiteKind, AnimeSite[]>();
  for (const s of dead) {
    const arr = byKind.get(s.kind) ?? [];
    arr.push(s);
    byKind.set(s.kind, arr);
  }
  for (const arr of byKind.values()) {
    arr.sort((a, b) => (b.endedYear ?? 0) - (a.endedYear ?? 0));
  }

  return (
    <section className="mx-auto max-w-screen-2xl px-4 pb-16 pt-6">
      <Link
        href="/anime"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to directory
      </Link>

      <div className="mt-3 mb-1 flex items-end gap-2">
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          🪦 The Graveyard
        </h1>
        <span className="pb-0.5 text-sm text-zinc-600">{dead.length} sites</span>
      </div>
      <p className="max-w-2xl text-sm text-zinc-400">
        Anime and manga sites that are gone for good — shut down, seized, or
        folded into something else. Rest in peace.
      </p>

      <div className="mt-6 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
        {KIND_ORDER.map((kind) => {
          const rows = byKind.get(kind);
          if (!rows || rows.length === 0) return null;
          const meta = KIND_META[kind];
          return (
            <section
              key={kind}
              className="mb-3 inline-block w-full break-inside-avoid rounded-md border border-white/10 bg-white/[0.015]"
            >
              <header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-200">
                  <span>{meta.emoji}</span>
                  {meta.label}
                </span>
                <span className="text-[11px] tabular-nums text-zinc-600">
                  {rows.length}
                </span>
              </header>
              <div className="space-y-px p-1.5">
                {rows.map((s, i) => (
                  <SiteRow key={s.slug} site={s} rank={i + 1} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
