import Link from "next/link";
import {
  ArrowRight,
  Crown,
  LineChart,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getAllStockViews,
  getCategoryViews,
  getTopInvestors,
  type Investor,
  type StockView,
} from "@/lib/queries";
import { BRAND, STARTING_BALANCE } from "@/lib/constants";
import {
  cn,
  formatCompact,
  formatMoney,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { Sparkline } from "@/components/Sparkline";
import { ChangeBadge } from "@/components/ChangeBadge";
import { StockCard } from "@/components/StockCard";
import { CategoryCard } from "@/components/CategoryCard";

const USER_GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-cyan-400 to-blue-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-violet-600",
];
function gradientForName(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return USER_GRADIENTS[(h >>> 0) % USER_GRADIENTS.length];
}

export default async function Home() {
  const [user, views, categories, investors] = await Promise.all([
    getCurrentUser(),
    getAllStockViews(),
    getCategoryViews(),
    getTopInvestors(3),
  ]);

  const sortedByGain = [...views].sort((a, b) => b.change24h - a.change24h);
  const sortedByLoss = [...views].sort((a, b) => a.change24h - b.change24h);
  const topGainer = sortedByGain[0];
  const secondGainer = sortedByGain[1];
  const topLoser = sortedByLoss[0];
  const secondLoser = sortedByLoss[1];
  const lossStrip = sortedByLoss.slice(2, 6);
  const trending = [...views].sort((a, b) => b.marketCap - a.marketCap).slice(0, 8);
  const heroTiles = trending.slice(0, 14);
  const totalSeries = new Set(views.map((v) => v.seriesName)).size;

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:pt-16">
        <div className="text-center">
          <span className="chip mx-auto mb-5 border-violet-400/30 bg-violet-500/10 text-violet-200">
            <Sparkles className="h-3.5 w-3.5" />
            The fictional stock market for fandoms
          </span>
          <h1 className="text-balance text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-7xl">
            {BRAND.name} <span className="gradient-text">Market</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-zinc-400">
            A free virtual market to trade the characters you love. Every trade
            moves the price.
          </p>
        </div>

        {/* Promo card — character marquee + CTA */}
        <article className="card relative mt-10 overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />

          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-md">
              <p className="label">Featured</p>
              <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
                Trade your favorite{" "}
                <span className="gradient-text">characters</span>.
              </h2>
              <p className="mt-2 text-zinc-400">
                Buy to pump the price. Sell to dump it. Watch the market react.
              </p>
            </div>
            {user ? (
              <Link
                href="/market"
                className="btn-primary shrink-0 px-6 py-3 text-base"
              >
                Explore the market <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/signup"
                className="btn-primary shrink-0 px-6 py-3 text-base"
              >
                Start with {formatMoney(STARTING_BALANCE)}{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Character marquee */}
          <div className="relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="marquee-track flex w-max gap-4">
              {[...heroTiles, ...heroTiles].map((s, i) => (
                <Link
                  key={`${s.ticker}-${i}`}
                  href={`/stock/${s.ticker}`}
                  className="group flex shrink-0 flex-col items-center gap-1.5"
                >
                  <Avatar emoji={s.emoji} gradient={s.gradient} size="lg" />
                  <span className="font-mono text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-200">
                    {s.ticker}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </article>

        {/* stats strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Characters" value={formatNumber(views.length)} />
          <Stat label="Series" value={formatNumber(totalSeries)} />
          <Stat label="Fandoms" value={formatNumber(categories.length)} />
          <Stat label="Starting cash" value={formatMoney(STARTING_BALANCE)} />
        </div>
      </section>

      {/* ===== Top Winner ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <SectionHead title="Top Winner" tone="up" />
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {topGainer && (
            <FeatureCard stock={topGainer} tone="up" className="lg:col-span-2" />
          )}
          {secondGainer && <FeatureCard stock={secondGainer} tone="up" compact />}
        </div>
      </section>

      {/* ===== Top Losers ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <SectionHead title="Top Losers" tone="down" />
        {lossStrip.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {lossStrip.map((s) => (
              <LossTile key={s.id} stock={s} />
            ))}
          </div>
        )}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {topLoser && (
            <FeatureCard stock={topLoser} tone="down" className="lg:col-span-2" />
          )}
          {secondLoser && <FeatureCard stock={secondLoser} tone="down" compact />}
        </div>
      </section>

      {/* ===== Top Investors Podium ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <SectionHead title="Top Investors" subtitle="The richest traders on the exchange." />
        <Podium investors={investors} />
      </section>

      {/* ===== Browse by fandom ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <SectionHead
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

      {/* ===== Most valuable ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <SectionHead
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

      {/* ===== How it works ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-20">
        <div className="card overflow-hidden p-8 sm:p-12">
          <h2 className="text-center text-3xl font-bold text-white">How it works</h2>
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

// ----- subcomponents -----

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="font-mono text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function SectionHead({
  title,
  subtitle,
  href,
  tone,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2
          className={cn(
            "text-2xl font-bold sm:text-3xl",
            tone === "up"
              ? "text-emerald-400"
              : tone === "down"
                ? "text-rose-400"
                : "text-white",
          )}
        >
          {title}
        </h2>
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

function FeatureCard({
  stock,
  tone,
  className,
  compact,
}: {
  stock: StockView;
  tone: "up" | "down";
  className?: string;
  compact?: boolean;
}) {
  const TrendIcon = tone === "up" ? TrendingUp : TrendingDown;
  return (
    <Link
      href={`/stock/${stock.ticker}`}
      className={cn(
        "card card-hover group relative overflow-hidden p-5",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br opacity-20 blur-3xl",
          stock.gradient,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar
            emoji={stock.emoji}
            gradient={stock.gradient}
            size={compact ? "lg" : "xl"}
          />
          <div>
            <h3 className="text-lg font-bold text-white sm:text-xl">
              {stock.name}
            </h3>
            <div className="font-mono text-xs text-zinc-500">
              {stock.ticker} · {stock.seriesName}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
            tone === "up"
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-rose-500/15 text-rose-300",
          )}
        >
          <TrendIcon className="h-3 w-3" />
          {tone === "up" ? "Gainer" : "Loser"}
        </span>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-2xl font-bold text-white sm:text-3xl">
            {formatMoney(stock.price)}
          </div>
          <ChangeBadge value={stock.change24h} size="md" />
        </div>
        <div className="text-right text-xs text-zinc-500">
          <div>Market cap</div>
          <div className="font-mono text-zinc-300">
            {formatCompact(stock.marketCap)}
          </div>
        </div>
      </div>

      <div className="relative mt-4">
        <Sparkline
          data={stock.spark}
          className={cn("w-full", compact ? "h-16" : "h-24")}
          strokeWidth={2.5}
        />
      </div>
    </Link>
  );
}

function LossTile({ stock }: { stock: StockView }) {
  return (
    <Link
      href={`/stock/${stock.ticker}`}
      className="card card-hover flex items-center gap-3 p-3"
    >
      <Avatar emoji={stock.emoji} gradient={stock.gradient} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-zinc-100">
          {stock.name}
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-xs text-zinc-500">{stock.ticker}</span>
          <span className="font-mono text-xs font-semibold text-rose-400">
            {formatPercent(stock.change24h)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function Podium({ investors }: { investors: Investor[] }) {
  const first = investors[0];
  const second = investors[1];
  const third = investors[2];
  return (
    <div className="mt-6 grid grid-cols-3 items-end gap-2 sm:gap-4">
      <PodiumColumn rank={2} investor={second} heightClass="pt-10 sm:pt-14" />
      <PodiumColumn rank={1} investor={first} heightClass="pt-4 sm:pt-6" />
      <PodiumColumn rank={3} investor={third} heightClass="pt-12 sm:pt-16" />
    </div>
  );
}

function PodiumColumn({
  rank,
  investor,
  heightClass,
}: {
  rank: 1 | 2 | 3;
  investor: Investor | undefined;
  heightClass: string;
}) {
  const isFirst = rank === 1;
  return (
    <div className={cn("flex flex-col items-center", heightClass)}>
      <div
        className={cn(
          "card card-hover relative w-full p-4 text-center",
          isFirst &&
            "border-amber-400/40 bg-gradient-to-b from-amber-400/10 to-transparent ring-1 ring-amber-400/30",
        )}
      >
        {isFirst && (
          <Crown className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-amber-300 drop-shadow-[0_2px_8px_rgba(252,211,77,0.5)]" />
        )}
        {investor ? (
          <>
            <div
              className={cn(
                "mx-auto grid place-items-center rounded-2xl bg-gradient-to-br text-xl font-black text-white shadow-lg ring-1 ring-inset ring-white/20",
                isFirst ? "h-16 w-16" : "h-12 w-12",
                gradientForName(investor.username),
              )}
            >
              {investor.username.slice(0, 1).toUpperCase()}
            </div>
            <div
              className={cn(
                "mt-2 truncate font-semibold text-white",
                isFirst ? "text-base" : "text-sm",
              )}
            >
              @{investor.username}
            </div>
            <div className="mt-0.5 font-mono text-xs text-emerald-300">
              {formatCompact(investor.netWorth)}
            </div>
          </>
        ) : (
          <div className="py-3 text-xs text-zinc-600">No trader yet</div>
        )}
      </div>
      <div
        className={cn(
          "mt-2 grid w-full place-items-center rounded-t-lg font-black",
          isFirst
            ? "h-16 bg-gradient-to-b from-amber-400/40 to-amber-500/10 text-amber-200"
            : rank === 2
              ? "h-12 bg-gradient-to-b from-zinc-300/30 to-zinc-400/10 text-zinc-200"
              : "h-10 bg-gradient-to-b from-amber-700/40 to-amber-800/10 text-amber-300",
        )}
      >
        {rank}
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
