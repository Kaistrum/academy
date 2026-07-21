import { useRef, useState } from "react";

/**
 * Single-series revenue area chart (change-over-time). Brand teal mark, text
 * in ink tokens, recessive grid, crosshair + tooltip on hover. Title names the
 * single series, so no legend (per the dataviz method).
 */
export function RevenueAreaChart({
  data,
  formatValue,
  formatAxis,
}: {
  data: { label: string; value: number }[];
  formatValue: (n: number) => string;
  /** Shorter label for the y-axis; defaults to formatValue. */
  formatAxis?: (n: number) => string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const axisLabel = formatAxis ?? formatValue;

  const W = 760;
  const H = 280;
  const PADX = 40;
  const PADY = 28;
  const plotW = W - PADX * 2;
  const plotH = H - PADY * 2;

  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = Math.ceil(max / 50000) * 50000 || max;
  const step = plotW / Math.max(1, data.length - 1);

  const x = (i: number) => PADX + i * step;
  const y = (v: number) => PADY + plotH - (v / niceMax) * plotH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");
  const areaPath = `${linePath} L ${x(data.length - 1)} ${PADY + plotH} L ${x(0)} ${PADY + plotH} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const loc = pt.matrixTransform(ctm.inverse());
    const idx = Math.round((loc.x - PADX) / step);
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Monthly revenue"
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Recessive gridlines + y labels */}
      {gridLines.map((g) => {
        const gy = PADY + plotH - g * plotH;
        return (
          <g key={g}>
            <line
              x1={PADX}
              x2={W - PADX}
              y1={gy}
              y2={gy}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text x={PADX - 6} y={gy + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">
              {axisLabel(niceMax * g)}
            </text>
          </g>
        );
      })}

      {/* Area + line */}
      <path d={areaPath} fill="url(#revFill)" />
      <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2" />

      {/* x labels */}
      {data.map((d, i) => (
        <text
          key={d.label}
          x={x(i)}
          y={H - 8}
          textAnchor="middle"
          fontSize="11"
          fill="var(--text-muted)"
        >
          {d.label}
        </text>
      ))}

      {/* Hover crosshair + tooltip */}
      {hover !== null && (
        <g>
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PADY}
            y2={PADY + plotH}
            stroke="var(--border-strong)"
            strokeWidth="1"
          />
          <circle
            cx={x(hover)}
            cy={y(data[hover].value)}
            r="4"
            fill="var(--accent)"
            stroke="var(--bg)"
            strokeWidth="2"
          />
          <g
            transform={`translate(${Math.min(
              x(hover) + 10,
              W - 130,
            )}, ${Math.max(y(data[hover].value) - 44, PADY)})`}
          >
            <rect
              width="120"
              height="40"
              rx="4"
              fill="var(--bg-card)"
              stroke="var(--border-strong)"
            />
            <text x="10" y="17" fontSize="11" fill="var(--text-muted)">
              {data[hover].label}
            </text>
            <text x="10" y="32" fontSize="13" fontWeight="600" fill="var(--text)">
              {formatValue(data[hover].value)}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}

/**
 * Horizontal magnitude bars (top courses / tutors). Single hue, value at the
 * end of each bar, name label in ink. Rows link when `href` is provided.
 */
export function HBarList({
  items,
  formatValue,
}: {
  items: { key: string; label: string; sub?: string; value: number }[];
  formatValue: (n: number) => string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="flex flex-col gap-3">
      {items.map((it) => (
        <li key={it.key} title={`${it.label}: ${formatValue(it.value)}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm">{it.label}</span>
            <span className="shrink-0 text-sm font-medium text-text">{formatValue(it.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden bg-bg-card">
            <div
              className="h-full rounded-r-[3px] bg-accent transition-[width] duration-500"
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
          {it.sub && <p className="mt-1 text-xs text-text-muted">{it.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
