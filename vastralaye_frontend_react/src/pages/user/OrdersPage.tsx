import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Search,
  Home,
  Banknote,
  CreditCard,
  Wallet,
  Shield,
  AlertCircle,
  RefreshCw,
  IndianRupee,
  MapPin,
} from 'lucide-react';
import { BASE_URL } from '@/config';
import UserLayout from "@/components/user/UserLayout";
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════
//                        TYPES
// ═══════════════════════════════════════════════════════════

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name?: string;
  product_image?: string;
  hsn_code?: string; // ✅ Added HSN Code
  product?: {
    id: number;
    name: string;
    images?: string;
    hsn_code?: string; // ✅ Added here too
  };
}

interface TrackingUpdate {
  status: string;
  message?: string;
  timestamp?: string;
}

interface OrderHistoryItem {
  id: number;
  user_id?: number;
  status: string;
  total_amount: number;
  payment_method?: string;
  payment_status?: string;
  shipping_address?: string;
  created_at: string;
  items?: OrderItem[];
  tracking?: TrackingUpdate[];
  total_items?: number;
  latest_tracking?: TrackingUpdate | null;
}

// ═══════════════════════════════════════════════════════════
//                    AUTH HELPER
// ═══════════════════════════════════════════════════════════

const getAuthToken = (): string => {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

// ═══════════════════════════════════════════════════════════
//              PAYMENT & STATUS HELPERS
// ═══════════════════════════════════════════════════════════

const getPaymentMethodInfo = (method?: string) => {
  const m = (method || 'cod').toLowerCase();
  const map: Record<string, any> = {
    cod: { label: 'Cash on Delivery', shortLabel: 'COD', icon: Banknote, color: 'text-muted-foreground', bgColor: 'bg-sand/60', borderColor: 'border-border' },
    card: { label: 'Credit/Debit Card', shortLabel: 'Card', icon: CreditCard, color: 'text-muted-foreground', bgColor: 'bg-sand/60', borderColor: 'border-border' },
    upi: { label: 'UPI Payment', shortLabel: 'UPI', icon: Wallet, color: 'text-muted-foreground', bgColor: 'bg-sand/60', borderColor: 'border-border' },
    netbanking: { label: 'Net Banking', shortLabel: 'NetBanking', icon: Shield, color: 'text-muted-foreground', bgColor: 'bg-sand/60', borderColor: 'border-border' },
  };
  return map[m] || map['cod'];
};

const getStatusConfig = (status: string) => {
  const s = status.toLowerCase();
  const configs: Record<string, any> = {
    pending: { label: 'Pending', icon: Clock, color: 'text-[#8A6414]', bgColor: 'bg-gold/15', borderColor: 'border-gold/30', dotColor: 'bg-gold' },
    processing: { label: 'Processing', icon: Package, color: 'text-[#8A6414]', bgColor: 'bg-gold/15', borderColor: 'border-gold/30', dotColor: 'bg-gold' },
    shipped: { label: 'In Transit', icon: Truck, color: 'text-[#8A6414]', bgColor: 'bg-gold/15', borderColor: 'border-gold/30', dotColor: 'bg-gold' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-[#3E6B4F]', bgColor: 'bg-[#3E6B4F]/10', borderColor: 'border-[#3E6B4F]/25', dotColor: 'bg-[#3E6B4F]' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-sale', bgColor: 'bg-sale/10', borderColor: 'border-sale/25', dotColor: 'bg-sale' },
  };
  return configs[s] || configs['pending'];
};

const getPaymentStatusConfig = (status: string) => {
  const s = (status || 'unpaid').toLowerCase();
  const configs: Record<string, any> = {
    paid: { label: 'Paid', color: 'text-[#3E6B4F]', bgColor: 'bg-[#3E6B4F]/10', borderColor: 'border-[#3E6B4F]/25' },
    unpaid: { label: 'Unpaid', color: 'text-sale', bgColor: 'bg-sale/10', borderColor: 'border-sale/25' },
    pending: { label: 'Pending', color: 'text-[#8A6414]', bgColor: 'bg-gold/15', borderColor: 'border-gold/30' },
    refunded: { label: 'Refunded', color: 'text-muted-foreground', bgColor: 'bg-sand/60', borderColor: 'border-border' },
  };
  return configs[s] || configs['unpaid'];
};

const getProductImageUrl = (imageStr?: any): string => {
  if (!imageStr) return "/placeholder.svg";

  let imagePath: string | null = null;

  // If array
  if (Array.isArray(imageStr)) {
    imagePath = imageStr[0] || null;
  }

  // If string
  else if (typeof imageStr === "string") {
    if (imageStr.startsWith("[")) {
      try {
        const parsed = JSON.parse(imageStr);
        imagePath = Array.isArray(parsed) ? parsed[0] : null;
      } catch {
        imagePath = imageStr;
      }
    } else {
      imagePath = imageStr;
    }
  }

  if (!imagePath) return "/placeholder.svg";

  // Already full URL
  if (imagePath.startsWith("http")) return imagePath;

  // Clean base URL
  const baseUrl = BASE_URL.replace(/\/api\/v1\/?$/, "");
  const cleanPath = imagePath.replace(/^\/+/, "");

  return `${baseUrl}/${cleanPath}`;
};

// Status chip — pill per design.md §5.12
const statusChipClasses = (cfg: any) =>
  `inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`;

const quietChipClasses = (cfg: any) =>
  `inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`;

// Status timeline (presentation only)
const TIMELINE_STEPS = ['Placed', 'Processing', 'Shipped', 'Delivered'];

const getTimelineIndex = (status: string): number => {
  switch (status.toLowerCase()) {
    case 'processing': return 1;
    case 'shipped': return 2;
    case 'delivered': return 3;
    default: return 0; // pending
  }
};

// ═══════════════════════════════════════════════════════════
//                   ORDERS PAGE
// ═══════════════════════════════════════════════════════════

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // ─── FETCH ORDERS ───
  useEffect(() => {
    const fetchOrders = async () => {
      const token = getAuthToken();

      if (!token) {
        toast.error("Please log in to view your orders");
        navigate("/login");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('📋 Fetching order history...');

        const response = await fetch(`${BASE_URL}/users/user/orders/history`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('📡 Response status:', response.status);

        if (response.status === 401) {
          toast.error("Session expired. Please log in again.");
          localStorage.removeItem('access_token');
          localStorage.removeItem('token');
          localStorage.removeItem('userToken');
          navigate("/login");
          return;
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `Failed to fetch orders (${response.status})`);
        }

        const data = await response.json();

        // Handle different response formats
        let ordersList: OrderHistoryItem[] = [];

        if (Array.isArray(data)) {
          ordersList = data;
        } else if (data.orders && Array.isArray(data.orders)) {
          ordersList = data.orders;
        } else if (data.data && Array.isArray(data.data)) {
          ordersList = data.data;
        }

        // Normalize each order
        const normalized = ordersList.map((order: any) => ({
          id: order.id,
          user_id: order.user_id,
          status: order.status || 'pending',
          total_amount: Number(order.total_amount || 0),
          payment_method: order.payment_method || 'cod',
          payment_status: order.payment_status || 'unpaid',

          // ✅ Normalize shipping address (handle "string" case)
          shipping_address: order.shipping_address && order.shipping_address !== "string"
            ? order.shipping_address
            : null,

          created_at: order.created_at || new Date().toISOString(),
          items: Array.isArray(order.items) ? order.items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity || 1,
            price: Number(item.price || 0),
            product_name: item.product_name || item.product?.name || `Product #${item.product_id}`,
            product_image: item.product_image || item.product?.images || null,
            hsn_code: item.hsn_code || item.product?.hsn_code || null, // ✅ Capture HSN Code
          })) : [],
          total_items: order.total_items || (Array.isArray(order.items)
            ? order.items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0)
            : 0),
          latest_tracking: order.latest_tracking || null,
        }));

        setOrders(normalized);

      } catch (err: any) {
        console.error('❌ Error fetching orders:', err);
        setError(err.message || "Failed to load orders");
        toast.error(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  // ─── FILTER & SORT ───
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(order =>
        String(order.id).includes(q) ||
        order.status.toLowerCase().includes(q) ||
        order.items?.some(item =>
          (item.product_name || '').toLowerCase().includes(q)
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status.toLowerCase() === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      result = result.filter(order => (order.payment_method || 'cod').toLowerCase() === paymentFilter);
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'price_high':
        result.sort((a, b) => b.total_amount - a.total_amount);
        break;
      case 'price_low':
        result.sort((a, b) => a.total_amount - b.total_amount);
        break;
      default: // newest
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [orders, searchQuery, statusFilter, paymentFilter, sortBy]);

  // ─── STATS ───
  const stats = useMemo(() => {
    const total = orders.length;
    const totalSpent = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total_amount, 0);
    const active = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status.toLowerCase())).length;
    const delivered = orders.filter(o => o.status.toLowerCase() === 'delivered').length;

    return { total, totalSpent, active, delivered };
  }, [orders]);

  // ─── HELPERS ───
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch { return dateString; }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateString; }
  };

  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // ═══════════════════════════════════════════════
  //               LOADING
  // ═══════════════════════════════════════════════

  if (loading) {
    return (
      <UserLayout>
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-maroon" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </UserLayout>
    );
  }

  // ═══════════════════════════════════════════════
  //               ERROR
  // ═══════════════════════════════════════════════

  if (error) {
    return (
      <UserLayout>
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <AlertCircle className="h-14 w-14 text-sale/60" />
          <h2 className="font-serif text-2xl font-medium text-espresso">Failed to Load Orders</h2>
          <p className="max-w-md text-center text-muted-foreground">{error}</p>
          <div className="flex gap-3">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="h-auto gap-2 rounded-sm px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em]"
            >
              <RefreshCw className="h-3.5 w-3.5" />Retry
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="h-auto gap-2 rounded-sm bg-maroon px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ivory hover:bg-terracotta"
            >
              <Home className="h-3.5 w-3.5" />Home
            </Button>
          </div>
        </div>
      </UserLayout>
    );
  }

  // ═══════════════════════════════════════════════
  //               EMPTY STATE
  // ═══════════════════════════════════════════════

  if (orders.length === 0) {
    return (
      <UserLayout>
        <div className="flex h-72 flex-col items-center justify-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blush">
            <ShoppingBag className="h-9 w-9 text-maroon" />
          </div>
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px w-11 bg-gold" />
            <span className="h-[5px] w-[5px] rotate-45 bg-gold" />
            <span className="h-px w-11 bg-gold" />
          </div>
          <h2 className="font-serif text-2xl font-medium text-espresso">No Orders Yet</h2>
          <p className="max-w-md text-center text-muted-foreground">
            You haven't placed any orders yet. Start shopping to see your orders here.
          </p>
          <Button
            onClick={() => navigate('/products')}
            className="h-auto gap-2 rounded-sm bg-maroon px-6 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ivory hover:bg-terracotta"
          >
            <ShoppingBag className="h-3.5 w-3.5" />Start Shopping
          </Button>
        </div>
      </UserLayout>
    );
  }

  // ═══════════════════════════════════════════════
  //               MAIN RENDER
  // ═══════════════════════════════════════════════

  return (
    <UserLayout>
      <div className="space-y-6">

        {/* Page head */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="overline-label mb-1.5">Order history</span>
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso">My Orders</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length} order{orders.length !== 1 ? 's' : ''} placed with Vastraliya
            </p>
          </div>
          <Button
            onClick={() => navigate('/products')}
            variant="outline"
            className="h-auto rounded-sm px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em]"
          >
            Continue Shopping
          </Button>
        </div>

        {/* Stat band */}
        <div className="grid grid-cols-2 md:grid-cols-4 rounded-sm border border-border bg-white divide-y divide-border md:divide-y-0 md:divide-x">
          <div className="p-4 md:px-5 md:py-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <ShoppingBag className="h-[13px] w-[13px] text-[#8A6414]" />Total Orders
            </p>
            <p className="font-serif text-2xl font-medium text-espresso mt-1">{stats.total}</p>
          </div>
          <div className="p-4 md:px-5 md:py-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <IndianRupee className="h-[13px] w-[13px] text-[#8A6414]" />Total Spent
            </p>
            <p className="font-serif text-2xl font-medium text-espresso mt-1">{formatPrice(stats.totalSpent)}</p>
          </div>
          <div className="p-4 md:px-5 md:py-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Truck className="h-[13px] w-[13px] text-[#8A6414]" />Active
            </p>
            <p className="font-serif text-2xl font-medium text-espresso mt-1">{stats.active}</p>
          </div>
          <div className="p-4 md:px-5 md:py-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <CheckCircle className="h-[13px] w-[13px] text-[#8A6414]" />Delivered
            </p>
            <p className="font-serif text-2xl font-medium text-espresso mt-1">{stats.delivered}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or product name..."
              className="rounded-sm border-input bg-white pl-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-maroon"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full rounded-sm border-input bg-white md:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full rounded-sm border-input bg-white md:w-[160px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment</SelectItem>
              <SelectItem value="cod">COD</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="netbanking">Net Banking</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full rounded-sm border-input bg-white md:w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price_high">Price: High-Low</SelectItem>
              <SelectItem value="price_low">Price: Low-High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all') && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); setPaymentFilter('all'); setSortBy('newest'); }}
              className="text-[13px] text-maroon underline underline-offset-[3px] hover:text-terracotta"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="rounded-sm border border-border bg-white py-14 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="font-serif text-xl font-medium text-espresso">No orders found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const paymentInfo = getPaymentMethodInfo(order.payment_method);
              const PaymentIcon = paymentInfo.icon;
              const payStatusConfig = getPaymentStatusConfig(order.payment_status || 'unpaid');
              const isCancelled = order.status.toLowerCase() === 'cancelled';
              const isDelivered = order.status.toLowerCase() === 'delivered';
              const currentStep = getTimelineIndex(order.status);

              return (
                <div
                  key={order.id}
                  className="rounded-sm border border-border bg-white overflow-hidden transition-colors hover:border-maroon/40 cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  {/* Ivory header row */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border bg-ivory px-5 py-3.5">
                    <span className="font-serif text-[15.5px] font-medium text-espresso">Order #{order.id}</span>
                    <span className="w-[5px] h-[5px] bg-gold rotate-45" />
                    <div className="text-[12.5px] text-muted-foreground">
                      Placed
                      <b className="block font-medium text-espresso text-[13px]">{formatDate(order.created_at)}</b>
                    </div>
                    <div className="text-[12.5px] text-muted-foreground">
                      Total
                      <b className="block font-medium text-espresso text-[13px]">{formatPrice(order.total_amount)}</b>
                    </div>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      <span className={quietChipClasses(payStatusConfig)}>{payStatusConfig.label}</span>
                      <span className={quietChipClasses(paymentInfo)}>
                        <PaymentIcon className="mr-1 h-3 w-3" />
                        {paymentInfo.shortLabel}
                      </span>
                      <span className={statusChipClasses(statusConfig)}>{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* Body row */}
                  <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Thumbs */}
                    {order.items && order.items.length > 0 ? (
                      <div className="flex items-center gap-2.5">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <img
                            key={idx}
                            src={getProductImageUrl(item.product_image || item.product?.images)}
                            alt={item.product_name || ''}
                            className="aspect-[3/4] w-12 rounded-sm border border-border bg-sand object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <span className="flex aspect-[3/4] w-12 items-center justify-center rounded-sm border border-border bg-sand text-xs font-medium text-muted-foreground">
                            +{order.items.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex aspect-[3/4] w-12 items-center justify-center rounded-sm border border-border bg-sand">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-espresso">
                        {order.items && order.items.length === 1
                          ? order.items[0].product_name
                          : `${order.total_items || order.items?.length || 0} item${(order.total_items || order.items?.length || 0) !== 1 ? 's' : ''}`}
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                        {order.items && order.items.length > 1
                          ? order.items.map(i => i.product_name).join(' · ')
                          : order.items && order.items.length === 1
                          ? `Qty: ${order.items[0].quantity} × ${formatPrice(order.items[0].price)}`
                          : 'Order items'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Button
                        className="h-auto rounded-sm bg-maroon px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ivory hover:bg-terracotta"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order.id}`);
                        }}
                      >
                        View Order
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto rounded-sm px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em]"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/account/invoices/${order.id}`);
                        }}
                      >
                        Invoice
                      </Button>
                    </div>
                  </div>

                  {/* Status timeline (not for cancelled orders) */}
                  {!isCancelled && (
                    <div className="border-t border-border px-5 pt-4 pb-4">
                      <div className="flex">
                        {TIMELINE_STEPS.map((step, idx) => {
                          const done = idx < currentStep || (idx === currentStep && isDelivered);
                          const active = idx === currentStep && !isDelivered;
                          return (
                            <div key={step} className="relative flex-1 text-center">
                              {idx > 0 && (
                                <span
                                  className={`absolute top-[6px] left-[-50%] w-full h-0.5 ${
                                    idx <= currentStep ? 'bg-gold' : 'bg-sand'
                                  }`}
                                />
                              )}
                              <span
                                className={`relative z-[1] mx-auto block w-3.5 h-3.5 rounded-full border-2 ${
                                  done
                                    ? 'bg-gold border-gold'
                                    : active
                                    ? 'bg-white border-gold shadow-[0_0_0_4px_rgba(201,154,69,0.18)]'
                                    : 'bg-white border-sand'
                                }`}
                              />
                              <span
                                className={`block mt-1.5 text-[10px] uppercase tracking-[0.12em] ${
                                  idx <= currentStep ? 'text-espresso font-semibold' : 'text-muted-foreground'
                                }`}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Tracking note & address */}
                      {(order.latest_tracking || order.shipping_address) && (
                        <div className="flex flex-col md:flex-row justify-between gap-1.5 mt-3 text-xs text-muted-foreground">
                          {order.latest_tracking && (
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${statusConfig.dotColor}`} />
                              <span className="font-medium text-espresso">{order.latest_tracking.status}</span>
                              {order.latest_tracking.message && (
                                <>
                                  <span>·</span>
                                  <span className="max-w-[200px] truncate">{order.latest_tracking.message}</span>
                                </>
                              )}
                            </div>
                          )}
                          {order.shipping_address && (
                            <div className="flex items-center gap-1.5 md:ml-auto md:text-right">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="max-w-[250px] truncate">{order.shipping_address}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancelled orders: tracking/address hairline row only */}
                  {isCancelled && (order.latest_tracking || order.shipping_address) && (
                    <div className="flex flex-col justify-between gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground md:flex-row md:items-center">
                      {order.latest_tracking && (
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusConfig.dotColor}`} />
                          <span className="font-medium text-espresso">{order.latest_tracking.status}</span>
                          {order.latest_tracking.message && (
                            <>
                              <span>·</span>
                              <span className="max-w-[200px] truncate">{order.latest_tracking.message}</span>
                            </>
                          )}
                        </div>
                      )}
                      {order.shipping_address && (
                        <div className="flex items-center gap-1.5 md:ml-auto md:text-right">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="max-w-[250px] truncate">{order.shipping_address}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default OrdersPage;
