import Link from "next/link";
import { STOCK_GRADIENTS } from "@/lib/palette";
import { Field } from "./Field";
import { GradientPicker } from "./GradientPicker";

export type StockFormSeries = { id: string; name: string; categoryName: string };
export type StockFormValues = {
  name?: string;
  ticker?: string;
  blurb?: string;
  emoji?: string;
  gradient?: string;
  price?: number;
  basePrice?: number;
  liquidity?: number;
  floatShares?: number;
  seriesId?: string;
};

export function StockForm({
  action,
  series,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  series: StockFormSeries[];
  values?: StockFormValues;
  submitLabel: string;
}) {
  const v = values ?? {};
  return (
    <form action={action} className="card space-y-5 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name">
          <input name="name" required defaultValue={v.name ?? ""} className="input" placeholder="Naruto Uzumaki" />
        </Field>
        <Field label="Ticker" hint="2–8 uppercase letters/numbers. Will be uppercased.">
          <input
            name="ticker"
            required
            defaultValue={v.ticker ?? ""}
            className="input font-mono uppercase"
            placeholder="NRTO"
            maxLength={8}
          />
        </Field>
      </div>

      <Field label="Blurb">
        <textarea
          name="blurb"
          required
          rows={3}
          defaultValue={v.blurb ?? ""}
          className="input resize-y"
          placeholder="Short flavor text shown on cards."
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Emoji" hint="One or two emoji characters.">
          <input name="emoji" required defaultValue={v.emoji ?? ""} className="input text-xl" placeholder="🍥" />
        </Field>
        <Field label="Series">
          <select name="seriesId" required defaultValue={v.seriesId ?? ""} className="input">
            <option value="" disabled>Select a series…</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>{s.categoryName} · {s.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Gradient">
        <GradientPicker name="gradient" options={STOCK_GRADIENTS} defaultValue={v.gradient} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Price" hint="Current trading price.">
          <input name="price" type="number" step="0.01" min="0.01" required defaultValue={v.price ?? ""} className="input font-mono" />
        </Field>
        <Field label="Base price" hint="Mean-reversion anchor.">
          <input name="basePrice" type="number" step="0.01" min="0.01" required defaultValue={v.basePrice ?? ""} className="input font-mono" />
        </Field>
        <Field label="Liquidity" hint="Higher = smaller price impact per share.">
          <input name="liquidity" type="number" step="1" min="1" required defaultValue={v.liquidity ?? ""} className="input font-mono" />
        </Field>
        <Field label="Float (shares)" hint="Used for market-cap display.">
          <input name="floatShares" type="number" step="1" min="1" required defaultValue={v.floatShares ?? ""} className="input font-mono" />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/stocks" className="btn-ghost">Cancel</Link>
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
