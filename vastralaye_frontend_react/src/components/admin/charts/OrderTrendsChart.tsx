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

interface OrderTrendsChartProps {
  data: {
    month: string;
    orders: number;
    sales?: number;
  }[];
  title?: string;
  subtitle?: string;
  /** Highlight the latest (current) month in gold — §3.5 */
  highlightLast?: boolean;
  height?: number;
}

const OrderTrendsChart = ({
  data,
  title,
  subtitle,
  highlightLast = true,
  height = 240,
}: OrderTrendsChartProps) => {
  const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value);

  return (
    <ChartCard title={title ?? 'Monthly Orders'} subtitle={subtitle}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="month" {...axisProps} interval="preserveStartEnd" />
            <YAxis {...axisProps} tickFormatter={formatNumber} width={40} />
            <Tooltip
              {...tooltipProps}
              cursor={barCursor}
              formatter={(value: number) => [formatNumber(value), 'Orders']}
            />
            <Bar
              dataKey="orders"
              name="Orders"
              radius={BAR_RADIUS}
              maxBarSize={28}
              animationDuration={300}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.month}-${index}`}
                  fill={
                    highlightLast && index === data.length - 1 ? CHART_SERIES[1] : CHART_SERIES[0]
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

export default OrderTrendsChart;
