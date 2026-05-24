"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/format";

export type SearchItem = {
  ticker: string;
  name: string;
  emoji: string;
  gradient: string;
  seriesName: string;
  categoryName: string;
};

export function SearchBar({
  items,
  className,
}: {
  items: SearchItem[];
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.ticker.toLowerCase().includes(query) ||
          i.seriesName.toLowerCase().includes(query),
      )
      .slice(0, 7);
  }, [q, items]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(ticker: string) {
    setOpen(false);
    setQ("");
    router.push(`/stock/${ticker}`);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown")
            setActive((a) => Math.min(a + 1, results.length - 1));
          else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          else if (e.key === "Enter" && results[active]) go(results[active].ticker);
          else if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search characters…"
        className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-violet-400/60"
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-white/10 bg-[#0e0d1a]/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
          {results.map((r, i) => (
            <button
              key={r.ticker}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r.ticker)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                i === active ? "bg-white/8" : "hover:bg-white/5",
              )}
            >
              <Avatar emoji={r.emoji} gradient={r.gradient} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-100">
                  {r.name}
                </div>
                <div className="truncate text-xs text-zinc-500">
                  {r.seriesName} · {r.categoryName}
                </div>
              </div>
              <span className="font-mono text-xs text-zinc-400">{r.ticker}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
