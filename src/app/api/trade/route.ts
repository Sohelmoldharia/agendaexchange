import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import { executeTrade, TradeError } from "@/lib/trade";

const schema = z.object({
  ticker: z.string().min(1),
  side: z.enum(["BUY", "SELL"]),
  shares: z.coerce.number().int().positive(),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to start trading." },
      { status: 401 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid trade." },
      { status: 400 },
    );
  }

  try {
    const result = await executeTrade(
      userId,
      parsed.data.ticker,
      parsed.data.side,
      parsed.data.shares,
    );
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof TradeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("trade error", err);
    return NextResponse.json(
      { error: "Something went wrong placing that trade." },
      { status: 500 },
    );
  }
}
