import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  ArrowRight,
  Loader2,
  Search,
  Filter,
  Home,
  ArrowLeft,
  Banknote,
  CreditCard,
  Wallet,
  Shield,
  AlertCircle,
  RefreshCw,
  Calendar,
  Receipt,
  Eye,
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
    cod: { label: 'Cash on Delivery', shortLabel: 'COD', icon: Banknote, color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-200' },
    card: { label: 'Credit/Debit Card', shortLabel: 'Card', icon: CreditCard, color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-200' },
    upi: { label: 'UPI Payment', shortLabel: 'UPI', icon: Wallet, color: 'text-purple-700', bgColor: 'bg-purple-100', borderColor: 'border-purple-200' },
    netbanking: { label: 'Net Banking', shortLabel: 'NetBanking', icon: Shield, color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-200' },
  };
  return map[m] || map['cod'];
};

const getStatusConfig = (status: string) => {
  const s = status.toLowerCase();
  const configs: Record<string, any> = {
    pending: { label: 'Pending', icon: Clock, color: 'text-yellow-700', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-200', dotColor: 'bg-yellow-500' },
    processing: { label: 'Processing', icon: Package, color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-200', dotColor: 'bg-orange-500' },
    shipped: { label: 'Shipped', icon: Truck, color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-200', dotColor: 'bg-blue-500' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-200', dotColor: 'bg-green-500' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-200', dotColor: 'bg-red-500' },
  };
  return configs[s] || configs['pending'];
};

const getPaymentStatusConfig = (status: string) => {
  const s = (status || 'unpaid').toLowerCase();
  const configs: Record<string, any> = {
    paid: { label: 'Paid', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    unpaid: { label: 'Unpaid', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    refunded: { label: 'Refunded', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
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
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#559F4B]" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
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
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="h-16 w-16 text-red-400" />
            <h2 className="text-2xl font-bold text-gray-900">Failed to Load Orders</h2>
            <p className="text-gray-600 text-center max-w-md">{error}</p>
            <div className="flex gap-3">
              <Button onClick={() => window.location.reload()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />Retry
              </Button>
              <Button onClick={() => navigate('/')} className="bg-[#559F4B]">
                <Home className="w-4 h-4 mr-2" />Home
              </Button>
            </div>
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
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">No Orders Yet</h2>
            <p className="text-gray-600 text-center max-w-md">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button onClick={() => navigate('/products')} className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] text-white">
              <ShoppingBag className="w-4 h-4 mr-2" />Start Shopping
            </Button>
          </div>
        </div>
      </UserLayout>
    );
  }

  // ═══════════════════════════════════════════════
  //               MAIN RENDER
  // ═══════════════════════════════════════════════

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#559F4B] to-[#E1783E] bg-clip-text text-transparent">
              My Orders
            </h1>
            <p className="text-gray-600 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
          </div>
          <Button onClick={() => navigate('/products')} variant="outline" className="border-[#559F4B] text-[#559F4B] hover:bg-[#559F4B]/5">
            <ShoppingBag className="w-4 h-4 mr-2" />Continue Shopping
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-[#559F4B]/10 to-[#559F4B]/5 rounded-xl border border-[#559F4B]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#559F4B] rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600">Total Orders</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-[#E1783E]/10 to-[#E1783E]/5 rounded-xl border border-[#E1783E]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E1783E] rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalSpent)}</p>
                <p className="text-xs text-gray-600">Total Spent</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                <p className="text-xs text-gray-600">Delivered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by order ID or product name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[160px]">
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
            <SelectTrigger className="w-full md:w-[160px]">
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
            <SelectTrigger className="w-full md:w-[160px]">
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
            <p className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); setPaymentFilter('all'); setSortBy('newest'); }}
              className="text-[#559F4B]"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">No orders found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const paymentInfo = getPaymentMethodInfo(order.payment_method);
              const PaymentIcon = paymentInfo.icon;
              const payStatusConfig = getPaymentStatusConfig(order.payment_status || 'unpaid');

              return (
                <Card
                  key={order.id}
                  className="border border-gray-200 hover:border-[#559F4B]/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-gray-900">Order #{order.id}</span>
                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} text-xs rounded-full px-3 py-1`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <Badge variant="outline" className={`${payStatusConfig.bgColor} ${payStatusConfig.color} ${payStatusConfig.borderColor} text-xs rounded-full px-2 py-0.5`}>
                          {payStatusConfig.label}
                        </Badge>
                        <Badge variant="outline" className={`${paymentInfo.bgColor} ${paymentInfo.color} ${paymentInfo.borderColor} text-xs rounded-full px-2 py-0.5`}>
                          <PaymentIcon className="w-3 h-3 mr-1" />
                          {paymentInfo.shortLabel}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Items Preview */}
                        <div className="flex-1">
                          {order.items && order.items.length > 0 ? (
                            <div className="space-y-2">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                  <img
                                    src={getProductImageUrl(item.product_image || item.product?.images)}
                                    alt={item.product_name || ''}
                                    className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {item.product_name || `Product #${item.product_id}`}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs text-gray-500">
                                        Qty: {item.quantity} × {formatPrice(item.price)}
                                      </p>
                                      
                                      {/* ✅ HSN Code display */}
                                      {item.hsn_code && (
                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border border-gray-200">
                                          HSN: {item.hsn_code}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <p className="text-xs text-gray-500 pl-13">
                                  +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {order.total_items || 0} item{(order.total_items || 0) !== 1 ? 's' : ''}
                                </p>
                                <p className="text-xs text-gray-500">Order items</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Price & Action */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-xl font-bold text-gray-900">{formatPrice(order.total_amount)}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#559F4B] text-[#559F4B] hover:bg-[#559F4B]/5"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/${order.id}`);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>

                      {/* ✅ Shipping Address & Tracking Row */}
                      {(order.latest_tracking || order.shipping_address) && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
                          
                          {/* Tracking */}
                          {order.latest_tracking && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`} />
                              <span className="font-medium">{order.latest_tracking.status}</span>
                              {order.latest_tracking.message && (
                                <>
                                  <span>·</span>
                                  <span className="truncate max-w-[200px]">{order.latest_tracking.message}</span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Shipping Address (Truncated) */}
                          {order.shipping_address && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 md:text-right md:ml-auto">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-[250px]">{order.shipping_address}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default OrdersPage;