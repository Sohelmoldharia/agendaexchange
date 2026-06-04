"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
  await requireAdmin();
  const raw = Object.fromEntries(formData);
  const data = stockSchema.parse({
    ...raw,
    ticker: String(raw.ticker ?? "").toUpperCase(),
  });
  await prisma.stock.create({
    data: {
      ...data,
      slug: slugify(data.name),
    },
  });
  revalidatePath("/admin/stocks");
  revalidatePath("/market");
  redirect("/admin/stocks");
}

export async function updateStock(id: string, formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData);
  const data = stockSchema.parse({
    ...raw,
    ticker: String(raw.ticker ?? "").toUpperCase(),
  });
  await prisma.stock.update({
    where: { id },
    data: {
      ...data,
      slug: slugify(data.name),
    },
  });
  revalidatePath("/admin/stocks");
  revalidatePath("/market");
  revalidatePath(`/stock/${data.ticker}`);
  redirect("/admin/stocks");
}

export async function deleteStock(id: string) {
  await requireAdmin();
  await prisma.stock.delete({ where: { id } });
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
  await requireAdmin();
  const data = categorySchema.parse(Object.fromEntries(formData));
  await prisma.category.create({
    data: { ...data, slug: slugify(data.name) },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/market");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();
  const data = categorySchema.parse(Object.fromEntries(formData));
  await prisma.category.update({
    where: { id },
    data: { ...data, slug: slugify(data.name) },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/market");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await prisma.category.delete({ where: { id } });
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
  await requireAdmin();
  const data = seriesSchema.parse(Object.fromEntries(formData));
  await prisma.series.create({
    data: { ...data, slug: slugify(data.name) },
  });
  revalidatePath("/admin/series");
  revalidatePath("/market");
  redirect("/admin/series");
}

export async function updateSeries(id: string, formData: FormData) {
  await requireAdmin();
  const data = seriesSchema.parse(Object.fromEntries(formData));
  await prisma.series.update({
    where: { id },
    data: { ...data, slug: slugify(data.name) },
  });
  revalidatePath("/admin/series");
  revalidatePath("/market");
  redirect("/admin/series");
}

export async function deleteSeries(id: string) {
  await requireAdmin();
  await prisma.series.delete({ where: { id } });
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
  await prisma.user.update({ where: { id }, data });
  revalidatePath("/admin/users");
}

export async function deleteUser(id: string) {
  const admin = await requireAdmin();
  if (admin.id === id) {
    throw new Error("You can't delete yourself.");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}
