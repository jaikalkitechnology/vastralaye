import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminLoading from '@/components/admin/AdminLoading';
import StatsCard from '@/components/admin/cards/StatsCard';
import MonthlyChart from '@/components/admin/charts/MonthlyChart';
import CategoryChart from '@/components/admin/charts/CategoryChart';
import { CHART_SERIES } from '@/components/admin/charts/chartTheme';
import {
  monthlySales as mockMonthlySales,
  categorySales as mockCategorySales,
  customerData as mockCustomerData,
} from '@/components/admin/data/mockAnalyticsData';
import { api } from '@/api/api';
import { BASE_IMG } from '@/config';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  BarChart3,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';

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

interface RecentOrder {
  id: number;
  createdAt: string;
  customerName: string;
  city: string;
  itemsCount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
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

interface ProductLite {
  id: number | string;
  name: string;
  price: number;
  discount_price?: number | null;
  category?: string | null;
  images?: string[] | string;
  in_stock?: boolean;
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

/** GET /admin/analytics/top-customers response row */
interface TopCustomerRow {
  id: number;
  name: string;
  orders: number;
}

/* ============================================================
 * Formatting & chip helpers (admin_design.md §3)
 * ============================================================ */

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatCurrency = (amount: number | string | undefined | null) => {
  const numeric = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
};

/** ₹12.4L style compact rupees for KPI numbers & chart ticks */
const formatCompact = (amount: number) => {
  const value = Number(amount) || 0;
  const abs = Math.abs(value);
  if (abs >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return formatCurrency(value);
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(Number(value) || 0);

const formatDateTime = (dateString: string) => {
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  } catch {
    return '—';
  }
};

type ChipTone = 'ok' | 'warn' | 'info' | 'err' | 'mut';

const CHIP_CLASSES: Record<ChipTone, string> = {
  ok: 'text-[#3E6B4F] bg-[#3E6B4F]/10',
  warn: 'text-[#B07C1F] bg-[#B07C1F]/10',
  info: 'text-[#5C6B8A] bg-[#5C6B8A]/10',
  err: 'text-[#C62828] bg-[#C62828]/10',
  mut: 'text-[#6E5F53] bg-[#6E5F53]/10',
};

const STATUS_TONES: Record<string, ChipTone> = {
  delivered: 'ok',
  confirmed: 'ok',
  completed: 'ok',
  active: 'ok',
  paid: 'ok',
  pending: 'warn',
  processing: 'warn',
  shipped: 'info',
  'in transit': 'info',
  cancelled: 'err',
  failed: 'err',
  refunded: 'err',
  unpaid: 'err',
};

const Chip = ({ tone, children }: { tone: ChipTone; children: React.ReactNode }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
      CHIP_CLASSES[tone],
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {children}
  </span>
);

const statusChip = (status: string) => {
  const key = (status || 'pending').toLowerCase();
  const label = key.charAt(0).toUpperCase() + key.slice(1);
  return <Chip tone={STATUS_TONES[key] ?? 'mut'}>{label}</Chip>;
};

const paymentChip = (paymentStatus: string, method: string) => {
  const key = (paymentStatus || 'pending').toLowerCase();
  const methodLabel = (method || '').toUpperCase();
  if (key === 'paid') return <Chip tone="ok">{methodLabel ? `Paid · ${methodLabel}` : 'Paid'}</Chip>;
  if (key === 'failed') return <Chip tone="err">Failed</Chip>;
  if (key === 'refunded') return <Chip tone="mut">Refunded</Chip>;
  if ((method || '').toLowerCase() === 'cod') return <Chip tone="warn">COD</Chip>;
  return <Chip tone="warn">{key.charAt(0).toUpperCase() + key.slice(1)}</Chip>;
};

const AVATAR_TONES = ['#8A3B47', '#5C6B8A', '#6E8F8A', '#7B5468', '#B0674A', '#8E9C83'];

const InitialsAvatar = ({ name, index, size = 32 }: { name: string; index: number; size?: number }) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';
  return (
    <span
      className="flex flex-none items-center justify-center rounded-full text-[11.5px] font-semibold text-white"
      style={{ width: size, height: size, background: AVATAR_TONES[index % AVATAR_TONES.length] }}
    >
      {initials}
    </span>
  );
};

const parseProductImages = (images: ProductLite['images']): string[] => {
  if (!images) return [];
  if (Array.isArray(images)) return images.filter(Boolean);
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed].filter(Boolean);
  } catch {
    return images.split(',').map((img) => img.trim()).filter(Boolean);
  }
};

