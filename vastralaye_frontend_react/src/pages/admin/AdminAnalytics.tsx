import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCard from '@/components/admin/cards/StatsCard';
import OrderTrendsChart from '@/components/admin/charts/OrderTrendsChart';
import SalesVsOrdersChart from '@/components/admin/charts/SalesVsOrdersChart';
import WeeklyChart from '@/components/admin/charts/WeeklyChart';
import CategoryChart from '@/components/admin/charts/CategoryChart';
import CustomerChart from '@/components/admin/charts/CustomerChart';
import { CHART_SERIES } from '@/components/admin/charts/chartTheme';
import {
  monthlySales as mockMonthlySales,
  dailySales as mockDailySales,
  categorySales as mockCategorySales,
  customerData as mockCustomerData,
} from '@/components/admin/data/mockAnalyticsData';
import { api } from '@/api/api';
import { cn } from '@/lib/utils';
import { AlertTriangle, IndianRupee, Package, RefreshCw, TrendingUp, Users } from 'lucide-react';

/* ============================================================
 * Types
 * ============================================================ */

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  averageOrderValue: number;
}

interface MonthlyPoint {
  month: string;
  orders: number;
  sales: number;
}

interface DailyPoint {
  day: string;
  orders?: number;
  sales?: number;
}

interface TopCustomer {
  id: number;
  name: string;
  orders: number;
}

interface CategorySlice {
  name: string;
  value: number;
}

/** GET /admin/admin_stats response */
interface AdminStatsResponse {
  total_users: number;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
}

/** GET /admin/analytics/monthly-orders response row */
interface MonthlyOrdersRow {
  year: number;
  month: number;
  orders: number;
}

/** GET /admin/analytics/daily-orders response row */
interface DailyOrdersRow {
  day: string;
  orders: number;
}

/** GET /admin/analytics/top-customers response row */
interface TopCustomerRow {
  id: number;
  name: string;
  orders: number;
}

/* ============================================================
 * Formatting helpers
 * ============================================================ */

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatCompact = (amount: number) => {
  const value = Number(amount) || 0;
  const abs = Math.abs(value);
  if (abs >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return formatCurrency(value);
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(Number(value) || 0);

const AVATAR_TONES = ['#8A3B47', '#5C6B8A', '#6E8F8A', '#7B5468', '#B0674A', '#8E9C83'];

const InitialsAvatar = ({ name, index }: { name: string; index: number }) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';
  return (
    <span
      className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11.5px] font-semibold text-white"
      style={{ background: AVATAR_TONES[index % AVATAR_TONES.length] }}
    >
      {initials}
    </span>
  );
};

/* ============================================================
 * Response mappers (shapes from vastralaye_backend/app/routers/admin.py)
 * ============================================================ */

/** GET /admin/analytics/monthly-orders → [{year, month, orders}] */
const mapMonthly = (rows: unknown, aov: number): MonthlyPoint[] => {
  if (!Array.isArray(rows)) return [];
  const list = rows.slice(-12);
  const years = new Set(list.map((r: any) => r.year));
  return list.map((r: any) => {
    const orders = Number(r.orders) || 0;
    const monthLabel = MONTH_LABELS[(Number(r.month) - 1 + 12) % 12] ?? String(r.month);
    return {
      month: years.size > 1 ? `${monthLabel} '${String(r.year).slice(-2)}` : monthLabel,
      orders,
      sales: Math.round(orders * aov),
    };
  });
};

/** GET /admin/analytics/daily-orders → [{day: "YYYY-MM-DD", orders}] */
const mapDaily = (rows: unknown): DailyPoint[] => {
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => {
    const date = new Date(r.day);
    const label = Number.isNaN(date.getTime())
      ? String(r.day)
      : date.toLocaleDateString('en-IN', { weekday: 'short' });
    return { day: label, orders: Number(r.orders) || 0 };
  });
};

/** GET /admin/analytics/top-customers → [{id, name, orders}] */
const mapTopCustomers = (rows: unknown): TopCustomer[] => {
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => ({
    id: Number(r.id) || 0,
    name: String(r.name ?? '').trim() || (r.id ? `Customer #${r.id}` : 'Customer'),
    orders: Number(r.orders) || 0,
  }));
};

/** Product count per category → donut slices (top 4 + Other) */
const buildCategorySlices = (products: any[]): CategorySlice[] => {
  const counts: Record<string, number> = {};
  products.forEach((p) => {
    const name = (typeof p?.category === 'string' && p.category) || 'Uncategorised';
    counts[name] = (counts[name] || 0) + 1;
  });
  const sorted = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  if (sorted.length <= 5) return sorted;
  return [
    ...sorted.slice(0, 4),
    { name: 'Other', value: sorted.slice(4).reduce((sum, s) => sum + s.value, 0) },
  ];
};

