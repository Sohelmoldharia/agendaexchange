import Link from "next/link";
import { ArrowRight, ShieldCheck, Ban, Power, Search } from "lucide-react";
import { cn, formatNumber } from "@/lib/format";
import { BLOCKED_META, STATUS_META } from "@/lib/anime/meta";
import { getAllSites, getCounts } from "@/lib/anime/sites";
import { SiteCard } from "@/components/anime/SiteCard";

export default function AnimeHome() {
  const sites = getAllSites();
  const counts = getCounts(sites);
  const featured = sites.filter((s) => s.featured);
  const recentlyGone = sites
    .filter((s) => s.status === "shutdown" && s.endedYear)
    .sort((a, b) => (b.endedYear ?? 0) - (a.endedYear ?? 0))
    .slice(0, 6);

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:pt-20">
        <div className="text-center">
          <span className="chip mx-auto mb-5 border-violet-400/30 bg-violet-500/10 text-violet-200">
            🗾 The whole anime-site landscape, in one place
          </span>
          <h1 className="text-balance text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-7xl">
            Every anime site, <span className="gradient-text">mapped</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-zinc-400">
            Official streamers, free sites, the ones blocked in your country,
            and the graveyard of shut-down services — sorted and searchable.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/anime/sites" className="btn-primary px-6 py-3 text-base">
              Browse the directory <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/anime/sites?status=legal"
              className="btn-ghost px-6 py-3 text-base"
            >
              <ShieldCheck className="h-4 w-4" /> Just the legal ones
            </Link>
          </div>
        </div>

        {/* stat tiles → status filters */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            href="/anime/sites?status=legal"
            value={counts.legal}
            label={STATUS_META.legal.label}
            icon={<ShieldCheck className="h-4 w-4" />}
            tone={STATUS_META.legal.text}
          />
          <StatTile
            href="/anime/sites?status=free"
            value={counts.free}
            label={STATUS_META.free.label}
            icon={<Search className="h-4 w-4" />}
            tone={STATUS_META.free.text}
          />
          <StatTile
            href="/anime/sites?status=blocked"
            value={counts.blocked}
            label={BLOCKED_META.label}
            icon={<Ban className="h-4 w-4" />}
            tone={BLOCKED_META.text}
          />
          <StatTile
            href="/anime/sites?status=shutdown"
            value={counts.shutdown}
            label={STATUS_META.shutdown.label}
            icon={<Power className="h-4 w-4" />}
            tone={STATUS_META.shutdown.text}
          />
        </div>
      </section>

      {/* ===== Featured ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-14">
        <SectionHead
          title="Notable sites"
          subtitle="The ones everyone ends up asking about."
          href="/anime/sites"
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <SiteCard key={s.slug} site={s} />
          ))}
        </div>
      </section>

      {/* ===== Status explainer ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <SectionHead title="What the labels mean" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <LegendCard
            label={STATUS_META.legal.label}
            badge={STATUS_META.legal.badge}
            dot={STATUS_META.legal.dot}
            body={STATUS_META.legal.description}
          />
          <LegendCard
            label={STATUS_META.free.label}
            badge={STATUS_META.free.badge}
            dot={STATUS_META.free.dot}
            body={STATUS_META.free.description}
          />
          <LegendCard
            label={BLOCKED_META.label}
            badge={BLOCKED_META.badge}
            dot={BLOCKED_META.dot}
            body={BLOCKED_META.description}
          />
          <LegendCard
            label={STATUS_META.shutdown.label}
            badge={STATUS_META.shutdown.badge}
            dot={STATUS_META.shutdown.dot}
            body={STATUS_META.shutdown.description}
          />
        </div>
      </section>

      {/* ===== Graveyard ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <SectionHead
          title="Recently shut down"
          subtitle="Gone but not forgotten."
          href="/anime/sites?status=shutdown"
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentlyGone.map((s) => (
            <SiteCard key={s.slug} site={s} />
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-20">
        <div className="card overflow-hidden p-8 text-center sm:p-12">
          <h2 className="text-3xl font-bold text-white">
            {formatNumber(counts.total)} sites and counting
          </h2>
          <p className="mx-auto mt-2 max-w-md text-zinc-400">
            Filter by status and type, or search by name, feature, or region.
          </p>
          <Link
            href="/anime/sites"
            className="btn-primary mt-6 px-6 py-3 text-base"
          >
            Open the directory <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

// ----- subcomponents -----

function StatTile({
  href,
  value,
  label,
  icon,
  tone,
}: {
  href: string;
  value: number;
  label: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <Link href={href} className="card card-hover p-4 text-center">
      <div className={cn("flex items-center justify-center gap-1.5", tone)}>
        {icon}
        <span className="font-mono text-2xl font-bold">{formatNumber(value)}</span>
      </div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </Link>
  );
}

function SectionHead({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200 sm:flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function LegendCard({
  label,
  badge,
  dot,
  body,
}: {
  label: string;
  badge: string;
  dot: string;
  body: string;
}) {
  return (
    <div className="card p-5">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
          badge,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        {label}
      </span>
      <p className="mt-3 text-sm text-zinc-400">{body}</p>
    </div>
  );
}
