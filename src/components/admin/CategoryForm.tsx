import Link from "next/link";
import { CATEGORY_GRADIENTS } from "@/lib/palette";
import { Field } from "./Field";
import { GradientPicker } from "./GradientPicker";

export type CategoryFormValues = {
  name?: string;
  emoji?: string;
  gradient?: string;
  blurb?: string;
  sortOrder?: number;
};

export function CategoryForm({
  action,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: CategoryFormValues;
  submitLabel: string;
}) {
  const v = values ?? {};
  return (
    <form action={action} className="card space-y-5 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name">
          <input name="name" required defaultValue={v.name ?? ""} className="input" placeholder="Anime" />
        </Field>
        <Field label="Emoji">
          <input name="emoji" required defaultValue={v.emoji ?? ""} className="input text-xl" placeholder="🌸" />
        </Field>
      </div>

      <Field label="Blurb">
        <textarea
          name="blurb"
          required
          rows={2}
          defaultValue={v.blurb ?? ""}
          className="input resize-y"
          placeholder="Short one-liner shown on the fandom card."
        />
      </Field>

      <Field label="Gradient">
        <GradientPicker name="gradient" options={CATEGORY_GRADIENTS} defaultValue={v.gradient} />
      </Field>

      <Field label="Sort order" hint="Lower numbers come first.">
        <input name="sortOrder" type="number" step="1" defaultValue={v.sortOrder ?? 0} className="input font-mono" />
      </Field>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/categories" className="btn-ghost">Cancel</Link>
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
