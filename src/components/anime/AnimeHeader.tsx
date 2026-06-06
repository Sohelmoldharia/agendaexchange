import Link from "next/link";

const LINKS = [
  { href: "/anime", label: "All" },
  { href: "/anime?status=legal", label: "Official" },
  { href: "/anime?status=free", label: "Free" },
  { href: "/anime?status=blocked", label: "Blocked" },
  { href: "/anime?status=shutdown", label: "Defunct" },
];

export function AnimeHeader() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/anime" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded bg-white/10 text-base">
            🗾
          </span>
          <span className="text-base font-bold tracking-tight text-white">
            Anime<span className="text-violet-300">Index</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-xs">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="rounded px-2.5 py-1 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="border-t border-white/5 bg-white/[0.02] px-4 py-1.5 text-center text-[11px] text-zinc-500">
        An informational directory — we don&apos;t host, stream, or link to any
        content. Support creators: watch legally when you can.
      </p>
    </header>
  );
}
