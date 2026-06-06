"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { maybeTickMarket, tickMarket } from "@/lib/market";
import { round2 } from "@/lib/pricing";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function audit(
  adminId: string,
  action: string,
  target?: string | null,
  meta?: Record<string, unknown> | null,
) {
  await prisma.auditLog.create({
    data: {
      adminId,
      action,
      target: target ?? null,
      meta: meta ? JSON.stringify(meta) : null,
    },
  });
}

// ---------- Stocks ----------

const stockSchema = z.object({
  name: z.string().min(1).max(80),
  ticker: z
    .string()
    .min(2)
    .max(8)
    .regex(/^[A-Z0-9]+$/, "Ticker must be uppercase letters or numbers"),
  blurb: z.string().min(1).max(240),
  emoji: z.string().min(1).max(8),
  gradient: z.string().min(1),
  price: z.coerce.number().positive(),
  basePrice: z.coerce.number().positive(),
  liquidity: z.coerce.number().positive(),
  floatShares: z.coerce.number().positive(),
  seriesId: z.string().min(1),
});

export async function createStock(formData: FormData) {
  const admin = await requireAdmin();
  const raw = Object.fromEntries(formData);
  const data = stockSchema.parse({
    ...raw,
    ticker: String(raw.ticker ?? "").toUpperCase(),
  });
  const stock = await prisma.stock.create({
    data: { ...data, slug: slugify(data.name) },
  });
  await audit(admin.id, "stock.create", stock.ticker, { name: stock.name });
  revalidatePath("/admin/stocks");
  revalidatePath("/market");
  redirect("/admin/stocks");
}

export async function updateStock(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const raw = Object.fromEntries(formData);
  const data = stockSchema.parse({
    ...raw,
    ticker: String(raw.ticker ?? "").toUpperCase(),
  });
  await prisma.stock.update({
    where: { id },
    data: { ...data, slug: slugify(data.name) },
  });
  await audit(admin.id, "stock.update", data.ticker);
  revalidatePath("/admin/stocks");
  revalidatePath("/market");
  revalidatePath(`/stock/${data.ticker}`);
  redirect("/admin/stocks");
}

// Lightweight per-row save from the bulk editor — only the three numeric fields.
const stockQuickSchema = z.object({
  price: z.coerce.number().positive(),
  basePrice: z.coerce.number().positive(),
  liquidity: z.coerce.number().positive(),
});

export async function updateStockQuick(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const data = stockQuickSchema.parse(Object.fromEntries(formData));
  const before = await prisma.stock.findUniqueOrThrow({
    where: { id },
    select: { ticker: true, price: true },
  });
  await prisma.stock.update({ where: { id }, data });
  await audit(admin.id, "stock.quick_update", before.ticker, {
    from: before.price,
    to: data.price,
  });
  revalidatePath("/admin/stocks");
  revalidatePath("/market");
  revalidatePath(`/stock/${before.ticker}`);
}

export async function deleteStock(id: string) {
  const admin = await requireAdmin();
  const stock = await prisma.stock.findUniqueOrThrow({
    where: { id },
    select: { ticker: true, name: true },
  });
  await prisma.stock.delete({ where: { id } });
  await audit(admin.id, "stock.delete", stock.ticker, { name: stock.name });
  revalidatePath("/admin/stocks");
  revalidatePath("/market");
}

// ---------- Categories ----------

const categorySchema = z.object({
  name: z.string().min(1).max(48),
  emoji: z.string().min(1).max(8),
  gradient: z.string().min(1),
  blurb: z.string().min(1).max(160),
  sortOrder: z.coerce.number().int().default(0),
});

export async function createCategory(formData: FormData) {
  const admin = await requireAdmin();
  const data = categorySchema.parse(Object.fromEntries(formData));
  const cat = await prisma.category.create({
    data: { ...data, slug: slugify(data.name) },
  });
  await audit(admin.id, "category.create", cat.name);
  revalidatePath("/admin/categories");
  revalidatePath("/market");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const data = categorySchema.parse(Object.fromEntries(formData));
  await prisma.category.update({
    where: { id },
    data: { ...data, slug: slugify(data.name) },
  });
  await audit(admin.id, "category.update", data.name);
  revalidatePath("/admin/categories");
  revalidatePath("/market");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  const admin = await requireAdmin();
  const cat = await prisma.category.findUniqueOrThrow({
    where: { id },
    select: { name: true },
  });
  await prisma.category.delete({ where: { id } });
  await audit(admin.id, "category.delete", cat.name);
  revalidatePath("/admin/categories");
  revalidatePath("/market");
}

// ---------- Series ----------

const seriesSchema = z.object({
  name: z.string().min(1).max(64),
  emoji: z.string().min(1).max(8),
  blurb: z.string().min(1).max(200),
  categoryId: z.string().min(1),
});

