import { ChartCard, Donut } from './chartTheme';

interface CategoryChartProps {
  data: {
    name: string;
    value: number;
  }[];
  colors: string[];
  formatCurrency: (value: number) => string;
  title?: string;
  subtitle?: string;
  /** Overrides formatCurrency for legend/tooltip values (e.g. plain counts) */
  valueFormatter?: (value: number) => string;
  centerValue?: string;
  centerLabel?: string;
}

const CategoryChart = ({
  data,
  colors,
  formatCurrency,
  title,
  subtitle,
  valueFormatter,
  centerValue,
  centerLabel,
}: CategoryChartProps) => {
  const format = valueFormatter ?? formatCurrency;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartCard title={title ?? 'Sales by Category'} subtitle={subtitle}>
      <Donut
        data={data}
        colors={colors}
        valueFormatter={format}
        centerValue={centerValue ?? format(total)}
        centerLabel={centerLabel ?? 'total'}
      />
    </ChartCard>
  );
};

export default CategoryChart;
