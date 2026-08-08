import { ChartCard, CHART_SERIES, Donut } from './chartTheme';

interface CustomerChartProps {
  data: {
    name: string;
    value: number;
  }[];
  colors?: string[];
  title?: string;
  subtitle?: string;
  valueFormatter?: (value: number) => string;
  centerLabel?: string;
}

const CustomerChart = ({
  data,
  colors = CHART_SERIES,
  title,
  subtitle,
  valueFormatter,
  centerLabel = 'customers',
}: CustomerChartProps) => {
  const format = valueFormatter ?? ((value: number) => new Intl.NumberFormat('en-IN').format(value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartCard title={title ?? 'Customer Breakdown'} subtitle={subtitle}>
      <Donut
        data={data}
        colors={colors}
        valueFormatter={format}
        centerValue={format(total)}
        centerLabel={centerLabel}
      />
    </ChartCard>
  );
};

export default CustomerChart;