/* ============================================================
 * Page — §5.4: KPI strip → 2×2 charts → top customers
 * ============================================================ */

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    averageOrderValue: 0,
  });
  const [statsLive, setStatsLive] = useState(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [monthlyLive, setMonthlyLive] = useState(false);
  const [dailyData, setDailyData] = useState<DailyPoint[]>([]);
  const [dailyLive, setDailyLive] = useState(false);
  const [categoryData, setCategoryData] = useState<CategorySlice[]>([]);
  const [categoryLive, setCategoryLive] = useState(false);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [customersLive, setCustomersLive] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);

    const [statsRes, monthlyRes, dailyRes, customersRes, productsRes] = await Promise.allSettled([
      api.get<AdminStatsResponse>('/admin/admin_stats'),
      api.get<MonthlyOrdersRow[]>('/admin/analytics/monthly-orders'),
      api.get<DailyOrdersRow[]>('/admin/analytics/daily-orders'),
      api.get<TopCustomerRow[]>('/admin/analytics/top-customers'),
      api.get<unknown[]>('/admin/products', { params: { page: 1, limit: 100 } }),
    ]);

    let fallback = false;

    /* ---- KPI stats ---- */
    let nextStats: AdminStats;
    if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
      const d = statsRes.value.data;
      nextStats = {
        totalRevenue: Number(d.total_revenue) || 0,
        totalOrders: Number(d.total_orders) || 0,
        totalUsers: Number(d.total_users) || 0,
        averageOrderValue: Number(d.average_order_value) || 0,
      };
      setStatsLive(true);
    } else {
      fallback = true;
      const mockRevenue = mockMonthlySales.reduce((sum, m) => sum + m.sales, 0);
      const mockOrders = mockMonthlySales.reduce((sum, m) => sum + m.orders, 0);
      nextStats = {
        totalRevenue: mockRevenue,
        totalOrders: mockOrders,
        totalUsers: mockCustomerData.reduce((sum, c) => sum + c.value, 0),
        averageOrderValue: mockOrders > 0 ? Math.round(mockRevenue / mockOrders) : 0,
      };
      setStatsLive(false);
    }
    setStats(nextStats);

    /* ---- Monthly orders ---- */
    if (monthlyRes.status === 'fulfilled' && Array.isArray(monthlyRes.value?.data) && monthlyRes.value.data.length > 0) {
      setMonthlyData(mapMonthly(monthlyRes.value.data, nextStats.averageOrderValue));
      setMonthlyLive(true);
    } else {
      fallback = true;
      setMonthlyData(mockMonthlySales);
      setMonthlyLive(false);
    }

    /* ---- Daily orders (last 7 days) ---- */
    if (dailyRes.status === 'fulfilled' && Array.isArray(dailyRes.value?.data) && dailyRes.value.data.length > 0) {
      setDailyData(mapDaily(dailyRes.value.data));
      setDailyLive(true);
    } else {
      fallback = true;
      setDailyData(mockDailySales.map((d) => ({ ...d, day: d.day.slice(0, 3) })));
      setDailyLive(false);
    }

    /* ---- Top customers ---- */
    if (customersRes.status === 'fulfilled' && Array.isArray(customersRes.value?.data)) {
      setTopCustomers(mapTopCustomers(customersRes.value.data));
      setCustomersLive(true);
    } else {
      fallback = true;
      setTopCustomers([]);
      setCustomersLive(false);
    }

    /* ---- Category share from products ---- */
    if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value?.data) && productsRes.value.data.length > 0) {
      setCategoryData(buildCategorySlices(productsRes.value.data));
      setCategoryLive(true);
    } else {
      fallback = true;
      setCategoryData(mockCategorySales);
      setCategoryLive(false);
    }

    setUsedFallback(fallback);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  /* Latest month + real orders delta */
  const latestMonth = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : null;
  let ordersDelta: number | null = null;
  if (monthlyLive && monthlyData.length >= 2) {
    const prev = monthlyData[monthlyData.length - 2].orders;
    if (prev > 0) ordersDelta = ((latestMonth!.orders - prev) / prev) * 100;
  }

  const salesVsOrdersLive = monthlyLive && statsLive && stats.averageOrderValue > 0;
  const salesVsOrdersData = salesVsOrdersLive ? monthlyData : mockMonthlySales;

  /* Customer donut: top-5 order share (live) or sample split */
  const customerDonutData = customersLive && topCustomers.length > 0
    ? topCustomers.slice(0, 5).map((c) => ({ name: c.name, value: c.orders }))
    : mockCustomerData;
  const topOrdersTotal = topCustomers.reduce((sum, c) => sum + c.orders, 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-md border border-border bg-white" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-md border border-border bg-white" />
            ))}
          </div>
          <div className="h-80 rounded-md border border-border bg-white" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Toolbar: fallback notice + refresh */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {usedFallback ? (
          <span className="inline-flex items-center gap-2 rounded-md border border-[#B07C1F]/30 bg-[#B07C1F]/10 px-3 py-1.5 text-xs font-medium text-[#B07C1F]">
            <AlertTriangle className="h-3.5 w-3.5" />
            Some live metrics were unavailable — showing sample data where marked
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-espresso transition-colors hover:bg-[#FBF8F3]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI strip (§5.4) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCompact(stats.totalRevenue)}
          subtitle="All time"
          icon={<IndianRupee className="h-[17px] w-[17px]" />}
          tone="maroon"
        />
        <StatsCard
          title={latestMonth ? `Orders · ${latestMonth.month}` : 'Orders'}
          value={formatNumber(latestMonth ? latestMonth.orders : stats.totalOrders)}
          subtitle={latestMonth ? undefined : 'All time'}
          icon={<Package className="h-[17px] w-[17px]" />}
          tone="gold"
          delta={ordersDelta}
        />
        <StatsCard
          title="Avg. Order Value"
          value={formatCurrency(stats.averageOrderValue)}
          subtitle="Per order average"
          icon={<TrendingUp className="h-[17px] w-[17px]" />}
          tone="info"
        />
        <StatsCard
          title="Customers"
          value={formatNumber(stats.totalUsers)}
          subtitle="Registered accounts"
          icon={<Users className="h-[17px] w-[17px]" />}
          tone="ok"
        />
      </div>

      {/* 2×2 chart grid (§5.4) */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <OrderTrendsChart
          data={monthlyData}
          title="Monthly Orders"
          subtitle={monthlyLive ? 'Current month in gold' : 'Sample data'}
          height={240}
        />
        <SalesVsOrdersChart
          data={salesVsOrdersData}
          formatCurrency={formatCompact}
          title="Sales vs Orders"
          subtitle={
            salesVsOrdersLive ? 'Revenue estimated as orders × avg. order value' : 'Sample data'
          }
          salesName={salesVsOrdersLive ? 'Est. revenue' : 'Sales (₹)'}
          height={240}
        />
        <WeeklyChart
          data={dailyData}
          formatCurrency={formatCompact}
          dataKey={dailyLive ? 'orders' : 'sales'}
          title="Weekly Performance"
          subtitle={dailyLive ? 'Orders per day · last 7 days' : 'Sample data'}
          height={220}
        />
        <CategoryChart
          data={categoryData}
          colors={CHART_SERIES}
          formatCurrency={formatCompact}
          title="Category Share"
          subtitle={categoryLive ? 'Products per category' : 'Sample data'}
          valueFormatter={categoryLive ? formatNumber : formatCompact}
          centerLabel={categoryLive ? 'products' : 'revenue'}
        />
      </div>

      {/* Top customers (§5.4) */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="min-w-0 rounded-md border border-border bg-white xl:col-span-7">
          <div className="flex items-center justify-between px-5 pb-3 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-espresso">
              Top Customers
            </h3>
            <span className="text-xs text-[#6E5F53]">By number of orders</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {['#', 'Customer', 'Orders', 'Share'].map((th, i) => (
                    <th
                      key={th}
                      className={cn(
                        'whitespace-nowrap border-b border-border bg-[#FBF8F3] px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#6E5F53]',
                        i >= 2 ? 'text-right' : 'text-left',
                      )}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCustomers.length > 0 ? (
                  topCustomers.map((customer, index) => (
                    <tr key={customer.id} className="transition-colors hover:bg-[#FBF8F3]">
                      <td className="border-b border-border px-4 py-3 font-semibold text-espresso">
                        {index + 1}
                      </td>
                      <td className="border-b border-border px-4 py-3">
                        <span className="flex items-center gap-2.5">
                          <InitialsAvatar name={customer.name} index={index} />
                          <span className="truncate font-medium text-espresso">{customer.name}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-4 py-3 text-right font-semibold text-espresso">
                        {formatNumber(customer.orders)}
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-4 py-3 text-right text-[#6E5F53]">
                        {topOrdersTotal > 0
                          ? `${Math.round((customer.orders / topOrdersTotal) * 100)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-[13px] text-[#6E5F53]">
                      <Users className="mx-auto mb-3 h-8 w-8 text-[#C9B393]" />
                      No customer data available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-5">
          <CustomerChart
            data={customerDonutData}
            title={customersLive && topCustomers.length > 0 ? 'Top Customer Share' : 'Customer Breakdown'}
            subtitle={
              customersLive && topCustomers.length > 0
                ? 'Orders among top 5 customers'
                : 'Sample data'
            }
            centerLabel={customersLive && topCustomers.length > 0 ? 'orders' : 'customers'}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
