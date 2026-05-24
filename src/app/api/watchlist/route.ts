import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const schema = z.object({ ticker: z.string().min(1) });

// Toggle a stock on/off the current user's watchlist.
export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const stock = await prisma.stock.findUnique({
    where: { ticker: parsed.data.ticker.toUpperCase() },
    select: { id: true },
  });
  if (!stock) {
    return NextResponse.json({ error: "Stock not found." }, { status: 404 });
  }

  const existing = await prisma.watchlistItem.findUnique({
    where: { userId_stockId: { userId, stockId: stock.id } },
  });
  if (existing) {
    await prisma.watchlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ watching: false });
  }
  await prisma.watchlistItem.create({ data: { userId, stockId: stock.id } });
  return NextResponse.json({ watching: true });
}
