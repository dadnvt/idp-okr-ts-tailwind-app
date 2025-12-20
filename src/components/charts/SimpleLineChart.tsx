import { useMemo } from 'react';

type Point = { label: string; value: number };

function pathFromPoints(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
  return d;
}

export default function SimpleLineChart({
  title,
  subtitle,
  labels,
  values,
  height = 160,
  valueFormatter,
}: {
  title: string;
  subtitle?: string;
  labels: string[];
  values: number[];
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  const data: Point[] = useMemo(() => {
    const n = Math.min(labels.length, values.length);
    return Array.from({ length: n }).map((_, i) => ({ label: labels[i], value: values[i] }));
  }, [labels, values]);

  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);

  const width = 720;
  const padX = 20;
  const padY = 18;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const pts = useMemo(() => {
    const n = data.length;
    if (n === 0) return [];
    return data.map((d, i) => {
      const x = padX + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
      const y = padY + (chartH - (d.value / max) * chartH);
      return { x, y, label: d.label, value: d.value };
    });
  }, [data, max, chartW, chartH]);

  const d = useMemo(() => pathFromPoints(pts), [pts]);

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-semibold text-gray-800">{title}</div>
        {subtitle ? <div className="text-xs text-gray-500">{subtitle}</div> : null}
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px]">
          <line x1={padX} y1={padY + chartH} x2={padX + chartW} y2={padY + chartH} stroke="#e5e7eb" />
          {d ? <path d={d} fill="none" stroke="#22c55e" strokeWidth="3" /> : null}
          {pts.map((p, i) => (
            <g key={`${p.label}-${i}`}>
              <title>{`${p.label}: ${valueFormatter ? valueFormatter(p.value) : p.value}`}</title>
              <circle cx={p.x} cy={p.y} r="4" fill="#22c55e" />
              <text x={p.x} y={height - 4} textAnchor="middle" fontSize="10" fill="#6b7280">
                {p.label.slice(5)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-2 text-xs text-gray-500">Hover a point to see exact value.</div>
    </div>
  );
}


