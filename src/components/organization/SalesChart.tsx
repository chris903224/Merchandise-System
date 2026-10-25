// src/components/organization/SalesChart.tsx

import { useId, useState } from 'react';
import type { SalesPoint } from '../../types/organization';

interface SalesChartProps {
  data: SalesPoint[];
}

function smoothPath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M ${pts[0].x} ${pts[0].y}`;

  const dx: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    d[i] = (pts[i + 1].y - pts[i].y) / dx[i];
  }

  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[i] = t * a * d[i];
        m[i + 1] = t * b * d[i];
      }
    }
  }

  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const c1x = pts[i].x + dx[i] / 3;
    const c1y = pts[i].y + (m[i] * dx[i]) / 3;
    const c2x = pts[i + 1].x - dx[i] / 3;
    const c2y = pts[i + 1].y - (m[i + 1] * dx[i]) / 3;
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return path;
}

export default function SalesChart({ data }: SalesChartProps) {
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 24, bottom: 40, left: 56 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const baseY = height - padding.bottom;

  // ✅ DYNAMIC SCALING: Hanapin ang pinakamalaking value sa data
  const dataMax = Math.max(...data.map((d) => d.value), 0);
  
  // Kung zero lahat, gawing 1 para may baseline
  // Kung may data, dagdagan ng 20% headroom para umakyat sa taas
  const maxVal = dataMax === 0 ? 1 : dataMax * 1.2;

  const points = data.map((d, i) => {
    const x = padding.left + i * (plotW / (data.length - 1 || 1));
    
    // I-compute ang Y position base sa maxVal
    const rawY = (d.value / maxVal) * plotH;
    
    // ✅ Minimum height (8px) para visible ang line kahit zero
    // Habang lumalaki ang data, umaakyat siya hanggang sa pinakataas
    const y = baseY - Math.max(rawY, 8);
    
    return { x, y, label: d.label, value: d.value };
  });

  const linePath = smoothPath(points);
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`
      : '';

  if (points.length === 0) return null;

  const activeIdx = hover ?? points.length - 1;
  const ap = points[activeIdx];

  const tipW = 128;
  const tipH = 46;
  const tipX = Math.min(Math.max(ap.x - tipW / 2, padding.left), width - padding.right - tipW);
  const tipY = Math.max(ap.y - tipH - 14, 2);

  function onMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const i = Math.round(ratio * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, i)));
  }

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg
        className="sales-chart"
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Sales overview chart"
      >
        <defs>
          <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--a)', stopOpacity: 0.38 }} />
            <stop offset="100%" style={{ stopColor: 'var(--a)', stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id={`${uid}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" style={{ stopColor: 'var(--a2)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--al)' }} />
          </linearGradient>
        </defs>

        {/* Y-AXIS & GRID LINES (Dynamic based sa maxVal) */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = baseY - ratio * plotH;
          const val = Math.round(ratio * maxVal * 1000); // I-multiply sa 1000 para maging peso
          return (
            <g key={`y-${i}`}>
              {ratio > 0 && (
                <line className="sc-grid" x1={padding.left} y1={y} x2={width - padding.right} y2={y} />
              )}
              <text className="sc-ytick" x={padding.left - 12} y={y + 4} textAnchor="end">
                ₱{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        <line className="sc-axis" x1={padding.left} y1={padding.top} x2={padding.left} y2={baseY} />

        {areaPath && <path className="sc-area" d={areaPath} fill={`url(#${uid}-area)`} />}
        <path className="sc-line" d={linePath} fill="none" stroke={`url(#${uid}-line)`} />

        {points.map((p, i) => {
          const is30Days = data.length > 15;
          const shouldShow = !is30Days || i % 4 === 0 || i === data.length - 1;

          if (!shouldShow) return null;

          return (
            <text
              key={`x-${i}`}
              className="sc-xtick"
              x={p.x}
              y={baseY + 22}
              textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            >
              {p.label}
            </text>
          );
        })}

        {hover !== null && <line className="sc-guide" x1={ap.x} y1={padding.top} x2={ap.x} y2={baseY} />}
        <circle className="sc-halo" cx={ap.x} cy={ap.y} r={9} />
        <circle className="sc-dot" cx={ap.x} cy={ap.y} r={5.5} />

        {hover !== null && (
          <g className="sc-tip" transform={`translate(${tipX},${tipY})`} pointerEvents="none">
            <rect className="sc-tip-bg" width={tipW} height={tipH} rx={10} />
            <text className="sc-tip-l" x={12} y={18}>
              {ap.label}
            </text>
            <text className="sc-tip-v" x={12} y={36}>
              ₱{ap.value >= 1 ? `${ap.value.toFixed(1)}k` : Math.round(ap.value * 1000).toLocaleString()}
            </text>
          </g>
        )}

        <rect
          x={padding.left}
          y={padding.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>
    </div>
  );
}