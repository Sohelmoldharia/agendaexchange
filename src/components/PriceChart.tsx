"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { RangeKey } from "@/lib/queries";
import type { SeriesPoint } from "@/lib/market";
import { cn, formatMoney, formatPercent } from "@/lib/format";

const RANGES: RangeKey[] = ["1D", "1W", "1M", "ALL"];

async function fetchHistory(
  ticker: string,
  range: RangeKey,
): Promise<SeriesPoint[] | null> {
  try {
    const res = await fetch(`/api/stocks/${ticker}?range=${range}`, {
      cache: "no-store",
    });
    const d = await res.json();
    return Array.isArray(d.history) ? d.history : null;
  } catch {
    return null;
  }
}

export function PriceChart({
  ticker,
  initialHistory,
  currentPrice,
}: {
  ticker: string;
  initialHistory: SeriesPoint[];
  currentPrice: number;
}) {
  const [range, setRange] = useState<RangeKey>("1D");
  const [data, setData] = useState<SeriesPoint[]>(initialHistory);
  const [hover, setHover] = useState<number | null>(null);
  const gradId = useId();

  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const height = 300;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // fetch on range/ticker change, and again right after a trade moves the price
  useEffect(() => {
    let alive = true;
    fetchHistory(ticker, range).then((h) => {
      if (alive && h) setData(h);
    });
    return () => {
      alive = false;
    };
  }, [ticker, range, currentPrice]);

  // keep the chart live
  useEffect(() => {
    const id = setInterval(() => {
      fetchHistory(ticker, range).then((h) => {
        if (h) setData(h);
      });
    }, 10_000);
    return () => clearInterval(id);
  }, [ticker, range]);

  const pts =
    data.length >= 2
      ? data
      : [
          { t: 0, p: currentPrice },
          { t: 1, p: currentPrice },
        ];
  const prices = pts.map((d) => d.p);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const n = pts.length;
  const padY = 16;

  const x = (i: number) => (i / (n - 1)) * width;
  const y = (p: number) => height - padY - ((p - min) / span) * (height - 2 * padY);

  const line = pts
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(d.p).toFixed(2)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  const first = pts[0].p;
  const last = pts[n - 1].p;
  const up = last >= first;
  const color = up ? "#34d399" : "#fb7185";
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0;

  const hp = hover != null ? pts[hover] : null;

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(rel * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, idx)));
  }

  function fmtTime(t: number) {
    const d = new Date(t);
    if (range === "1D")
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (range === "ALL" || range === "1M")
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
    });
  }

  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="label">{range} range</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-white">
              {formatMoney(hp ? hp.p : currentPrice)}
            </span>
            <span
              className={cn(
                "font-mono text-sm font-semibold",
                up ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {formatPercent(changePct)}
            </span>
          </div>
          <div className="h-4 text-xs text-zinc-500">
            {hp ? fmtTime(hp.t) : " "}
          </div>
        </div>
        <div className="flex gap-1 rounded-lg bg-black/30 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                range === r
                  ? "bg-white/15 text-white"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div ref={wrapRef} className="relative w-full">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full touch-none"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradId})`} />
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {hp && (
            <>
              <line
                x1={x(hover!)}
                y1={0}
                x2={x(hover!)}
                y2={height}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle
                cx={x(hover!)}
                cy={y(hp.p)}
                r={4}
                fill={color}
                stroke="#07060f"
                strokeWidth={2}
              />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
