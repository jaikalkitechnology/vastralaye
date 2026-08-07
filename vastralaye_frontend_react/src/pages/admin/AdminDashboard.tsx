import AdminLayout from '@/components/admin/AdminLayout';
import { useStore } from '@/contexts/StoreContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, ShoppingBag, Tag, TrendingUp, Package, Eye, UserCheck,
  RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight, Calendar,
  Clock, DollarSign, Star, CreditCard, Truck, BarChart3
} from 'lucide-react';
import { BASE_URL, BASE_IMG } from "@/config";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

// ============================================================
// TypeScript Interfaces
// ============================================================

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  in_stock: boolean;
  images?: string | string[];
  createdAt?: string;
  category?: string;
  colors?: string[];
  sizes?: string[];
  description?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt?: string;
}

interface Coupon {
  id: string;
  active: boolean;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  discountPercentage?: number;
  discountAmount?: number;
  expiryDate?: string;
}

// ✅ UPDATED: Order interfaces matching ACTUAL API response
interface OrderItemAPI {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  total: number;
  product_name: string;
  product_image: string;
  hsn_code: string;
  sku: string | null;
}

interface OrderAPI {
  id: number;
  user_id: number;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_address: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

// ✅ NEW: Matches the actual nested structure from API
interface OrderDataItem {
  order: OrderAPI;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItemAPI[];
  items_count: number;
  subtotal: number;
  gst_18_percent: number;
  total_with_gst: number;
}

// ✅ NORMALIZED: Flattened order for easier rendering
interface NormalizedOrder {
  id: number;
  userId: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: string | null;
  totalAmount: number;
  totalWithGst: number;
  subtotal: number;
  gstAmount: number;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItemAPI[];
  itemsCount: number;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  outOfStockProducts: number;
  activeCoupons: number;
  monthlyGrowth: number;
  averageOrderValue: number;
}

// ============================================================
// Main Component
// ============================================================

const AdminDashboard = () => {
  const { state, dispatch } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    outOfStockProducts: 0,
    activeCoupons: 0,
    monthlyGrowth: 0,
    averageOrderValue: 0,
  });

  // ✅ UPDATED: Use NormalizedOrder instead of the old Order type
  const [recentOrders, setRecentOrders] = useState<NormalizedOrder[]>([]);

  const { products = [], users = [], coupons = [] } = state || {};

  const getAuthToken = () => {
    const token = localStorage.getItem('token') || '';
    if (!token) {
      console.warn('No authentication token found');
    }
    return token;
  };

  // ============================================================
  // API Service
  // ============================================================
  const apiService = {
    async makeRequest(endpoint: string, options: RequestInit = {}) {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      console.log(`API Call: ${endpoint}`, {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status} - ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch {
          // Ignore
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },

    async getDashboardStats(): Promise<DashboardStats> {
      try {
        const data = await this.makeRequest(`${BASE_URL}/admin/admin_stats`);
        console.log('Admin Stats API Response:', data);

        return {
          totalUsers: data.total_users || 0,
          totalOrders: data.total_orders || 0,
          totalRevenue: data.total_revenue || 0,
          averageOrderValue: data.average_order_value || 0,
          totalProducts: data.total_products || 0,
          pendingOrders: data.pending_orders || 0,
          outOfStockProducts: data.out_of_stock_products || 0,
          activeCoupons: data.active_coupons || 0,
          monthlyGrowth: data.monthly_growth || 0,
        };
      } catch (error) {
        console.error('Dashboard stats error:', error);
        return {
          totalRevenue: 0,
          totalOrders: 0,
          totalUsers: 0,
          totalProducts: 0,
          pendingOrders: 0,
          outOfStockProducts: 0,
          activeCoupons: 0,
          monthlyGrowth: 0,
          averageOrderValue: 0,
        };
      }
    },

    // ✅ FIXED: Parse the nested API response and normalize it
    async getOrders(): Promise<NormalizedOrder[]> {
      try {
        const data = await this.makeRequest(
          `${BASE_URL}/admin/admin_orders?page=1&page_size=5`
        );

        console.log('Orders API Response:', data);

        // ✅ The API returns { data: [{ order: {...}, customer_name, items: [...] }] }
        const rawOrders: OrderDataItem[] = data.data || [];

        if (!Array.isArray(rawOrders)) {
          console.warn('Orders data is not an array:', rawOrders);
          return [];
        }

        // ✅ Normalize/flatten the nested structure for easy rendering
        const normalizedOrders: NormalizedOrder[] = rawOrders.map((item) => ({
          id: item.order.id,
          userId: item.order.user_id,
          status: item.order.status,
          paymentStatus: item.order.payment_status,
          paymentMethod: item.order.payment_method,
          shippingAddress: item.order.shipping_address,
          totalAmount: item.order.total_amount,
          totalWithGst: item.total_with_gst,
          subtotal: item.subtotal,
          gstAmount: item.gst_18_percent,
          createdAt: item.order.created_at,
          updatedAt: item.order.updated_at,
          customerName: item.customer_name,
          customerEmail: item.customer_email,
          customerPhone: item.customer_phone,
          items: item.items || [],
          itemsCount: item.items_count || item.items?.length || 0,
        }));

        console.log(`Normalized ${normalizedOrders.length} orders`);
        return normalizedOrders;
      } catch (error) {
        console.error('Orders fetch error:', error);
        return [];
      }
    },

    async getMonthlyAnalytics() {
      try {
        const data = await this.makeRequest(`${BASE_URL}/admin/analytics/monthly-orders`);
        return data.data || data;
      } catch (error) {
        console.warn('Monthly analytics failed:', error);
        return null;
      }
    },

    async getDailyAnalytics() {
      try {
        const data = await this.makeRequest(`${BASE_URL}/admin/analytics/daily-orders`);
        return data.data || data;
      } catch (error) {
        console.warn('Daily analytics failed:', error);
        return null;
      }
    },

    async getTopCustomers() {
      try {
        const data = await this.makeRequest(`${BASE_URL}/admin/analytics/top-customers`);
        return data.data || data;
      } catch (error) {
        console.warn('Top customers failed:', error);
        return null;
      }
    },

    async getUsers(): Promise<User[]> {
      try {
        const data = await this.makeRequest(`${BASE_URL}/admin/users`);
        if (Array.isArray(data)) return data;
        if (data?.data) return data.data;
        if (data?.users) return data.users;
        if (data?.items) return data.items;
        return [];
      } catch (error) {
        console.error('Users API error:', error);
        return [];
      }
    },

    async getProducts(): Promise<Product[]> {
      const endpoints = [
        `${BASE_URL}/admin/product/list?page=1&limit=100`,
        `${BASE_URL}/admin/products`,
        `${BASE_URL}/admin/product`
      ];

      for (const endpoint of endpoints) {
        try {
          const data = await this.makeRequest(endpoint);
          if (Array.isArray(data)) return data;
          if (data?.products) return data.products;
          if (data?.data) return data.data;
          if (data?.items) return data.items;
        } catch (error) {
          console.warn(`Products endpoint failed: ${endpoint}`, error);
        }
      }
      return [];
    },

    async getCoupons(): Promise<Coupon[]> {
      try {
        const data = await this.makeRequest(`${BASE_URL}/admin/list`);
        if (Array.isArray(data)) return data;
        if (data?.data) return data.data;
        if (data?.coupons) return data.coupons;
        return [];
      } catch (error) {
        console.error('Coupons error:', error);
        return [];
      }
    }
  };

  // ============================================================
  // Fetch all dashboard data
  // ============================================================
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting dashboard data fetch...');

      const [dashboardStats, orders] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getOrders(),
      ]);

      setStats(dashboardStats);
      setRecentOrders(orders);

      const [usersData, productsData, couponsData] = await Promise.allSettled([
        apiService.getUsers(),
        apiService.getProducts(),
        apiService.getCoupons(),
      ]);

      if (usersData.status === 'fulfilled') {
        dispatch({ type: 'SET_USERS', payload: usersData.value as any });
      } else {
        dispatch({ type: 'SET_USERS', payload: [] as any });
      }

      if (productsData.status === 'fulfilled') {
        dispatch({ type: 'SET_PRODUCTS', payload: productsData.value as any });
      } else {
        dispatch({ type: 'SET_PRODUCTS', payload: [] });
      }

      if (couponsData.status === 'fulfilled') {
        dispatch({ type: 'SET_COUPONS', payload: couponsData.value as any });
      } else {
        dispatch({ type: 'SET_COUPONS', payload: [] });
      }

      Promise.allSettled([
        apiService.getMonthlyAnalytics(),
        apiService.getDailyAnalytics(),
        apiService.getTopCustomers()
      ]);

      console.log('Dashboard data fetch completed');
    } catch (err) {
      console.error('Critical error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ============================================================
  // Helper Functions
  // ============================================================

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const recentUsers = users.length > 0
    ? [...users]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
    : [];

  const parseProductImages = (images: string | string[] | undefined): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [parsed].filter(Boolean);
    } catch {
      return images.split(',').map(img => img.trim()).filter(Boolean);
    }
  };

  const formatCurrency = (amount: number | string | undefined | null) => {
    const numericAmount = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { bg: string; text: string; dot: string } } = {
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      processing: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      shipped: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
      confirmed: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const config: { [key: string]: { bg: string; text: string; icon: string } } = {
      paid: { bg: 'bg-green-50', text: 'text-green-700', icon: '✓' },
      unpaid: { bg: 'bg-red-50', text: 'text-red-700', icon: '✗' },
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '⏳' },
      refunded: { bg: 'bg-gray-50', text: 'text-gray-700', icon: '↩' },
    };

    const statusConfig = config[paymentStatus?.toLowerCase()] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
        <span>{statusConfig.icon}</span>
        {paymentStatus?.charAt(0).toUpperCase() + paymentStatus?.slice(1)}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: { [key: string]: { label: string; icon: typeof CreditCard } } = {
      cod: { label: 'COD', icon: Truck },
      online: { label: 'Online', icon: CreditCard },
      upi: { label: 'UPI', icon: CreditCard },
      card: { label: 'Card', icon: CreditCard },
    };

    const config = methods[method?.toLowerCase()] || { label: method, icon: CreditCard };
    const IconComponent = config.icon;

    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  // ============================================================
  // Loading State
  // ============================================================
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
            <p className="text-gray-600">Fetching your store data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ============================================================
  // Error State
  // ============================================================
  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-gray-900 mb-3">Troubleshooting:</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Check your internet connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Verify admin authentication</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Check browser console for errors</span>
                </li>
              </ul>
            </div>
            <Button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 mx-auto bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Loading
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {/* Total Revenue */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="relative pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-100">Total Revenue</CardTitle>
              <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold mb-2">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center gap-1 text-emerald-100">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">From {stats.totalOrders} orders</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="relative pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-100">Total Orders</CardTitle>
              <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold mb-2">{stats.totalOrders}</div>
            <div className="flex items-center gap-2 text-blue-100">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-sm">
                {stats.pendingOrders > 0
                  ? `${stats.pendingOrders} pending`
                  : 'All processed'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="relative pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-100">Total Users</CardTitle>
              <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold mb-2">{stats.totalUsers}</div>
            <div className="flex items-center gap-1 text-purple-100">
              <UserCheck className="h-3.5 w-3.5" />
              <span className="text-sm">Registered customers</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="relative pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-100">Avg Order Value</CardTitle>
              <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold mb-2">{formatCurrency(stats.averageOrderValue)}</div>
            <div className="flex items-center gap-1 text-orange-100">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-sm">Per order average</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-xs text-gray-500 mt-1">In catalog</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Package className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Coupons</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCoupons}</p>
                <p className="text-xs text-gray-500 mt-1">{coupons.length} total</p>
              </div>
              <div className="p-3 bg-pink-50 rounded-xl">
                <Tag className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                <p className="text-xs text-gray-500 mt-1">Need attention</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStockProducts}</p>
                <p className="text-xs text-gray-500 mt-1">Unavailable</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Recent Products */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Products</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Latest additions to your store</p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentProducts.length > 0 ? (
                recentProducts.map((product) => {
                  const images = parseProductImages(product.images);
                  const firstImage = images[0];
                  const displayPrice = product.discountPrice || product.price;

                  return (
                    <div key={product.id} className="flex items-center p-4 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                          {firstImage ? (
                            <img
                              src={`${BASE_IMG.replace('/api/v1', '')}/${firstImage.replace(/^\/+/, '')}`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/no-image.png";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate mb-0.5">{product.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(typeof displayPrice === 'number' ? displayPrice : 0)}
                            </p>
                            {product.discountPrice && product.discountPrice < product.price && (
                              <span className="text-xs line-through text-gray-400">
                                {formatCurrency(product.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {getStatusBadge(product.in_stock ? 'completed' : 'cancelled')}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-900 mb-1">No products yet</p>
                  <p className="text-sm">Start adding products to see them here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ============================================================ */}
        {/* ✅ FIXED: Recent Orders - Now uses NormalizedOrder structure */}
        {/* ============================================================ */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Orders</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Latest {recentOrders.length} of {stats.totalOrders} orders
                </p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <ShoppingBag className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  // ✅ FIXED: Get product image from the normalized items array
                  const firstItem = order.items?.[0];
                  const productImage = firstItem?.product_image || '';

                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors group"
                    >
                      {/* Left: Image + Details */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* ✅ FIXED: Product thumbnail using product_image field */}
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 group-hover:border-gray-300 transition-colors">
                          {productImage ? (
                            <img
                              src={`${BASE_IMG.replace('/api/v1', '')}/${productImage.replace(/^\/+/, '')}`}
                              alt={firstItem?.product_name || 'Product'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/no-image.png";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-50">
                              <ShoppingBag className="h-5 w-5 text-blue-400" />
                            </div>
                          )}
                        </div>

                        {/* ✅ FIXED: Order info using normalized fields */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate mb-0.5">
                            Order #{order.id}
                          </p>
                          {/* ✅ FIXED: Uses customerName instead of user.first_name */}
                          <p className="text-sm text-gray-600 truncate">
                            {order.customerName}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(order.createdAt)}
                            </span>
                            {getPaymentMethodLabel(order.paymentMethod)}
                            {/* ✅ Show items count */}
                            <span className="text-xs text-gray-400">
                              {order.itemsCount} item{order.itemsCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount + Status */}
                      <div className="flex-shrink-0 ml-4 text-right">
                        {/* ✅ FIXED: Show total with GST */}
                        <p className="font-bold text-gray-900 mb-0.5">
                          {formatCurrency(order.totalWithGst || order.totalAmount)}
                        </p>
                        {/* ✅ Show subtotal if different from total */}
                        {order.totalWithGst > order.totalAmount && (
                          <p className="text-xs text-gray-400 mb-1">
                            Subtotal: {formatCurrency(order.subtotal)}
                          </p>
                        )}
                        <div className="mb-1">
                          {getStatusBadge(order.status)}
                        </div>
                        {getPaymentBadge(order.paymentStatus)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-900 mb-1">No orders yet</p>
                  <p className="text-sm">Orders will appear here when customers make purchases</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-500">Detailed insights</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Manage Products</p>
                <p className="text-sm text-gray-500">Add or edit items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">User Management</p>
                <p className="text-sm text-gray-500">View all users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;