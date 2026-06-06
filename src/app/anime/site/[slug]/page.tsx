import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Ban,
  CalendarDays,
  CornerDownRight,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/format";
import { KIND_META, STATUS_META } from "@/lib/anime/meta";
import {
  emojiFor,
  gradientFor,
  getAllSites,
  getSite,
  isBlocked,
} from "@/lib/anime/sites";
import { BlockedBadge, StatusBadge } from "@/components/anime/StatusBadge";
import { SiteCard } from "@/components/anime/SiteCard";

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
  const gradient = gradientFor(site);
  const related = getAllSites()
    .filter((s) => s.slug !== site.slug && s.kind === site.kind)
    .slice(0, 3);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <Link
        href="/anime/sites"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to directory
      </Link>

      {/* header */}
      <div className="card relative mt-5 overflow-hidden p-6 sm:p-8">
        <div
          className={cn(
            "pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br opacity-20 blur-3xl",
            gradient,
          )}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
          <span
            className={cn(
              "grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-3xl shadow-lg ring-1 ring-inset ring-white/20",
              gradient,
            )}
          >
            {emojiFor(site)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              {site.name}
            </h1>
            <div className="mt-1 text-sm text-zinc-400">
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
              className="btn-primary shrink-0"
            >
              Visit site <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>

        <p className="relative mt-6 text-zinc-300">{site.blurb}</p>
      </div>

      {/* facts grid */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="label">At a glance</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <Fact
              icon={<Globe className="h-4 w-4" />}
              label="Status"
              value={STATUS_META[site.status].label}
            />
            {site.founded && (
              <Fact
                icon={<CalendarDays className="h-4 w-4" />}
                label="Founded"
                value={String(site.founded)}
              />
            )}
            {site.endedYear && (
              <Fact
                icon={<CalendarDays className="h-4 w-4" />}
                label="Shut down"
                value={String(site.endedYear)}
              />
            )}
            {site.successor && (
              <Fact
                icon={<CornerDownRight className="h-4 w-4" />}
                label="Then what"
                value={site.successor}
              />
            )}
            {blocked && (
              <Fact
                icon={<Ban className="h-4 w-4" />}
                label="Blocked in"
                value={site.blockedIn!.join(", ")}
              />
            )}
          </dl>
        </div>

        <div className="card p-5">
          <h2 className="label">Features</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {site.features.map((f) => (
              <span key={f} className="chip text-xs">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {site.status === "free" && (
        <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-200/80">
          Heads up: this is an unofficial site. Accessing it may be illegal where
          you live, and such sites can carry ads, malware, or change domains
          without notice. Consider an official option when one exists.
        </p>
      )}

      {/* related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white">
            More {kind.label.toLowerCase()} sites
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s) => (
              <SiteCard key={s.slug} site={s} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-2 text-zinc-500">
        {icon}
        {label}
      </dt>
      <dd className="text-right font-medium text-zinc-200">{value}</dd>
    </div>
  );
}
