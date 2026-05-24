import Link from "next/link";
import type { StockView } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { Avatar } from "./Avatar";
import { Sparkline } from "./Sparkline";
import { ChangeBadge } from "./ChangeBadge";

export function StockCard({ stock }: { stock: StockView }) {
  return (
    <Link
      href={`/stock/${stock.ticker}`}
      className="card card-hover group block p-4"
    >
      <div className="flex items-start gap-3">
        <Avatar emoji={stock.emoji} gradient={stock.gradient} size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-zinc-100 group-hover:text-white">
            {stock.name}
          </div>
          <div className="flex items-center gap-1.5 truncate text-xs text-zinc-500">
            <span className="font-mono text-zinc-400">{stock.ticker}</span>
            <span>·</span>
            <span className="truncate">
              {stock.seriesEmoji} {stock.seriesName}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-lg font-semibold text-white">
            {formatMoney(stock.price)}
          </div>
          <ChangeBadge value={stock.change24h} />
        </div>
        <Sparkline data={stock.spark} className="h-10 w-24" />
      </div>
    </Link>
  );
}
