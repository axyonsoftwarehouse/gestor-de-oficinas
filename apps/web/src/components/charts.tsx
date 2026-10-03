'use client';

import { formatNumber } from '@/lib/format';

export const CHART_COLORS = {
  brand: '#2F80ED',
  accent: '#4CE364',
  lime: '#ABE85F',
  orange: '#FFAD31',
  teal: '#1FD4C0',
  purple: '#7D6FC4',
  pink: '#F085A9',
  red: '#EB5757',
};

export interface ChartDatum {
  label: string;
  value: number;
  color: string;
}

/** Lista com barras horizontais (estilo "Most Spent" do kit). */
export function BarList({ items }: { items: ChartDatum[] }): JSX.Element {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">Sem dados.</p>;
  }
  return (
    <div className="space-y-3.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink">{item.label}</span>
            <span className="font-semibold text-ink">{formatNumber(item.value)}</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-surface-page">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Donut SVG com legenda e total no centro. */
export function DonutChart({
  items,
  centerLabel = 'Total',
  size = 180,
  thickness = 22,
}: {
  items: ChartDatum[];
  centerLabel?: string;
  size?: number;
  thickness?: number;
}): JSX.Element {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#EEF1F7"
            strokeWidth={thickness}
          />
          {total > 0 &&
            items.map((item) => {
              const length = (item.value / total) * circumference;
              const circle = (
                <circle
                  key={item.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return circle;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-ink">{formatNumber(total)}</span>
          <span className="text-xs text-ink-muted">{centerLabel}</span>
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-ink-muted">{item.label}</span>
            <span className="ml-auto font-medium text-ink">
              {total > 0 ? Math.round((item.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
