import { cn } from "@/lib/format";

const SIZES = {
  sm: "h-9 w-9 rounded-lg text-lg",
  md: "h-12 w-12 rounded-xl text-2xl",
  lg: "h-16 w-16 rounded-2xl text-3xl",
  xl: "h-24 w-24 rounded-3xl text-5xl",
} as const;

export function Avatar({
  emoji,
  gradient,
  size = "md",
  className,
}: {
  emoji: string;
  gradient: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center bg-gradient-to-br shadow-lg",
        gradient,
        SIZES[size],
        className,
      )}
    >
      <span className="drop-shadow-sm">{emoji}</span>
      <span className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/20" />
    </div>
  );
}
