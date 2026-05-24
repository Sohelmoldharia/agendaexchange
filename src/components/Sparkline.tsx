import { cn } from "@/lib/format";

type Props = {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
  up?: boolean;
};

export function Sparkline({
  data,
  width = 120,
  height = 38,
  strokeWidth = 2,
  className,
  up,
}: Props) {
  const pts = data.length >= 2 ? data : [data[0] ?? 0, data[0] ?? 0];
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const n = pts.length;
  const pad = strokeWidth;
  const x = (i: number) => (i / (n - 1)) * width;
  const y = (v: number) =>
    height - pad - ((v - min) / range) * (height - 2 * pad);

  const line = pts
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  const rising = up ?? pts[n - 1] >= pts[0];
  const color = rising ? "#34d399" : "#fb7185";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn(className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={area} fill={color} fillOpacity={0.12} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
