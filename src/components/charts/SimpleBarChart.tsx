import { useMemo } from 'react';

export default function SimpleBarChart({
  title,
  subtitle,
  labels,
  values,
  height = 140,
  valueFormatter,
}: {
  title: string;
  subtitle?: string;
  labels: string[];
  values: number[];
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  const data = useMemo(() => {
    const n = Math.min(labels.length, values.length);
    return Array.from({ length: n }).map((_, i) => ({ label: labels[i], value: values[i] }));
  }, [labels, values]);

  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);

  // Basic layout constants
  const width = 720;
  const padX = 16;
  const padY = 16;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const barGap = 8;
  const barW = data.length > 0 ? Math.max(6, (chartW - barGap * (data.length - 1)) / data.length) : 0;

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-semibold text-gray-800">{title}</div>
        {subtitle ? <div className="text-xs text-gray-500">{subtitle}</div> : null}
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px]">
          {/* Bars */}
          {data.map((d, i) => {
            const h = Math.round((d.value / max) * chartH);
            const x = padX + i * (barW + barGap);
            const y = padY + (chartH - h);
            return (
              <g key={`${d.label}-${i}`}>
                <title>{`${d.label}: ${valueFormatter ? valueFormatter(d.value) : d.value}`}</title>
                <rect x={x} y={y} width={barW} height={h} rx={6} fill="#60a5fa" />
                <text x={x + barW / 2} y={height - 4} textAnchor="middle" fontSize="10" fill="#6b7280">
                  {d.label.slice(5)} {/* show MM-DD */}
                </text>
              </g>
            );
          })}
          {/* Baseline */}
          <line x1={padX} y1={padY + chartH} x2={padX + chartW} y2={padY + chartH} stroke="#e5e7eb" />
        </svg>
      </div>
      <div className="mt-2 text-xs text-gray-500">Hover a bar to see exact value.</div>
    </div>
  );
}


