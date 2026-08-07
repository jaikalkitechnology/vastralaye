
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SalesVsOrdersChartProps {
  data: {
    month: string;
    sales: number;
    orders: number;
  }[];
  formatCurrency: (value: number) => string;
}

const SalesVsOrdersChart = ({ data, formatCurrency }: SalesVsOrdersChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales vs Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tickFormatter={formatCurrency} />
              <YAxis yAxisId="right" orientation="right" stroke="#FF8042" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Sales (₹)" />
              <Bar yAxisId="right" dataKey="orders" fill="#FF8042" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesVsOrdersChart;
