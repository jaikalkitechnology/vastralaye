import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  axisProps,
  BAR_RADIUS,
  barCursor,
  ChartCard,
  CHART_GRID,
  CHART_SERIES,
  tooltipProps,
} from './chartTheme';

interface WeeklyChartProps {
  data: {
    day: string;
    sales?: number;
    orders?: number;
  }[];
  formatCurrency: (value: number) => string;
  /** Which series to plot; defaults to sales (backward compatible) */
  dataKey?: 'sales' | 'orders';
  title?: string;
  subtitle?: string;
  height?: number;
}

const WeeklyChart = ({
  data,
  formatCurrency,
  dataKey = 'sales',
  title,
  subtitle,
  height = 240,
}: WeeklyChartProps) => {
  const isCurrency = dataKey === 'sales';
  const format = (value: number) =>
    isCurrency ? formatCurrency(value) : new Intl.NumberFormat('en-IN').format(value);

  // Best day highlighted in gold (§3.5: active bar in gold)
  const values = data.map((d) => Number(d[dataKey] ?? 0));
  const maxValue = values.length ? Math.max(...values) : 0;

  return (
    <ChartCard title={title ?? 'Weekly Performance'} subtitle={subtitle}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="day" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={format} width={isCurrency ? 64 : 40} />
            <Tooltip
              {...tooltipProps}
              cursor={barCursor}
              formatter={(value: number) => [format(value), isCurrency ? 'Sales' : 'Orders']}
            />
            <Bar
              dataKey={dataKey}
              name={isCurrency ? 'Sales' : 'Orders'}
              radius={BAR_RADIUS}
              maxBarSize={36}
              animationDuration={300}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.day}-${index}`}
                  fill={
                    maxValue > 0 && Number(entry[dataKey] ?? 0) === maxValue
                      ? CHART_SERIES[1]
                      : CHART_SERIES[0]
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default WeeklyChart;
