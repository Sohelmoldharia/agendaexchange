import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { updateCategory } from "../../../actions";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Edit {category.name}</h2>
      </div>
      <CategoryForm
        action={updateCategory.bind(null, category.id)}
        values={{
          name: category.name,
          emoji: category.emoji,
          gradient: category.gradient,
          blurb: category.blurb,
          sortOrder: category.sortOrder,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
