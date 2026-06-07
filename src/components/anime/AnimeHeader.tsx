import Link from "next/link";

const LINKS = [
  { href: "/anime", label: "Browse" },
  { href: "/anime?status=legal", label: "Official" },
  { href: "/anime?status=free", label: "Free" },
  { href: "/anime/graveyard", label: "Graveyard" },
];

export function AnimeHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0b0b0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/anime" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-black text-white shadow-sm">
            A
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Anime<span className="text-zinc-500">Index</span>
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="rounded-lg px-3 py-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
