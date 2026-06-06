import { Directory } from "@/components/anime/Directory";
import { getAllSites } from "@/lib/anime/sites";

type StatusFilter = "all" | "legal" | "free" | "blocked" | "shutdown";
const VALID: StatusFilter[] = ["all", "legal", "free", "blocked", "shutdown"];

export default async function AnimeHome({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const initial: StatusFilter = VALID.includes(status as StatusFilter)
    ? (status as StatusFilter)
    : "all";

  const sites = getAllSites();

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pb-16 pt-8">
      <div className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          The anime site index
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-zinc-400">
          Every anime streaming, manga, download, and tracking site — official,
          free, blocked, or shut down. Browse by category, or filter and search.
        </p>
      </div>
      <Directory sites={sites} initialStatus={initial} />
    </div>
  );
}
