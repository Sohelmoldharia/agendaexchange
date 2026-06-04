import { CategoryForm } from "@/components/admin/CategoryForm";
import { createCategory } from "../../actions";

export default function NewCategoryPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">New category</h2>
        <p className="text-sm text-zinc-500">Add a fandom (e.g. K-Dramas, Sports).</p>
      </div>
      <CategoryForm action={createCategory} submitLabel="Create category" />
    </div>
  );
}
