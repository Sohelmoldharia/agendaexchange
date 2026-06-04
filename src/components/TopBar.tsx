"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Shield, Wallet, X } from "lucide-react";
import { Logo } from "./Logo";
import { SearchBar, type SearchItem } from "./SearchBar";
import { cn, formatMoney } from "@/lib/format";

export type NavUser = {
  username: string;
  cashBalance: number;
  isAdmin: boolean;
} | null;

const LINKS = [
  { href: "/market", label: "Market" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/portfolio", label: "Portfolio" },
];

export function TopBar({ user, items }: { user: NavUser; items: SearchItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const userRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // close menus when the route changes (adjust state during render, per React docs)
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setUserOpen(false);
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setUserOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUserOpen(false);
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07060f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                isActive(l.href)
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden w-64 md:block">
          <SearchBar items={items} />
        </div>

        {user ? (
          <div className="hidden items-center gap-3 md:flex">
            <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-emerald-500/10 px-3 py-1.5 font-mono text-sm font-semibold text-emerald-300">
              <Wallet className="h-4 w-4" />
              {formatMoney(user.cashBalance)}
            </span>
            <div ref={userRef} className="relative">
              <button
                onClick={() => setUserOpen((o) => !o)}
                className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white"
              >
                {user.username.slice(0, 1).toUpperCase()}
              </button>
              {userOpen && (
                <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0e0d1a]/95 shadow-2xl backdrop-blur-xl">
                  <div className="border-b border-white/10 px-4 py-3">
                    <div className="text-xs text-zinc-500">Signed in as</div>
                    <div className="truncate font-semibold text-white">
                      @{user.username}
                    </div>
                    {user.isAdmin && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        <Shield className="h-3 w-3" /> Admin
                      </div>
                    )}
                  </div>
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      className="flex w-full items-center gap-2 border-b border-white/10 px-4 py-2.5 text-left text-sm text-amber-300 hover:bg-amber-500/10"
                    >
                      <Shield className="h-4 w-4" /> Admin panel
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/5"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/login" className="btn-ghost">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary">
              Sign up
            </Link>
          </div>
        )}

        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-zinc-300 md:hidden"
          aria-label="Menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-[#07060f] px-4 py-4 md:hidden">
          <SearchBar items={items} className="mb-3" />
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive(l.href)
                    ? "bg-white/10 text-white"
                    : "text-zinc-300 hover:bg-white/5",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 border-t border-white/10 pt-3">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-emerald-300">
                  <Wallet className="h-4 w-4" />
                  {formatMoney(user.cashBalance)}
                </span>
                <button onClick={logout} className="btn-ghost">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="btn-ghost flex-1">
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary flex-1">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
