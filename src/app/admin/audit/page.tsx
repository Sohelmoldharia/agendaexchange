import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/format";

const PAGE_SIZE = 50;

const ACTION_TONE: Record<string, string> = {
  create: "bg-emerald-500/15 text-emerald-300",
  update: "bg-violet-500/15 text-violet-300",
  delete: "bg-rose-500/15 text-rose-300",
  promote: "bg-amber-500/15 text-amber-300",
  demote: "bg-zinc-500/15 text-zinc-300",
  tick: "bg-cyan-500/15 text-cyan-300",
  reset: "bg-amber-500/15 text-amber-300",
  bonus: "bg-emerald-500/15 text-emerald-300",
  wipe: "bg-rose-500/15 text-rose-300",
};

function toneFor(action: string): string {
  for (const key of Object.keys(ACTION_TONE)) {
    if (action.includes(key)) return ACTION_TONE[key];
  }
  return "bg-white/10 text-zinc-300";
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      take: PAGE_SIZE,
      skip,
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { username: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Audit log</h2>
        <p className="text-sm text-zinc-500">
          Every admin mutation is recorded here. {total} entries.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  No admin activity recorded yet.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="px-4 py-3 text-xs text-zinc-400">
                  {new Date(log.createdAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  @{log.admin.username}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 font-mono text-xs font-semibold",
                      toneFor(log.action),
                    )}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                  {log.target ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                  {log.meta ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Link
              href={`/admin/audit?page=${Math.max(1, page - 1)}`}
              aria-disabled={page === 1}
              className={cn(
                "btn-ghost",
                page === 1 && "pointer-events-none opacity-40",
              )}
            >
              <ChevronLeft className="h-4 w-4" /> Newer
            </Link>
            <Link
              href={`/admin/audit?page=${Math.min(totalPages, page + 1)}`}
              aria-disabled={page === totalPages}
              className={cn(
                "btn-ghost",
                page === totalPages && "pointer-events-none opacity-40",
              )}
            >
              Older <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
