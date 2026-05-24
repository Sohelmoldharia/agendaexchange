import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  identifier: z.string().min(1, "Enter your email or username."),
  password: z.string().min(1, "Enter your password."),
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
  const id = parsed.data.identifier.trim();
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: id.toLowerCase() }, { username: id }] },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Incorrect email/username or password." },
      { status: 401 },
    );
  }
  await setSessionCookie(user.id);
  return NextResponse.json({
    user: { id: user.id, username: user.username, email: user.email },
  });
}
