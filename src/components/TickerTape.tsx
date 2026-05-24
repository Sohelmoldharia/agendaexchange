"use client";

import { useEffect, useState } from "react";
import type { TapeItem } from "@/lib/queries";
import { cn, formatMoney, formatPercent } from "@/lib/format";

export function TickerTape({ initial }: { initial: TapeItem[] }) {
  const [tape, setTape] = useState<TapeItem[]>(initial);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch("/api/tick", { cache: "no-store" });
        const data = await res.json();
        if (alive && Array.isArray(data.tape) && data.tape.length)
          setTape(data.tape);
      } catch {
        // ignore transient errors
      }
    }
    const id = setInterval(poll, 10_000);
    poll();
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const items = tape.length ? tape : initial;
  if (!items.length) return null;
  const row = [...items, ...items];

  return (
    <div className="overflow-hidden border-b border-white/10 bg-black/30">
      <div className="marquee-track flex w-max items-center gap-7 py-2">
        {row.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-1.5 whitespace-nowrap text-xs"
          >
            <span>{t.emoji}</span>
            <span className="font-mono font-semibold text-zinc-300">
              {t.ticker}
            </span>
            <span className="font-mono text-zinc-500">{formatMoney(t.price)}</span>
            <span
              className={cn(
                "font-mono",
                t.change >= 0 ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {formatPercent(t.change)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
