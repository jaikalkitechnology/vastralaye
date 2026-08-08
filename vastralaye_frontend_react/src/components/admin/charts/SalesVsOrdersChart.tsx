import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  axisProps,
  ChartCard,
  CHART_GRID,
  CHART_SERIES,
  legendStyle,
  lineCursor,
  tooltipProps,
} from './chartTheme';

interface SalesVsOrdersChartProps {
  data: {
    month: string;
    sales: number;
    orders: number;
  }[];
  formatCurrency: (value: number) => string;
  title?: string;
  subtitle?: string;
  salesName?: string;
  height?: number;
}

const SalesVsOrdersChart = ({
  data,
  formatCurrency,
  title,
  subtitle,
  salesName = 'Sales (₹)',
  height = 240,
}: SalesVsOrdersChartProps) => {
  const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value);

  return (
    <ChartCard title={title ?? 'Sales vs Orders'} subtitle={subtitle}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="month" {...axisProps} interval="preserveStartEnd" />
            <YAxis
              yAxisId="left"
              {...axisProps}
              tickFormatter={formatCurrency}
              width={64}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              {...axisProps}
              tickFormatter={formatNumber}
              width={40}
            />
            <Tooltip
              {...tooltipProps}
              cursor={lineCursor}
              formatter={(value: number, name: string) =>
                name === salesName ? [formatCurrency(value), name] : [formatNumber(value), name]
              }
            />
            <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sales"
              name={salesName}
              stroke={CHART_SERIES[0]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#FFFFFF' }}
              animationDuration={300}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke={CHART_SERIES[1]}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#FFFFFF' }}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default SalesVsOrdersChart;
