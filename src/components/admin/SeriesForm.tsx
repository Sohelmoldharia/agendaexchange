import Link from "next/link";
import { Field } from "./Field";

export type SeriesFormCategory = { id: string; name: string; emoji: string };
export type SeriesFormValues = {
  name?: string;
  emoji?: string;
  blurb?: string;
  categoryId?: string;
};

export function SeriesForm({
  action,
  categories,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: SeriesFormCategory[];
  values?: SeriesFormValues;
  submitLabel: string;
}) {
  const v = values ?? {};
  return (
    <form action={action} className="card space-y-5 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name">
          <input name="name" required defaultValue={v.name ?? ""} className="input" placeholder="Naruto" />
        </Field>
        <Field label="Emoji">
          <input name="emoji" required defaultValue={v.emoji ?? ""} className="input text-xl" placeholder="🍥" />
        </Field>
      </div>

      <Field label="Category">
        <select name="categoryId" required defaultValue={v.categoryId ?? ""} className="input">
          <option value="" disabled>Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Blurb">
        <textarea
          name="blurb"
          required
          rows={2}
          defaultValue={v.blurb ?? ""}
          className="input resize-y"
          placeholder="One-liner shown under the series name."
        />
      </Field>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/series" className="btn-ghost">Cancel</Link>
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
