import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { KIND_META, STATUS_META } from "@/lib/anime/meta";
import { emojiFor, getAllSites, getSite, isBlocked } from "@/lib/anime/sites";
import { BlockedBadge, StatusBadge } from "@/components/anime/StatusBadge";
import { SiteRow } from "@/components/anime/SiteRow";

export function generateStaticParams() {
  return getAllSites().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = getSite(slug);
  if (!site) return { title: "Not found" };
  return {
    title: `${site.name} — ${STATUS_META[site.status].label}`,
    description: site.blurb,
  };
}

export default async function SiteDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = getSite(slug);
  if (!site) notFound();

  const kind = KIND_META[site.kind];
  const blocked = isBlocked(site);
  const related = getAllSites()
    .filter((s) => s.slug !== site.slug && s.kind === site.kind)
    .slice(0, 8);

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/anime"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to directory
      </Link>

      {/* header */}
      <div className="mt-4 rounded-md border border-white/10 bg-white/[0.015] p-5">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-2xl">
            {emojiFor(site)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {site.name}
            </h1>
            <div className="mt-0.5 text-sm text-zinc-500">
              {kind.emoji} {kind.label}
              {site.region ? ` · ${site.region}` : ""}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={site.status} />
              {blocked && <BlockedBadge />}
            </div>
          </div>
          {site.url && site.status !== "shutdown" && (
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex shrink-0 items-center gap-1.5 rounded border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/15"
            >
              Visit <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>

        <p className="mt-5 text-[15px] leading-relaxed text-zinc-300">
          {site.blurb}
        </p>
      </div>

      {/* facts */}
      <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/10 bg-white/[0.06] text-sm sm:grid-cols-3">
        <Fact label="Status" value={STATUS_META[site.status].label} />
        <Fact label="Type" value={kind.label} />
        {site.region && <Fact label="Region" value={site.region} />}
        {site.founded && <Fact label="Founded" value={String(site.founded)} />}
        {site.endedYear && (
          <Fact label="Shut down" value={String(site.endedYear)} />
        )}
        {site.successor && <Fact label="Then what" value={site.successor} />}
        {blocked && (
          <Fact label="Blocked in" value={site.blockedIn!.join(", ")} />
        )}
      </dl>

      {/* features */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {site.features.map((f) => (
          <span
            key={f}
            className="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-zinc-400"
          >
            {f}
          </span>
        ))}
      </div>

      {site.status === "free" && (
        <p className="mt-4 rounded-md border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-200/80">
          Heads up: this is an unofficial site. Accessing it may be illegal where
          you live, and such sites can carry ads, malware, or change domains
          without notice — that&apos;s why we don&apos;t link out to it. Prefer an
          official option when one exists.
        </p>
      )}

      {/* related */}
      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-zinc-300">
            More {kind.label.toLowerCase()} sites
          </h2>
          <div className="rounded-md border border-white/10 bg-white/[0.015] p-1.5">
            {related.map((s) => (
              <SiteRow key={s.slug} site={s} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--background)] px-3 py-2.5">
      <dt className="text-[11px] uppercase tracking-wide text-zinc-600">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-zinc-200">{value}</dd>
    </div>
  );
}
