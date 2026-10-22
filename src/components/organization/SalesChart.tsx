// src/components/organization/SalesChart.tsx

import type { SalesPoint } from '../../types/organization';

interface SalesChartProps {
  data: SalesPoint[];
}

export default function SalesChart({ data }: SalesChartProps) {
  // 1. Standard Dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  // 2. Calculate Scale
  const maxVal = Math.max(...data.map((d) => d.value), 10); // Default to 10 if all zero
  
  // 3. Generate Coordinates
  const points = data.map((d, i) => {
    const x = padding.left + (i * ((width - padding.left - padding.right) / (data.length - 1 || 1)));
    const y = height - padding.bottom - ((d.value / maxVal) * (height - padding.top - padding.bottom));
    return { x, y, label: d.label, value: d.value };
  });

  // 4. Generate Paths
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
    : '';

  return (
    // Responsive container
    <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ width: '100%', minWidth: '600px', display: 'block' }}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--a)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--a)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-AXIS & GRID LINES */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = height - padding.bottom - (ratio * (height - padding.top - padding.bottom));
          const val = Math.round(ratio * maxVal);
          return (
            <g key={`y-${i}`}>
              <line 
                x1={padding.left} 
                y1={y} 
                x2={width - padding.right} 
                y2={y} 
                stroke="rgba(255,255,255,0.06)" 
                strokeDasharray="4 4" 
              />
              <text 
                x={padding.left - 10} 
                y={y + 4} 
                fill="var(--mu)" 
                fontSize="12" 
                textAnchor="end"
              >
                ₱{val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        {/* AREA BACKGROUND */}
        <path d={areaPath} fill="url(#chartGradient)" />

        {/* LINE */}
        <path 
          d={linePath} 
          fill="none" 
          stroke="var(--a)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* DOTS */}
        {points.map((p, i) => (
          <circle 
            key={`dot-${i}`} 
            cx={p.x} 
            cy={p.y} 
            r="4" 
            fill="var(--a)" 
            stroke="var(--bg)" 
            strokeWidth="2" 
          />
        ))}

        {/* X-AXIS DATES (Auto-skip kapag masyadong marami para hindi mag-overlap) */}
        {points.map((p, i) => {
          // Kung 30 days, magpakita lang ng date tuwing 4 na araw (at yung huli)
          const is30Days = data.length > 15;
          const shouldShow = !is30Days || i % 4 === 0 || i === data.length - 1;
          
          if (!shouldShow) return null;

          return (
            <text 
              key={`x-${i}`} 
              x={p.x} 
              y={height - padding.bottom + 20} 
              fill="var(--mu)" 
              fontSize="12" 
              textAnchor="middle"
            >
              {p.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}