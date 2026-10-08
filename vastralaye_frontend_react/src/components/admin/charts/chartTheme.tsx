import { ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------
 * Shared Recharts theme for the admin panel (admin_design.md §3.5)
 * Series colors in fixed order — assign by slot, never cycle hues.
 * ---------------------------------------------------------------- */

export const CHART_SERIES = ['#992534', '#C29E5C', '#5C6B8A', '#3E6B4F', '#AD6148'];

export const CHART_GRID = '#EFE7DB';
export const CHART_MUTED = '#6E5F53';
export const CHART_INK = '#2B1B12';
export const CHART_BORDER = '#E7DFD3';
export const AREA_FILL_OPACITY = 0.12;
export const BAR_RADIUS: [number, number, number, number] = [3, 3, 0, 0];

/** Axis tick style: 11px muted per spec */
export const axisTick = { fill: CHART_MUTED, fontSize: 11 };

/** Common props spread onto <XAxis>/<YAxis> */
export const axisProps = {
  tick: axisTick,
  axisLine: false,
  tickLine: false,
  tickMargin: 8,
} as const;

/** Tooltip: white card, 1px border, no heavy shadow */
export const tooltipProps = {
  contentStyle: {
    background: '#FFFFFF',
    border: `1px solid ${CHART_BORDER}`,
    borderRadius: 6,
    boxShadow: '0 8px 24px rgba(43, 27, 18, 0.08)',
    padding: '8px 12px',
  },
  labelStyle: {
    color: CHART_MUTED,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 4,
  },
  itemStyle: { color: CHART_INK, fontSize: 12, padding: '1px 0' },
} as const;

/** Hover cursor for bar charts */
export const barCursor = { fill: 'rgba(201, 154, 69, 0.08)' };
/** Hover cursor for line/area charts */
export const lineCursor = { stroke: '#C9B393', strokeDasharray: '4 4' };

export const legendStyle = { fontSize: 12, color: CHART_MUTED } as const;

/* ------------------------------------------------------------------
 * Standard chart card: white, 1px border, 12px uppercase tracked title
 * ---------------------------------------------------------------- */

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const ChartCard = ({ title, subtitle, action, className, children }: ChartCardProps) => (
  <div className={cn('min-w-0 rounded-md border border-border bg-white p-5', className)}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-espresso">
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-xs text-[#6E5F53]">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

/* ------------------------------------------------------------------
 * Shared donut (62% inner radius, 2px white gaps between segments,
 * legend right with value + share — identity never color-alone)
 * ---------------------------------------------------------------- */

interface DonutProps {
  data: { name: string; value: number }[];
  colors?: string[];
  centerValue?: string;
  centerLabel?: string;
  valueFormatter?: (value: number) => string;
}

export const Donut = ({
  data,
  colors = CHART_SERIES,
  centerValue,
  centerLabel,
  valueFormatter = (v) => String(v),
}: DonutProps) => {
  // Fold overflow slices into "Other" so hues are never cycled
  const slices =
    data.length > colors.length
      ? [
          ...data.slice(0, colors.length - 1),
          {
            name: 'Other',
            value: data.slice(colors.length - 1).reduce((s, d) => s + d.value, 0),
          },
        ]
      : data;
  const total = slices.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex min-w-0 flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-[172px] w-[172px] flex-none">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="98%"
              paddingAngle={2}
              stroke="#FFFFFF"
              strokeWidth={2}
              animationDuration={300}
            >
              {slices.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipProps} formatter={(value: number) => valueFormatter(value)} />
          </PieChart>
        </ResponsiveContainer>
        {centerValue && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-xl font-medium leading-tight text-espresso">
              {centerValue}
            </span>
            {centerLabel && (
              <span className="text-[10.5px] uppercase tracking-[0.1em] text-[#6E5F53]">
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2.5 text-[12.5px]">
        {slices.map((entry, index) => (
          <li key={entry.name} className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 flex-none rounded-[3px]"
              style={{ background: colors[index % colors.length] }}
            />
            <span className="truncate text-espresso">{entry.name}</span>
            <span className="ml-auto whitespace-nowrap font-semibold text-espresso">
              {valueFormatter(entry.value)}
            </span>
            <span className="w-9 flex-none text-right text-[11.5px] text-[#6E5F53]">
              {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
