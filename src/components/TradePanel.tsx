"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  maxSharesForBudget,
  quoteBuy,
  quoteSell,
} from "@/lib/pricing";
import { cn, formatMoney, formatNumber } from "@/lib/format";

type Props = {
  ticker: string;
  price: number;
  liquidity: number;
  isAuthed: boolean;
  cashBalance: number;
  sharesOwned: number;
};

export function TradePanel({
  ticker,
  price,
  liquidity,
  isAuthed,
  cashBalance,
  sharesOwned,
}: Props) {
  const router = useRouter();
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [sharesStr, setSharesStr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const shares = Math.max(0, Math.floor(Number(sharesStr) || 0));
  const valid = shares > 0;
  const quote = valid
    ? side === "BUY"
      ? quoteBuy(price, shares, liquidity)
      : quoteSell(price, shares, liquidity)
    : null;

  const canAfford = side === "BUY" ? !quote || quote.total <= cashBalance : true;
  const canSell = side === "SELL" ? shares <= sharesOwned : true;
  const blocked = !valid || !canAfford || !canSell;

  function add(n: number) {
    setSharesStr(String(shares + n));
  }
  function setMax() {
    if (side === "BUY") setSharesStr(String(maxSharesForBudget(price, cashBalance, liquidity)));
    else setSharesStr(String(sharesOwned));
  }

  async function submit() {
    if (!isAuthed) {
      router.push("/login");
      return;
    }
    if (blocked) return;
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, side, shares }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Trade failed." });
        return;
      }
      const r = data.result;
      setMsg({
        ok: true,
        text: `${r.side === "BUY" ? "Bought" : "Sold"} ${formatNumber(r.shares)} ${r.ticker} @ ${formatMoney(r.avgPrice)}`,
      });
      setSharesStr("");
      router.refresh();
    } catch {
      setMsg({ ok: false, text: "Network error. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-5">
      {/* Buy / Sell toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/30 p-1">
        {(["BUY", "SELL"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setSide(s);
              setMsg(null);
            }}
            className={cn(
              "rounded-lg py-2 text-sm font-bold transition-colors",
              side === s
                ? s === "BUY"
                  ? "bg-emerald-500 text-white"
                  : "bg-rose-500 text-white"
                : "text-zinc-400 hover:text-white",
            )}
          >
            {s === "BUY" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          {side === "BUY" ? "Buying power" : "You own"}
        </span>
        <span className="font-mono font-semibold text-zinc-100">
          {side === "BUY"
            ? formatMoney(cashBalance)
            : `${formatNumber(sharesOwned)} sh`}
        </span>
      </div>

      {/* Shares input */}
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            value={sharesStr}
            onChange={(e) =>
              setSharesStr(e.target.value.replace(/[^0-9]/g, ""))
            }
            placeholder="0"
            className="input font-mono text-lg"
          />
          <span className="shrink-0 text-sm text-zinc-500">shares</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => add(1)} className="chip hover:border-white/25">
            +1
          </button>
          <button onClick={() => add(10)} className="chip hover:border-white/25">
            +10
          </button>
          <button onClick={() => add(100)} className="chip hover:border-white/25">
            +100
          </button>
          <button onClick={setMax} className="chip hover:border-white/25">
            Max
          </button>
          {shares > 0 && (
            <button
              onClick={() => setSharesStr("")}
              className="chip ml-auto text-zinc-500 hover:border-white/25"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Quote */}
      <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
        <Row label="Market price" value={formatMoney(price)} />
        <Row
          label="Avg fill price"
          value={quote ? formatMoney(quote.avgPrice) : "—"}
        />
        <Row
          label={side === "BUY" ? "Estimated cost" : "Estimated proceeds"}
          value={quote ? formatMoney(quote.total) : "—"}
          strong
        />
        <Row
          label="Price after trade"
          value={quote ? formatMoney(quote.newPrice) : "—"}
          hint={side === "BUY" ? "▲" : "▼"}
          hintUp={side === "BUY"}
        />
      </div>

      {msg && (
        <div
          className={cn(
            "mt-3 rounded-lg border px-3 py-2 text-sm",
            msg.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300",
          )}
        >
          {msg.text}
        </div>
      )}

      {!canAfford && valid && (
        <p className="mt-2 text-xs text-rose-400">Not enough buying power.</p>
      )}
      {!canSell && valid && (
        <p className="mt-2 text-xs text-rose-400">
          You only own {formatNumber(sharesOwned)} shares.
        </p>
      )}

      {isAuthed ? (
        <button
          onClick={submit}
          disabled={blocked || submitting}
          className={cn("mt-4 w-full", side === "BUY" ? "btn-up" : "btn-down")}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {side === "BUY" ? "Buy" : "Sell"} {valid ? formatNumber(shares) : ""}{" "}
          {valid ? (shares === 1 ? "share" : "shares") : ""}
        </button>
      ) : (
        <Link href="/login" className="btn-primary mt-4 w-full">
          Log in to trade
        </Link>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  hint,
  hintUp,
}: {
  label: string;
  value: string;
  strong?: boolean;
  hint?: string;
  hintUp?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      <span
        className={cn(
          "font-mono",
          strong ? "font-bold text-white" : "text-zinc-200",
        )}
      >
        {hint && (
          <span className={hintUp ? "text-emerald-400" : "text-rose-400"}>
            {hint}{" "}
          </span>
        )}
        {value}
      </span>
    </div>
  );
}
