import Link from "next/link";
import {
  ArrowRight,
  LineChart,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getAllStockViews, getCategoryViews, type StockView } from "@/lib/queries";
import { BRAND, STARTING_BALANCE } from "@/lib/constants";
import { cn, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { StockCard } from "@/components/StockCard";
import { CategoryCard } from "@/components/CategoryCard";

export default async function Home() {
  const [user, views, categories] = await Promise.all([
    getCurrentUser(),
    getAllStockViews(),
    getCategoryViews(),
  ]);

  const gainers = [...views].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
  const losers = [...views].sort((a, b) => a.change24h - b.change24h).slice(0, 5);
  const trending = [...views].sort((a, b) => b.marketCap - a.marketCap).slice(0, 8);
  const heroPicks = trending.slice(0, 7);
  const totalStocks = views.length;
  const totalSeries = new Set(views.map((v) => v.seriesName)).size;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="chip mx-auto mb-6 border-violet-400/30 bg-violet-500/10 text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              The fictional stock market for fandoms
            </span>
            <h1 className="text-balance text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-7xl">
              Trade the <span className="gradient-text">characters</span> you
              love.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-zinc-400">
              {BRAND.name} is a play-money exchange for anime, gaming, and movie
              legends. Every trade moves the market — buying pumps the price,
              selling dumps it.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <>
                  <Link href="/market" className="btn-primary px-6 py-3 text-base">
                    Explore the market <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/portfolio" className="btn-ghost px-6 py-3 text-base">
                    Your portfolio
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup" className="btn-primary px-6 py-3 text-base">
                    Start with {formatMoney(STARTING_BALANCE)}{" "}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/market" className="btn-ghost px-6 py-3 text-base">
                    Browse characters
                  </Link>
                </>
              )}
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
              {heroPicks.map((s) => (
                <Link
                  key={s.id}
                  href={`/stock/${s.ticker}`}
                  className="card card-hover flex items-center gap-2 py-1.5 pl-1.5 pr-3"
                >
                  <Avatar emoji={s.emoji} gradient={s.gradient} size="sm" />
                  <span className="font-mono text-xs font-semibold text-zinc-200">
                    {s.ticker}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xs",
                      s.change24h >= 0 ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {formatPercent(s.change24h)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Characters listed" value={formatNumber(totalStocks)} />
          <Stat label="Series" value={formatNumber(totalSeries)} />
          <Stat label="Fandoms" value={formatNumber(categories.length)} />
          <Stat label="Starting cash" value={formatMoney(STARTING_BALANCE)} />
        </div>
      </section>

      {/* Movers */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <div className="grid gap-4 lg:grid-cols-2">
          <MoverPanel
            title="Top gainers"
            tone="up"
            icon={<TrendingUp className="h-4 w-4" />}
            stocks={gainers}
          />
          <MoverPanel
            title="Top losers"
            tone="down"
            icon={<TrendingUp className="h-4 w-4 rotate-180" />}
            stocks={losers}
          />
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <SectionHeader
          title="Browse by fandom"
          subtitle="Pick a universe, drill into a series, then trade its characters."
          href="/market"
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <SectionHeader
          title="Most valuable"
          subtitle="The blue chips of the multiverse, by market cap."
          href="/market"
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((s) => (
            <StockCard key={s.id} stock={s} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 pt-20">
        <div className="card overflow-hidden p-8 sm:p-12">
          <h2 className="text-center text-3xl font-bold text-white">
            How it works
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <Step
              n={1}
              icon={<Wallet className="h-5 w-5" />}
              title="Sign up & get cash"
              body={`Create an account and start with ${formatMoney(STARTING_BALANCE)} in fictional money. No risk, all fun.`}
            />
            <Step
              n={2}
              icon={<Search className="h-5 w-5" />}
              title="Find your characters"
              body="Browse fandoms and series, build a watchlist, and scout the next breakout star."
            />
            <Step
              n={3}
              icon={<LineChart className="h-5 w-5" />}
              title="Trade & move markets"
              body="Buy to pump the price, sell to dump it. Watch the charts react to every trade in real time."
            />
          </div>
          {!user && (
            <div className="mt-10 text-center">
              <Link href="/signup" className="btn-primary px-6 py-3 text-base">
                Create your free account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="font-mono text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200 sm:flex"
      >
        View all <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function MoverPanel({
  title,
  tone,
  icon,
  stocks,
}: {
  title: string;
  tone: "up" | "down";
  icon: React.ReactNode;
  stocks: StockView[];
}) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-lg",
            tone === "up"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-rose-500/15 text-rose-400",
          )}
        >
          {icon}
        </span>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="divide-y divide-white/5">
        {stocks.map((s) => (
          <Link
            key={s.id}
            href={`/stock/${s.ticker}`}
            className="flex items-center gap-3 py-2.5 transition-colors hover:bg-white/[0.03]"
          >
            <Avatar emoji={s.emoji} gradient={s.gradient} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-zinc-100">
                {s.name}
              </div>
              <div className="font-mono text-xs text-zinc-500">{s.ticker}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-zinc-100">
                {formatMoney(s.price)}
              </div>
              <div
                className={cn(
                  "font-mono text-xs font-semibold",
                  s.change24h >= 0 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {formatPercent(s.change24h)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300 ring-1 ring-inset ring-white/10">
          {icon}
        </span>
        <span className="font-mono text-sm text-zinc-600">0{n}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-sm text-zinc-400">{body}</p>
    </div>
  );
}
