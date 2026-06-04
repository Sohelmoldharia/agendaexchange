"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/format";

export function GradientPicker({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: readonly string[];
  defaultValue?: string;
}) {
  const [value, setValue] = useState<string>(defaultValue ?? options[0]);
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
        {options.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setValue(g)}
            aria-label={g}
            className={cn(
              "relative h-10 rounded-lg bg-gradient-to-br transition-transform hover:scale-105",
              g,
              value === g && "ring-2 ring-white ring-offset-2 ring-offset-[#0e0d1a]",
            )}
          >
            {value === g && (
              <Check className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" />
            )}
          </button>
        ))}
      </div>
    </>
  );
}