const productImageUrl = (path: string) =>
  `${BASE_IMG.replace('/api/v1', '')}/${path.replace(/^\/+/, '')}`;

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

/** GET /admin/admin_orders → {data: [{order, subtotal, gst_18_percent, total_with_gst}], total} */
const mapOrders = (payload: any): RecentOrder[] => {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map((item: any) => {
    const order = item?.order ?? item ?? {};
    const user = order?.user ?? {};
    const items = item?.items ?? order?.items ?? [];
    const customerName =
      item?.customer_name ||
      order?.customer_name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
      (order?.user_id ? `Customer #${order.user_id}` : 'Customer');
    return {
      id: Number(order?.id) || 0,
      createdAt: order?.created_at ?? '',
      customerName,
      city: order?.city || '',
      itemsCount: Number(item?.items_count) || (Array.isArray(items) ? items.length : 0),
      total: Number(item?.total_with_gst ?? order?.total_amount) || 0,
      paymentMethod: order?.payment_method || '',
      paymentStatus: order?.payment_status || 'pending',
      status: order?.status || 'pending',
    };
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
const buildCategorySlices = (products: ProductLite[]): CategorySlice[] => {
  const counts: Record<string, number> = {};
  products.forEach((p) => {
    const name = (typeof p.category === 'string' && p.category) || 'Uncategorised';
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
 * Page
 * ============================================================ */

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    averageOrderValue: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [monthlyLive, setMonthlyLive] = useState(false);
  const [categoryData, setCategoryData] = useState<CategorySlice[]>([]);
  const [categoryLive, setCategoryLive] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [recentProducts, setRecentProducts] = useState<ProductLite[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    const [statsRes, monthlyRes, ordersRes, customersRes, productsRes] = await Promise.allSettled([
      api.get<AdminStatsResponse>('/admin/admin_stats'),
      api.get<MonthlyOrdersRow[]>('/admin/analytics/monthly-orders'),
      api.get<{ data: unknown[]; total: number }>('/admin/admin_orders', {
        params: { page: 1, page_size: 6 },
      }),
      api.get<TopCustomerRow[]>('/admin/analytics/top-customers'),
      api.get<ProductLite[]>('/admin/products', { params: { page: 1, limit: 100 } }),
    ]);

    let fallback = false;

    /* ---- KPI stats: /admin/admin_stats ---- */
    let nextStats: AdminStats;
    if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
      const d = statsRes.value.data;
      nextStats = {
        totalRevenue: Number(d.total_revenue) || 0,
        totalOrders: Number(d.total_orders) || 0,
        totalUsers: Number(d.total_users) || 0,
        averageOrderValue: Number(d.average_order_value) || 0,
      };
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
    }
    setStats(nextStats);

    /* ---- Monthly orders: /admin/analytics/monthly-orders ---- */
    if (monthlyRes.status === 'fulfilled' && Array.isArray(monthlyRes.value?.data) && monthlyRes.value.data.length > 0) {
      setMonthlyData(mapMonthly(monthlyRes.value.data, nextStats.averageOrderValue));
      setMonthlyLive(true);
    } else {
      fallback = true;
      setMonthlyData(mockMonthlySales);
      setMonthlyLive(false);
    }

    /* ---- Recent orders: /admin/admin_orders ---- */
    if (ordersRes.status === 'fulfilled') {
      setRecentOrders(mapOrders(ordersRes.value?.data));
    } else {
      setRecentOrders([]);
    }

    /* ---- Top customers: /admin/analytics/top-customers ---- */
    if (customersRes.status === 'fulfilled') {
      setTopCustomers(mapTopCustomers(customersRes.value?.data).slice(0, 5));
    } else {
      setTopCustomers([]);
    }

    /* ---- Products → category donut + recent products ---- */
    if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value?.data) && productsRes.value.data.length > 0) {
      const products: ProductLite[] = productsRes.value.data;
      setRecentProducts(products.slice(0, 5));
      setCategoryData(buildCategorySlices(products));
      setCategoryLive(true);
    } else {
      fallback = true;
      setRecentProducts([]);
      setCategoryData(mockCategorySales);
      setCategoryLive(false);
    }

    setUsedFallback(fallback);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /* Real orders delta: latest month vs previous month */
  let ordersDelta: number | null = null;
  if (monthlyLive && monthlyData.length >= 2) {
    const prev = monthlyData[monthlyData.length - 2].orders;
    const curr = monthlyData[monthlyData.length - 1].orders;
    if (prev > 0) ordersDelta = ((curr - prev) / prev) * 100;
  }

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoading label="dashboard" />
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
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-espresso transition-colors hover:bg-[#FBF8F3]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI row (§5.1 row 1) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCompact(stats.totalRevenue)}
          subtitle={`From ${formatNumber(stats.totalOrders)} orders`}
          icon={<IndianRupee className="h-[17px] w-[17px]" />}
          tone="maroon"
        />
        <StatsCard
          title="Orders"
          value={formatNumber(stats.totalOrders)}
          subtitle="All time"
          icon={<Package className="h-[17px] w-[17px]" />}
          tone="gold"
          delta={ordersDelta}
        />
        <StatsCard
          title="Customers"
          value={formatNumber(stats.totalUsers)}
          subtitle="Registered accounts"
          icon={<Users className="h-[17px] w-[17px]" />}
          tone="ok"
        />
        <StatsCard
          title="Avg. Order Value"
          value={formatCurrency(stats.averageOrderValue)}
          subtitle="Per order average"
          icon={<TrendingUp className="h-[17px] w-[17px]" />}
          tone="info"
        />
      </div>

      {/* Charts row (§5.1 row 2) */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <MonthlyChart
            data={monthlyData}
            formatCurrency={formatCompact}
            dataKey="orders"
            title="Orders Overview"
            subtitle={monthlyLive ? 'Orders per month' : 'Sample data'}
            height={280}
          />
        </div>
        <div className="xl:col-span-4">
          <CategoryChart
            data={categoryData}
            colors={CHART_SERIES}
            formatCurrency={formatCompact}
            title={categoryLive ? 'Catalog by Category' : 'Sales by Category'}
            subtitle={categoryLive ? 'Products per category' : 'Sample data'}
            valueFormatter={categoryLive ? formatNumber : formatCompact}
            centerLabel={categoryLive ? 'products' : 'revenue'}
          />
        </div>
      </div>

      {/* Recent orders + right column (§5.1 row 3) */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Recent orders table */}
        <div className="min-w-0 rounded-md border border-border bg-white xl:col-span-7">
          <div className="flex items-center justify-between px-5 pb-3 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-espresso">
              Recent Orders
            </h3>
            <Link to="/admin/orders" className="text-xs font-medium text-maroon hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status'].map((th, i) => (
                    <th
                      key={th}
                      className={cn(
                        'whitespace-nowrap border-b border-border bg-[#FBF8F3] px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#6E5F53]',
                        i === 2 || i === 3 ? 'text-right' : 'text-left',
                      )}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => (
                    <tr key={order.id} className="transition-colors hover:bg-[#FBF8F3]">
                      <td className="whitespace-nowrap border-b border-border px-4 py-3">
                        <span className="block font-semibold text-espresso">#{order.id}</span>
                        <span className="block text-[11.5px] text-[#6E5F53]">
                          {formatDateTime(order.createdAt)}
                        </span>
                      </td>
                      <td className="border-b border-border px-4 py-3">
                        <span className="flex items-center gap-2.5">
                          <InitialsAvatar name={order.customerName} index={index} />
                          <span className="min-w-0">
                            <span className="block max-w-[150px] truncate font-medium text-espresso">
                              {order.customerName}
                            </span>
                            {order.city && (
                              <span className="block text-[11.5px] text-[#6E5F53]">{order.city}</span>
                            )}
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-4 py-3 text-right text-[#6E5F53]">
                        {order.itemsCount || '—'}
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-4 py-3 text-right font-semibold text-espresso">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-4 py-3">
                        {paymentChip(order.paymentStatus, order.paymentMethod)}
                      </td>
                      <td className="whitespace-nowrap border-b border-border px-4 py-3">
                        {statusChip(order.status)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[#6E5F53]">
                      <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-[#C9B393]" />
                      No orders yet — they'll appear here as customers purchase
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column stack */}
        <div className="flex min-w-0 flex-col gap-5 xl:col-span-5">
          {/* Top customers (live: /admin/analytics/top-customers) */}
          <div className="rounded-md border border-border bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-espresso">
                Top Customers
              </h3>
              <Link to="/admin/analytics" className="text-xs font-medium text-maroon hover:underline">
                Analytics →
              </Link>
            </div>
            {topCustomers.length > 0 ? (
              <ul>
                {topCustomers.map((customer, index) => (
                  <li
                    key={customer.id}
                    className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
                  >
                    <span className="w-4 text-[12px] font-semibold text-[#6E5F53]">{index + 1}</span>
                    <InitialsAvatar name={customer.name} index={index} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-espresso">
                      {customer.name}
                    </span>
                    <span className="text-right">
                      <span className="block text-[13px] font-semibold text-espresso">
                        {formatNumber(customer.orders)}
                      </span>
                      <span className="block text-[11px] text-[#6E5F53]">orders</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-[12.5px] text-[#6E5F53]">
                No customer data available yet
              </p>
            )}
          </div>

          {/* Recent products */}
          <div className="rounded-md border border-border bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-espresso">
                Recent Products
              </h3>
              <Link to="/admin/products" className="text-xs font-medium text-maroon hover:underline">
                View all →
              </Link>
            </div>
            {recentProducts.length > 0 ? (
              <ul>
                {recentProducts.map((product) => {
                  const image = parseProductImages(product.images)[0];
                  const displayPrice =
                    product.discount_price && product.discount_price > 0
                      ? product.discount_price
                      : product.price;
                  return (
                    <li
                      key={product.id}
                      className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
                    >
                      <span className="h-[46px] w-[38px] flex-none overflow-hidden rounded bg-[#F7F4EF]">
                        {image ? (
                          <img
                            src={productImageUrl(image)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            <Package className="h-4 w-4 text-[#C9B393]" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-espresso">
                          {product.name}
                        </span>
                        <span className="block text-[11.5px] text-[#6E5F53]">
                          {product.category ? `${product.category} · ` : ''}
                          {formatCurrency(displayPrice)}
                        </span>
                      </span>
                      {product.in_stock === false ? (
                        <Chip tone="err">Out of stock</Chip>
                      ) : (
                        <Chip tone="ok">In stock</Chip>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-6 text-center text-[12.5px] text-[#6E5F53]">No products yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions (existing widget, restyled) */}
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        {[
          {
            to: '/admin/analytics',
            icon: <BarChart3 className="h-[17px] w-[17px]" />,
            tone: 'bg-maroon/10 text-maroon',
            title: 'View Analytics',
            text: 'Detailed insights',
          },
          {
            to: '/admin/products',
            icon: <Package className="h-[17px] w-[17px]" />,
            tone: 'bg-[#3E6B4F]/10 text-[#3E6B4F]',
            title: 'Manage Products',
            text: 'Add or edit items',
          },
          {
            to: '/admin/users',
            icon: <Users className="h-[17px] w-[17px]" />,
            tone: 'bg-[#5C6B8A]/10 text-[#5C6B8A]',
            title: 'User Management',
            text: 'View all users',
          },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group flex items-center gap-4 rounded-md border border-border bg-white p-5 transition-colors hover:bg-[#FBF8F3]"
          >
            <span className={cn('flex h-9 w-9 flex-none items-center justify-center rounded-lg', action.tone)}>
              {action.icon}
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold text-espresso">{action.title}</span>
              <span className="block text-xs text-[#6E5F53]">{action.text}</span>
            </span>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
