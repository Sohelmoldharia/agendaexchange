import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { STARTING_BALANCE } from "@/lib/constants";

const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const schema = z.object({
  email: z.string().regex(emailRe, "Enter a valid email address."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username must be 20 characters or fewer.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const email = parsed.data.email.toLowerCase();
  const { username, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: existing.email === email ? "That email is already registered." : "That username is taken." },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash: await hashPassword(password),
      cashBalance: STARTING_BALANCE,
    },
  });
  await setSessionCookie(user.id);
  return NextResponse.json({
    user: { id: user.id, username: user.username, email: user.email },
  });
}
