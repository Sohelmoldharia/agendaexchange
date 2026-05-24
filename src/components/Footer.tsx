import Link from "next/link";
import { Logo } from "./Logo";
import { BRAND } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-zinc-500">
            {BRAND.tagline} A fictional exchange for fun — all characters,
            prices, and money are make-believe.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
          <Link href="/market" className="hover:text-white">
            Market
          </Link>
          <Link href="/portfolio" className="hover:text-white">
            Portfolio
          </Link>
          <Link href="/watchlist" className="hover:text-white">
            Watchlist
          </Link>
          <Link href="/signup" className="hover:text-white">
            Sign up
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} {BRAND.name}. Not real financial advice —
        obviously.
      </div>
    </footer>
  );
}