export async function createSeries(formData: FormData) {
  const admin = await requireAdmin();
  const data = seriesSchema.parse(Object.fromEntries(formData));
  const ser = await prisma.series.create({
    data: { ...data, slug: slugify(data.name) },
  });
  await audit(admin.id, "series.create", ser.name);
  revalidatePath("/admin/series");
  revalidatePath("/market");
  redirect("/admin/series");
}

export async function updateSeries(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const data = seriesSchema.parse(Object.fromEntries(formData));
  await prisma.series.update({
    where: { id },
    data: { ...data, slug: slugify(data.name) },
  });
  await audit(admin.id, "series.update", data.name);
  revalidatePath("/admin/series");
  revalidatePath("/market");
  redirect("/admin/series");
}

export async function deleteSeries(id: string) {
  const admin = await requireAdmin();
  const ser = await prisma.series.findUniqueOrThrow({
    where: { id },
    select: { name: true },
  });
  await prisma.series.delete({ where: { id } });
  await audit(admin.id, "series.delete", ser.name);
  revalidatePath("/admin/series");
  revalidatePath("/market");
}

// ---------- Users ----------

const userUpdateSchema = z.object({
  cashBalance: z.coerce.number().min(0),
  isAdmin: z.preprocess(
    (v) => v === "on" || v === "true" || v === true,
    z.boolean(),
  ),
});

export async function updateUser(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const data = userUpdateSchema.parse(Object.fromEntries(formData));
  if (admin.id === id && !data.isAdmin) {
    throw new Error("You can't remove your own admin access.");
  }
  const target = await prisma.user.update({
    where: { id },
    data,
    select: { username: true },
  });
  await audit(admin.id, "user.update", target.username, {
    cashBalance: data.cashBalance,
    isAdmin: data.isAdmin,
  });
  revalidatePath("/admin/users");
}

export async function toggleUserAdmin(id: string) {
  const admin = await requireAdmin();
  const target = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: { username: true, isAdmin: true },
  });
  if (admin.id === id && target.isAdmin) {
    throw new Error("You can't remove your own admin access.");
  }
  await prisma.user.update({
    where: { id },
    data: { isAdmin: !target.isAdmin },
  });
  await audit(
    admin.id,
    target.isAdmin ? "user.demote" : "user.promote",
    target.username,
  );
  revalidatePath("/admin/users");
}

export async function deleteUser(id: string) {
  const admin = await requireAdmin();
  if (admin.id === id) throw new Error("You can't delete yourself.");
  const target = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: { username: true },
  });
  await prisma.user.delete({ where: { id } });
  await audit(admin.id, "user.delete", target.username);
  revalidatePath("/admin/users");
}

// ---------- Market controls ----------

export async function runMarketTick() {
  const admin = await requireAdmin();
  // bypass the throttle by calling tickMarket directly
  await tickMarket();
  await audit(admin.id, "market.tick");
  revalidatePath("/admin/market");
  revalidatePath("/market");
}

export async function runMarketTickThrottled() {
  const admin = await requireAdmin();
  const ticked = await maybeTickMarket();
  await audit(admin.id, "market.tick.throttled", null, { ticked });
  revalidatePath("/admin/market");
}

export async function resetAllPrices() {
  const admin = await requireAdmin();
  const stocks = await prisma.stock.findMany({
    select: { id: true, basePrice: true },
  });
  await prisma.$transaction(
    stocks.map((s) =>
      prisma.stock.update({
        where: { id: s.id },
        data: { price: s.basePrice },
      }),
    ),
  );
  await audit(admin.id, "market.reset_all", null, { count: stocks.length });
  revalidatePath("/admin/market");
  revalidatePath("/market");
}

export async function resetStockPrice(id: string) {
  const admin = await requireAdmin();
  const stock = await prisma.stock.findUniqueOrThrow({
    where: { id },
    select: { ticker: true, basePrice: true },
  });
  await prisma.stock.update({
    where: { id },
    data: { price: stock.basePrice },
  });
  await audit(admin.id, "stock.reset_price", stock.ticker);
  revalidatePath("/admin/stocks");
  revalidatePath("/market");
}

const giveAllCashSchema = z.object({
  amount: z.coerce.number().positive(),
});

export async function giveAllUsersCash(formData: FormData) {
  const admin = await requireAdmin();
  const { amount } = giveAllCashSchema.parse(Object.fromEntries(formData));
  const result = await prisma.user.updateMany({
    data: { cashBalance: { increment: round2(amount) } },
  });
  await audit(admin.id, "users.bonus", null, {
    amount: round2(amount),
    count: result.count,
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/market");
}

const wipeOrdersSchema = z.object({
  confirm: z.string().min(1),
});

export async function wipeAllOrders(formData: FormData) {
  const admin = await requireAdmin();
  const { confirm } = wipeOrdersSchema.parse(Object.fromEntries(formData));
  if (confirm !== "WIPE") {
    throw new Error("Type WIPE to confirm.");
  }
  const result = await prisma.order.deleteMany();
  await audit(admin.id, "orders.wipe", null, { count: result.count });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/market");
}
