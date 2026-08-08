import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AREA_FILL_OPACITY,
  axisProps,
  ChartCard,
  CHART_GRID,
  CHART_SERIES,
  lineCursor,
  tooltipProps,
} from './chartTheme';

interface MonthlyChartProps {
  data: {
    month: string;
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

const MonthlyChart = ({
  data,
  formatCurrency,
  dataKey = 'sales',
  title,
  subtitle,
  height = 280,
}: MonthlyChartProps) => {
  const isCurrency = dataKey === 'sales';
  const format = (value: number) =>
    isCurrency ? formatCurrency(value) : new Intl.NumberFormat('en-IN').format(value);

  return (
    <ChartCard
      title={title ?? (isCurrency ? 'Monthly Sales' : 'Orders Overview')}
      subtitle={subtitle}
    >
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="month" {...axisProps} interval="preserveStartEnd" />
            <YAxis {...axisProps} tickFormatter={format} width={isCurrency ? 64 : 40} />
            <Tooltip
              {...tooltipProps}
              cursor={lineCursor}
              formatter={(value: number) => [format(value), isCurrency ? 'Sales' : 'Orders']}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              name={isCurrency ? 'Sales' : 'Orders'}
              stroke={CHART_SERIES[0]}
              strokeWidth={2.5}
              fill={CHART_SERIES[0]}
              fillOpacity={AREA_FILL_OPACITY}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#FFFFFF' }}
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default MonthlyChart;
