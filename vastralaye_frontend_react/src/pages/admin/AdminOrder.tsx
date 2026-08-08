import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  ShoppingBag,
  Calendar,
  Clock,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  User,
  Package,
  Filter,
  Eye,
  Download,
  Mail,
  Phone,
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  Trash2,
  Loader2,
  Pencil,
  CreditCard,
  RotateCcw,
  BanknoteIcon,
  Wallet,
  MapPin,
  Globe,
  Image as ImageIcon,
  Printer,
} from "lucide-react";
import { BASE_URL } from "@/config";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

/* ================= IMAGE BASE URL ================= */

const IMAGE_BASE_URL = "https://api.mizorpaymart.com";

/* ================= TYPES ================= */

// Internal View Model (Normalized Data)
interface OrderItemType {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  total: number;
  product_name: string;
  product_image: string | null;
  hsn_code: string | null;
  sku: string | null;
}

interface OrderType {
  id: number;
  user_id: number;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  total_amount?: number;
  shipping_address?: string;
  created_at?: string;
  updated_at?: string;
}

interface OrderDataType {
  order: OrderType;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItemType[];
  items_count: number;
  subtotal: number;
  gst_18_percent: number;
  total_with_gst: number;
}

interface OrdersResponse {
  gstin: string;
  gst_rate: string;
  data: any[]; // Raw data from API
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/* ================= STATUS OPTIONS ================= */

const ORDER_STATUS_OPTIONS = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const PAYMENT_STATUS_OPTIONS = ["paid", "unpaid"];

/* ================= API HELPERS ================= */

const getAuthToken = () => localStorage.getItem("token") || "";

const deleteOrder = async (orderId: number): Promise<string> => {
  const res = await fetch(`${BASE_URL}/admin/orders/${orderId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(
      err?.detail || err?.detail?.[0]?.msg || `Failed to delete order #${orderId}`
    );
  }
  return await res.json();
};

const updateOrderStatus = async (orderId: number, status: string): Promise<string> => {
  const params = new URLSearchParams({ status }).toString();
  const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/status?${params}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(
      err?.detail || err?.detail?.[0]?.msg || `Failed to update order #${orderId} status`
    );
  }
  return await res.json();
};

const updatePaymentStatus = async (
  orderId: number,
  paymentStatus: string
): Promise<string> => {
  const params = new URLSearchParams({ payment_status: paymentStatus }).toString();
  const res = await fetch(
    `${BASE_URL}/admin/orders/${orderId}/payment-status?${params}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(
      err?.detail ||
        err?.detail?.[0]?.msg ||
        `Failed to update payment status for order #${orderId}`
    );
  }
  return await res.json();
};

/* ================= STATUS CHIP (admin_design.md §3.4) ================= */

const StatusChip = ({ tint, label }: { tint: string; label: string }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap ${tint}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {label}
  </span>
);

/* ================= ✅ SAFE DATA NORMALIZER (THE FIX) ================= */

const safeOrderData = (raw: any): OrderDataType => {
  // 1. Extract Order
  const orderObj = raw?.order || {};
  const userObj = orderObj?.user || {};

  // 2. Extract Customer Name (Fallback to First/Last or Unknown)
  const firstName = userObj?.first_name || "";
  const lastName = userObj?.last_name || "";
  const fullName = (firstName + " " + lastName).trim() || "Unknown Customer";

  // 3. Extract Items (Nested in order.items)
  const rawItems = Array.isArray(orderObj?.items) ? orderObj.items : [];

  const normalizedItems: OrderItemType[] = rawItems.map((item: any) => {
    const product = item?.product || {};
    
    // Handle images: check _images OR images, split by comma, take first
    const imageString = product?._images || product?.images || "";
    const firstImage = imageString.split(",")[0]?.trim() || null;

    return {
      id: item?.id ?? 0,
      product_id: item?.product_id ?? 0,
      quantity: Number(item?.quantity) || 0,
      price: Number(item?.price) || 0,
      // Calculate total for item line
      total: (Number(item?.price) || 0) * (Number(item?.quantity) || 1), 
      product_name: product?.name || "Unknown Product",
      product_image: firstImage,
      hsn_code: product?.hsn_code || null,
      sku: product?.sku || null,
    };
  });

  // 4. Return Normalized Object
  return {
    order: {
      id: orderObj?.id ?? 0,
      user_id: orderObj?.user_id ?? 0,
      status: orderObj?.status || "pending",
      payment_status: orderObj?.payment_status || "unpaid",
      payment_method: orderObj?.payment_method || "",
      total_amount: Number(orderObj?.total_amount) || 0,
      shipping_address: orderObj?.shipping_address || "",
      created_at: orderObj?.created_at || new Date().toISOString(),
      updated_at: orderObj?.updated_at || new Date().toISOString(),
    },
    customer_name: fullName,
    customer_email: userObj?.email || "",
    customer_phone: userObj?.phone || "",
    items: normalizedItems,
    items_count: normalizedItems.length,
    subtotal: Number(raw?.subtotal) || 0,
    gst_18_percent: Number(raw?.gst_18_percent) || 0,
    total_with_gst: Number(raw?.total_with_gst) || 0,
  };
};

/* ================= COMPONENT ================= */

export default function AdminOrders() {
  const [ordersData, setOrdersData] = useState<OrderDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [gstin, setGstin] = useState("");
  const [gstRate, setGstRate] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [selectedOrderData, setSelectedOrderData] = useState<OrderDataType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<OrderDataType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editStatusDialogOpen, setEditStatusDialogOpen] = useState(false);
  const [orderToEditStatus, setOrderToEditStatus] = useState<OrderDataType | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState("");
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);

  const [editPaymentDialogOpen, setEditPaymentDialogOpen] = useState(false);
  const [orderToEditPayment, setOrderToEditPayment] = useState<OrderDataType | null>(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [isUpdatingPaymentStatus, setIsUpdatingPaymentStatus] = useState(false);

  /* ================= FETCH ================= */

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });

      if (search.trim()) {
        if (!isNaN(Number(search))) {
          params.append("order_id", search.trim());
        } else {
          params.append("search", search.trim());
        }
      }

      if (status !== "all") {
        params.append("status", status);
      }

      const res = await fetch(`${BASE_URL}/admin/admin_orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      if (!res.ok) throw new Error("Failed to fetch orders");

      const json: OrdersResponse = await res.json();

      console.log("Orders API raw response:", json);

      setGstin(json.gstin || "");
      setGstRate(json.gst_rate || "");

      // ✅ Map raw API data through the normalizer
      const rawData = Array.isArray(json?.data) ? json.data : [];
      const normalizedData = rawData.map(safeOrderData);

      console.log("Normalized orders:", normalizedData);

      setOrdersData(normalizedData);
      setTotal(Number.isFinite(json?.total) ? json.total : 0);
      setTotalPages(json.total_pages || Math.max(1, Math.ceil((json.total || 0) / pageSize)));
    } catch (err: any) {
      console.error("Fetch orders error:", err);
      setError(err.message || "Failed to load orders");
      setOrdersData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const openDeleteDialog = (orderData: OrderDataType) => {
    setOrderToDelete(orderData);
    setDeleteDialogOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    const orderId = orderToDelete.order.id;
    try {
      setIsDeleting(true);
      await deleteOrder(orderId);
      toast.success(`Order #${orderId} deleted successfully`);
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      if (selectedOrderData?.order?.id === orderId) {
        setIsDialogOpen(false);
        setSelectedOrderData(null);
      }
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete order");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ================= EDIT ORDER STATUS ================= */

  const openEditStatusDialog = (orderData: OrderDataType) => {
    setOrderToEditStatus(orderData);
    setNewOrderStatus(orderData?.order?.status || "pending");
    setEditStatusDialogOpen(true);
  };

  const handleOrderStatusUpdate = async () => {
    if (!orderToEditStatus || !newOrderStatus) return;
    const orderId = orderToEditStatus.order.id;
    try {
      setIsUpdatingOrderStatus(true);
      await updateOrderStatus(orderId, newOrderStatus);
      toast.success(`Order #${orderId} status updated to ${newOrderStatus.toUpperCase()}`);

      setOrdersData((prev) =>
        prev.map((od) =>
          od.order.id === orderId
            ? { ...od, order: { ...od.order, status: newOrderStatus } }
            : od
        )
      );

      if (selectedOrderData?.order?.id === orderId) {
        setSelectedOrderData((prev) =>
          prev ? { ...prev, order: { ...prev.order, status: newOrderStatus } } : null
        );
      }

      setEditStatusDialogOpen(false);
      setOrderToEditStatus(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update order status");
    } finally {
      setIsUpdatingOrderStatus(false);
    }
  };

  /* ================= EDIT PAYMENT STATUS ================= */

  const openEditPaymentDialog = (orderData: OrderDataType) => {
    setOrderToEditPayment(orderData);
    setNewPaymentStatus(orderData?.order?.payment_status || "unpaid");
    setEditPaymentDialogOpen(true);
  };

  const handlePaymentStatusUpdate = async () => {
    if (!orderToEditPayment || !newPaymentStatus) return;
    const orderId = orderToEditPayment.order.id;
    try {
      setIsUpdatingPaymentStatus(true);
      await updatePaymentStatus(orderId, newPaymentStatus);
      toast.success(`Order #${orderId} payment updated to ${newPaymentStatus.toUpperCase()}`);

      setOrdersData((prev) =>
        prev.map((od) =>
          od.order.id === orderId
            ? { ...od, order: { ...od.order, payment_status: newPaymentStatus } }
            : od
        )
      );

      if (selectedOrderData?.order?.id === orderId) {
        setSelectedOrderData((prev) =>
          prev
            ? { ...prev, order: { ...prev.order, payment_status: newPaymentStatus } }
            : null
        );
      }

      setEditPaymentDialogOpen(false);
      setOrderToEditPayment(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment status");
    } finally {
      setIsUpdatingPaymentStatus(false);
    }
  };

  /* ================= EFFECTS ================= */

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize]);

  useEffect(() => {
    setPage(1);
    const t = setTimeout(fetchOrders, 500);
    return () => clearTimeout(t);
  }, [search, status]);

  /* ================= HELPERS ================= */

  const formatCurrency = (n: number | string | undefined | null) => {
    const num = Number(n) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (d?: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const formatTime = (d?: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "—";
    }
  };

  const getInitials = (name?: string) => {
    if (!name || name === "Unknown User") return "??";
    const parts = name.trim().split(" ");
    return (
      `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase() || "??"
    );
  };

  const getProductImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${IMAGE_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  const getPaymentMethodLabel = (method?: string) => {
    const labels: Record<string, string> = {
      cod: "Cash on Delivery",
      online: "Online Payment",
      upi: "UPI",
      card: "Card Payment",
      netbanking: "Net Banking",
    };
    return labels[method || ""] || method || "—";
  };

  const getOrderStatusColor = (s?: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-700",
      processing: "bg-[#5C6B8A]/10 text-[#5C6B8A]",
      shipped: "bg-[#5C6B8A]/10 text-[#5C6B8A]",
      delivered: "bg-green-700/10 text-green-800",
      cancelled: "bg-sale/10 text-sale",
      refunded: "bg-espresso/5 text-muted-foreground",
    };
    return colors[s || ""] || colors.pending;
  };

  const getOrderStatusIcon = (s?: string) => {
    const icons: Record<string, any> = {
      pending: AlertCircle,
      processing: Package,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: XCircle,
      refunded: RotateCcw,
    };
    const Icon = icons[s || ""] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  const getPaymentStatusColor = (s?: string) => {
    const colors: Record<string, string> = {
      paid: "bg-green-700/10 text-green-800",
      unpaid: "bg-amber-500/10 text-amber-700",
    };
    return colors[s || ""] || colors.unpaid;
  };

  const getPaymentStatusIcon = (s?: string) => {
    const icons: Record<string, any> = {
      paid: BanknoteIcon,
      unpaid: CreditCard,
    };
    const Icon = icons[s || ""] || CreditCard;
    return <Icon className="h-4 w-4" />;
  };

  const totalRevenue = ordersData.reduce((sum, od) => sum + (od?.order?.total_amount || 0), 0);
  const pendingOrders = ordersData.filter((od) => od?.order?.status === "pending").length;
  const deliveredOrders = ordersData.filter((od) => od?.order?.status === "delivered").length;
  const unpaidOrders = ordersData.filter((od) => od?.order?.payment_status === "unpaid").length;

  /* ================= PRINT ORDER / PDF ================= */

  const printOrderInvoice = (orderData: OrderDataType) => {
    if (!orderData?.order) {
      toast.error("Invalid order data");
      return;
    }

    const { 
      order, 
      customer_name = "Unknown", 
      customer_email = "", 
      customer_phone = "", 
      items = [], 
      subtotal = 0, 
      gst_18_percent = 0, 
      total_with_gst = 0 
    } = orderData;

    const safeItems = Array.isArray(items) ? items : [];
    const address = order.shipping_address || "—";
    const orderDate = formatDate(order.created_at);
    const orderTime = formatTime(order.created_at);
    const paymentMethod = getPaymentMethodLabel(order.payment_method);
    const orderStatus = (order.status || "pending").toUpperCase();
    const paymentStatus = (order.payment_status || "unpaid").toUpperCase();

    const itemsRows = safeItems
      .map(
        (item, idx) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">${idx + 1}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${
                item.product_image
                  ? `<img src="${getProductImageUrl(item.product_image)}" alt="${item.product_name}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid #e5e7eb;" />`
                  : `<div style="width: 48px; height: 48px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px;">IMG</div>`
              }
              <div>
                <div style="font-weight: 600; color: #111827; font-size: 14px;">${item.product_name}</div>
                <div style="color: #6b7280; font-size: 12px; margin-top: 2px;">
                  ${item.hsn_code ? `HSN: <strong>${item.hsn_code}</strong>` : ""}
                  ${item.hsn_code && item.sku ? " | " : ""}
                  ${item.sku ? `SKU: ${item.sku}` : ""}
                </div>
              </div>
            </div>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151; font-size: 14px;">${item.quantity || 0}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 14px;">₹${(item.price || 0).toLocaleString("en-IN")}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #111827; font-size: 14px;">₹${(item.total || 0).toLocaleString("en-IN")}</td>
        </tr>
      `
      )
      .join("");

    const invoiceHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Invoice - Order #${order.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print { .no-print { display: none !important; } }
        .invoice-container { max-width: 800px; margin: 0 auto; padding: 40px; }
        .print-btn-container { text-align: center; padding: 20px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
        .print-btn { background: #7A1F2B; color: white; border: none; padding: 12px 32px; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer; margin: 0 8px; }
        .close-btn { background: #6E5F53; color: white; border: none; padding: 12px 32px; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer; margin: 0 8px; }
      </style>
    </head>
    <body>
      <div class="print-btn-container no-print">
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        <button class="close-btn" onclick="window.close()">✕ Close</button>
      </div>

      <div class="invoice-container">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #7A1F2B;">
          <div>
            <h1 style="font-size: 32px; font-weight: 800; color: #7A1F2B; margin-bottom: 4px;">INVOICE</h1>
            <img src="/logo.png" alt="MizorPayMart Logo" style="width: 120px; height: auto; object-fit: contain;">
            <p style="color: #9ca3af; font-size: 12px; margin-top: 4px;">GSTIN: ${gstin}</p>
          </div>
          <div style="text-align: right;">
            <div style="background: #7A1F2B; color: white; padding: 12px 24px; border-radius: 6px; display: inline-block;">
              <p style="font-size: 12px; opacity: 0.9; margin-bottom: 2px;">ORDER NO.</p>
              <p style="font-size: 24px; font-weight: 800;">#${order.id}</p>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 16px; margin-bottom: 32px;">
          <div style="flex: 1; background: #FBF8F3; padding: 16px 20px; border-radius: 6px; border: 1px solid #E7DFD3;">
            <p style="font-size: 11px; font-weight: 700; color: #7A1F2B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Order Date</p>
            <p style="font-weight: 700; color: #2B1B12; font-size: 15px;">${orderDate}</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 2px;">${orderTime}</p>
          </div>
          <div style="flex: 1; background: ${orderStatus === "DELIVERED" ? "#f0fdf4" : orderStatus === "CANCELLED" ? "#fef2f2" : "#fffbeb"}; padding: 16px 20px; border-radius: 12px; border: 1px solid ${orderStatus === "DELIVERED" ? "#bbf7d0" : orderStatus === "CANCELLED" ? "#fecaca" : "#fde68a"};">
            <p style="font-size: 11px; font-weight: 700; color: ${orderStatus === "DELIVERED" ? "#16a34a" : orderStatus === "CANCELLED" ? "#dc2626" : "#d97706"}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Order Status</p>
            <p style="font-weight: 800; color: ${orderStatus === "DELIVERED" ? "#15803d" : orderStatus === "CANCELLED" ? "#b91c1c" : "#92400e"}; font-size: 15px;">${orderStatus}</p>
          </div>
          <div style="flex: 1; background: ${paymentStatus === "PAID" ? "#f0fdf4" : "#fff7ed"}; padding: 16px 20px; border-radius: 12px; border: 1px solid ${paymentStatus === "PAID" ? "#bbf7d0" : "#fed7aa"};">
            <p style="font-size: 11px; font-weight: 700; color: ${paymentStatus === "PAID" ? "#16a34a" : "#ea580c"}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Payment</p>
            <p style="font-weight: 800; color: ${paymentStatus === "PAID" ? "#15803d" : "#c2410c"}; font-size: 15px;">${paymentStatus}</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 2px;">${paymentMethod}</p>
          </div>
        </div>

        <div style="display: flex; gap: 24px; margin-bottom: 32px;">
          <div style="flex: 1; background: #FBF8F3; padding: 20px; border-radius: 6px; border: 1px solid #E7DFD3;">
            <h3 style="font-size: 13px; font-weight: 700; color: #7A1F2B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #E7DFD3;">📋 Bill To</h3>
            <p style="font-weight: 700; color: #111827; font-size: 16px; margin-bottom: 8px;">${customer_name}</p>
            ${customer_email ? `<p style="color: #4b5563; font-size: 13px; margin-bottom: 4px;">📧 ${customer_email}</p>` : ""}
            ${customer_phone ? `<p style="color: #4b5563; font-size: 13px; margin-bottom: 4px;">📱 ${customer_phone}</p>` : ""}
          </div>
          <div style="flex: 1; background: #FBF8F3; padding: 20px; border-radius: 6px; border: 1px solid #E7DFD3;">
            <h3 style="font-size: 13px; font-weight: 700; color: #7A1F2B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #E7DFD3;">📍 Ship To</h3>
            <p style="font-weight: 600; color: #111827; font-size: 14px; line-height: 1.6;">${address}</p>
          </div>
        </div>

        <div style="margin-bottom: 32px;">
          <h3 style="font-size: 13px; font-weight: 700; color: #7A1F2B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">📦 Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; border-radius: 6px; overflow: hidden; border: 1px solid #E7DFD3;">
            <thead>
              <tr style="background: #2B1B12;">
                <th style="padding: 14px 16px; text-align: center; color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; width: 50px;">#</th>
                <th style="padding: 14px 16px; text-align: left; color: white; font-size: 12px; font-weight: 700; text-transform: uppercase;">Product</th>
                <th style="padding: 14px 16px; text-align: center; color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; width: 80px;">Qty</th>
                <th style="padding: 14px 16px; text-align: right; color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; width: 120px;">Price</th>
                <th style="padding: 14px 16px; text-align: right; color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; width: 120px;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsRows}</tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
          <div style="width: 320px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Subtotal</span>
              <span style="font-weight: 600; color: #374151; font-size: 14px;">₹${subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">GST (${gstRate || "18%"})</span>
              <span style="font-weight: 600; color: #374151; font-size: 14px;">₹${gst_18_percent.toLocaleString("en-IN")}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Shipping</span>
              <span style="font-weight: 600; color: #16a34a; font-size: 14px;">FREE</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 16px 20px; margin-top: 8px; background: #7A1F2B; border-radius: 6px;">
              <span style="color: white; font-size: 16px; font-weight: 700;">Grand Total</span>
              <span style="color: white; font-size: 20px; font-weight: 800;">₹${total_with_gst.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; padding-top: 24px; border-top: 2px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 13px; margin-bottom: 4px;">Thank you for your order!</p>
          <p style="color: #9ca3af; font-size: 12px;">Contact us at support@mizorpaymart.com</p>
          ${gstin ? `<p style="color: #9ca3af; font-size: 11px; margin-top: 8px;">GSTIN: ${gstin}</p>` : ""}
          <p style="color: #d1d5db; font-size: 11px; margin-top: 12px;">Generated on ${new Date().toLocaleString("en-IN")} • MizorPay Mart</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
    } else {
      toast.error("Please allow pop-ups to print the invoice");
    }
  };

  /* ================= SKELETON ================= */

  const SkeletonLoader = () => (
    <div className="bg-white border border-border rounded-md overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-3 border-b border-border last:border-b-0">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );

  /* ================= RENDER ================= */

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl md:text-2xl font-medium text-espresso">
              Orders
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Track and manage all customer orders
              {gstin && (
                <span className="ml-2 text-xs">• GSTIN: {gstin}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchOrders} className="gap-2 uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button className="gap-2 bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm hover:bg-terracotta">
              <Download className="h-4 w-4" /> Export Data
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-border rounded-md p-5">
            <div className="w-9 h-9 rounded-md bg-maroon/10 text-maroon flex items-center justify-center mb-3">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">Total Orders</p>
            <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">{total}</p>
          </div>

          <div className="bg-white border border-border rounded-md p-5">
            <div className="w-9 h-9 rounded-md bg-green-700/10 text-green-800 flex items-center justify-center mb-3">
              <IndianRupee className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">Page Revenue</p>
            <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">{formatCurrency(totalRevenue).replace("₹", "₹ ")}</p>
          </div>

          <div className="bg-white border border-border rounded-md p-5">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-700 flex items-center justify-center mb-3">
              <Clock className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">Pending Orders</p>
            <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">{pendingOrders}</p>
          </div>

          <div className="bg-white border border-border rounded-md p-5">
            <div className="w-9 h-9 rounded-md bg-[#5C6B8A]/10 text-[#5C6B8A] flex items-center justify-center mb-3">
              <CreditCard className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">Unpaid Orders</p>
            <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">{unpaidOrders}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Search by order ID, customer name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px] h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Order status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {ORDER_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      {getOrderStatusIcon(s)}
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Show 10</SelectItem>
                <SelectItem value="25">Show 25</SelectItem>
                <SelectItem value="50">Show 50</SelectItem>
                <SelectItem value="100">Show 100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ===================== ORDERS LIST ===================== */}
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="bg-white border border-border rounded-md p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sale/10 mb-6">
              <XCircle className="h-8 w-8 text-sale" />
            </div>
            <h3 className="font-serif text-xl font-medium text-espresso mb-2">Error Loading Orders</h3>
            <p className="text-[13px] text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
            <Button onClick={fetchOrders} className="bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm hover:bg-terracotta">Try Again</Button>
          </div>
        ) : ordersData.length === 0 ? (
          <div className="bg-white border border-border rounded-md p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-espresso/5 mb-6">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-xl font-medium text-espresso mb-2">No Orders Found</h3>
            <p className="text-[13px] text-muted-foreground mb-6 max-w-md mx-auto">
              {search || status !== "all" ? "No orders match your filters." : "When customers place orders, they will appear here."}
            </p>
            {(search || status !== "all") && (
              <Button onClick={() => { setSearch(""); setStatus("all"); }} className="bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] px-5 py-2.5 rounded-sm hover:bg-terracotta">Clear All Filters</Button>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white border border-border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap">Order</th>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap">Customer</th>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap">Date</th>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap text-right">Items</th>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap text-right">Total</th>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap">Payment</th>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap">Status</th>
                      <th className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold bg-[#FBF8F3] border-b border-border px-3 py-2.5 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr:last-child>td]:border-b-0">
                    {ordersData.map((od) => {
                      const { order, customer_name, customer_email, items_count, total_with_gst } = od;

                      return (
                        <tr key={order.id} className="hover:bg-[#FBF8F3] transition-colors">
                          <td className="px-3 py-3 border-b border-border text-[13px] font-semibold text-espresso whitespace-nowrap">
                            #{order.id}
                          </td>
                          <td className="px-3 py-3 border-b border-border text-[13px]">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full bg-espresso/10 text-espresso text-[11px] font-semibold flex items-center justify-center flex-none">
                                {getInitials(customer_name)}
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium text-espresso truncate max-w-[180px]">{customer_name}</p>
                                <p className="text-[11.5px] text-muted-foreground truncate max-w-[180px]">{customer_email || "No email"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 border-b border-border text-[13px] whitespace-nowrap">
                            {formatDate(order.created_at)}
                            <span className="block text-[11.5px] text-muted-foreground">{formatTime(order.created_at)}</span>
                          </td>
                          <td className="px-3 py-3 border-b border-border text-[13px] text-right">{items_count}</td>
                          <td className="px-3 py-3 border-b border-border text-[13px] text-right font-semibold text-espresso whitespace-nowrap">
                            {formatCurrency(total_with_gst)}
                            <span className="block text-[11px] font-normal text-muted-foreground">incl. GST</span>
                          </td>
                          <td className="px-3 py-3 border-b border-border text-[13px] whitespace-nowrap">
                            <StatusChip
                              tint={getPaymentStatusColor(order.payment_status)}
                              label={(order.payment_status || "unpaid").charAt(0).toUpperCase() + (order.payment_status || "unpaid").slice(1)}
                            />
                            {order.payment_method && (
                              <span className="block text-[11px] text-muted-foreground mt-1">{getPaymentMethodLabel(order.payment_method)}</span>
                            )}
                          </td>
                          <td className="px-3 py-3 border-b border-border text-[13px] whitespace-nowrap">
                            <StatusChip
                              tint={getOrderStatusColor(order.status)}
                              label={(order.status || "pending").charAt(0).toUpperCase() + (order.status || "pending").slice(1)}
                            />
                          </td>
                          <td className="px-3 py-3 border-b border-border text-[13px]">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                title="View details"
                                className="w-7 h-7 border border-border rounded-[5px] inline-flex items-center justify-center text-muted-foreground bg-white hover:text-espresso hover:border-espresso transition-colors"
                                onClick={() => { setSelectedOrderData(od); setIsDialogOpen(true); }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                title="Print invoice"
                                className="w-7 h-7 border border-border rounded-[5px] inline-flex items-center justify-center text-muted-foreground bg-white hover:text-espresso hover:border-espresso transition-colors"
                                onClick={() => printOrderInvoice(od)}
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                              <button
                                title="Update order status"
                                className="w-7 h-7 border border-border rounded-[5px] inline-flex items-center justify-center text-muted-foreground bg-white hover:text-espresso hover:border-espresso transition-colors"
                                onClick={() => openEditStatusDialog(od)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                title="Update payment status"
                                className="w-7 h-7 border border-border rounded-[5px] inline-flex items-center justify-center text-muted-foreground bg-white hover:text-espresso hover:border-espresso transition-colors"
                                onClick={() => openEditPaymentDialog(od)}
                              >
                                <Wallet className="h-3.5 w-3.5" />
                              </button>
                              <button
                                title="Delete order"
                                className="w-7 h-7 border border-sale/35 rounded-[5px] inline-flex items-center justify-center text-sale bg-white hover:bg-sale/5 transition-colors"
                                onClick={() => openDeleteDialog(od)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <p className="text-[12.5px] text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-espresso">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}</span>
                  {" "}of <span className="font-semibold text-espresso">{total}</span> orders
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)} className="gap-2 h-8 px-3 text-[12.5px] rounded-[5px] border-border text-espresso hover:bg-[#FBF8F3] hover:text-espresso">
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
                      return (
                        <Button key={pageNum} variant={page === pageNum ? "default" : "outline"}
                          className={`w-8 h-8 p-0 text-[12.5px] rounded-[5px] ${page === pageNum ? "bg-maroon text-ivory hover:bg-terracotta" : "border-border text-espresso hover:bg-[#FBF8F3] hover:text-espresso"}`}
                          onClick={() => setPage(pageNum)}>
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="gap-2 h-8 px-3 text-[12.5px] rounded-[5px] border-border text-espresso hover:bg-[#FBF8F3] hover:text-espresso">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ===================== VIEW DETAILS DIALOG ===================== */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 font-serif text-xl font-medium text-espresso">
                <div className="p-2 bg-maroon/10 rounded-md"><FileText className="h-5 w-5 text-maroon" /></div>
                Order Details
              </DialogTitle>
            </DialogHeader>

            {selectedOrderData && (() => {
              const { order, customer_name, customer_email, customer_phone, items, items_count, subtotal, gst_18_percent, total_with_gst } = selectedOrderData;

              return (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 bg-[#FBF8F3] border border-border rounded-md">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-maroon text-ivory font-semibold">
                          {getInitials(customer_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-espresso text-[13px]">Order #{order.id}</h3>
                        <p className="text-[13px] text-muted-foreground">{customer_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <StatusChip
                        tint={getOrderStatusColor(order.status)}
                        label={(order.status || "pending").toUpperCase()}
                      />
                      <StatusChip
                        tint={getPaymentStatusColor(order.payment_status)}
                        label={(order.payment_status || "unpaid").toUpperCase()}
                      />
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white border border-border rounded-md">
                      <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">Order ID</p>
                      <p className="font-serif font-medium text-espresso text-lg">#{order.id}</p>
                    </div>
                    <div className="p-4 bg-white border border-border rounded-md">
                      <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">Subtotal</p>
                      <p className="font-serif font-medium text-espresso text-lg">{formatCurrency(subtotal)}</p>
                    </div>
                    <div className="p-4 bg-white border border-border rounded-md">
                      <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">GST ({gstRate || "18%"})</p>
                      <p className="font-serif font-medium text-espresso text-lg">{formatCurrency(gst_18_percent)}</p>
                    </div>
                    <div className="p-4 bg-green-700/10 rounded-md">
                      <p className="text-[10.5px] font-semibold text-green-800 uppercase tracking-[0.14em] mb-2">Total with GST</p>
                      <p className="font-serif font-medium text-green-800 text-xl">{formatCurrency(total_with_gst)}</p>
                    </div>
                    <div className="p-4 bg-white border border-border rounded-md">
                      <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">Payment Method</p>
                      <p className="font-semibold text-espresso text-[13px]">{getPaymentMethodLabel(order.payment_method)}</p>
                    </div>
                    <div className="p-4 bg-white border border-border rounded-md">
                      <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2">Order Date</p>
                      <p className="font-semibold text-espresso text-[13px]">{formatDate(order.created_at)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTime(order.created_at)}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="p-4 bg-[#FBF8F3] rounded-md border border-border">
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-maroon" /> Customer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-espresso">{customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-espresso">{customer_email || "—"}</span>
                      </div>
                      {customer_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-espresso">{customer_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shipping_address && (
                    <div className="p-4 bg-[#FBF8F3] rounded-md border border-border">
                      <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-maroon" /> Shipping Address
                      </h4>
                      <p className="text-[13px] font-medium text-espresso">{order.shipping_address}</p>
                    </div>
                  )}

                  {/* GSTIN Info */}
                  {gstin && (
                    <div className="p-3 bg-[#FBF8F3] rounded-md border border-border flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[13px] text-muted-foreground">GSTIN: <span className="font-semibold text-espresso">{gstin}</span></span>
                      <span className="text-[13px] text-muted-foreground ml-2">• GST Rate: <span className="font-semibold text-espresso">{gstRate}</span></span>
                    </div>
                  )}

                  {/* Order Items */}
                  {items.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4 text-maroon" /> Order Items ({items_count})
                      </h4>
                      <div className="space-y-3">
                        {items.map((item) => {
                          const imgUrl = getProductImageUrl(item.product_image);
                          return (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-md border border-border">
                              <div className="flex items-center gap-4">
                                <div className="w-[38px] h-[46px] rounded overflow-hidden bg-[#FBF8F3] border border-border flex-shrink-0">
                                  {imgUrl ? (
                                    <img src={imgUrl} alt={item.product_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#FBF8F3]">
                                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-espresso text-[13px]">{item.product_name}</p>
                                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                    <p className="text-xs text-muted-foreground">@ {formatCurrency(item.price)} each</p>

                                    {/* ✅ HSN Code Badge */}
                                    {item.hsn_code && (
                                      <Badge variant="outline" className="text-[10.5px] rounded-sm border-border text-muted-foreground bg-[#FBF8F3]">
                                        HSN: {item.hsn_code}
                                      </Badge>
                                    )}

                                    {item.sku && (
                                      <Badge variant="outline" className="text-[10.5px] rounded-sm border-border text-muted-foreground">
                                        SKU: {item.sku}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="font-semibold text-espresso text-[13px]">{formatCurrency(item.total)}</p>
                            </div>
                          );
                        })}

                        {/* Totals Summary */}
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center justify-between p-3 bg-[#FBF8F3] border border-border rounded-md">
                            <p className="text-[13px] text-muted-foreground">Subtotal</p>
                            <p className="font-semibold text-espresso text-[13px]">{formatCurrency(subtotal)}</p>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-[#FBF8F3] border border-border rounded-md">
                            <p className="text-[13px] text-muted-foreground">GST ({gstRate || "18%"})</p>
                            <p className="font-semibold text-espresso text-[13px]">{formatCurrency(gst_18_percent)}</p>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-green-700/10 rounded-md">
                            <p className="font-semibold text-espresso text-[13px]">Total with GST</p>
                            <p className="font-serif font-medium text-green-800 text-xl">{formatCurrency(total_with_gst)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dialog Actions */}
                  <div className="flex flex-wrap justify-between gap-3 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5 text-[12px]"
                        onClick={() => printOrderInvoice(selectedOrderData)}>
                        <Printer className="h-4 w-4" /> Print Invoice
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 text-[12px]"
                        onClick={() => { setIsDialogOpen(false); openEditStatusDialog(selectedOrderData); }}>
                        <Pencil className="h-4 w-4" /> Order Status
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 text-[12px]"
                        onClick={() => { setIsDialogOpen(false); openEditPaymentDialog(selectedOrderData); }}>
                        <Wallet className="h-4 w-4" /> Payment
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 text-[12px] border-sale text-sale hover:bg-sale hover:text-ivory"
                        onClick={() => { setIsDialogOpen(false); openDeleteDialog(selectedOrderData); }}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* ===================== EDIT ORDER STATUS DIALOG ===================== */}
        <Dialog open={editStatusDialogOpen} onOpenChange={setEditStatusDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 font-serif text-xl font-medium text-espresso">
                <div className="p-2 bg-maroon/10 rounded-md"><Pencil className="h-5 w-5 text-maroon" /></div>
                Update Order Status
              </DialogTitle>
              <DialogDescription className="pt-3 text-muted-foreground">
                Change status for <span className="font-semibold text-espresso">Order #{orderToEditStatus?.order.id}</span>
              </DialogDescription>
            </DialogHeader>
            {orderToEditStatus && (
              <div className="space-y-5">
                <div className="p-4 bg-[#FBF8F3] rounded-md border border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-maroon text-ivory font-semibold text-sm">
                        {getInitials(orderToEditStatus.customer_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-espresso text-sm">Order #{orderToEditStatus.order.id}</p>
                      <p className="text-xs text-muted-foreground">{orderToEditStatus.customer_name} • {formatCurrency(orderToEditStatus.total_with_gst)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-medium text-muted-foreground w-28">Current:</span>
                  <StatusChip
                    tint={getOrderStatusColor(orderToEditStatus.order.status)}
                    label={(orderToEditStatus.order.status || "pending").toUpperCase()}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2 block">New Order Status</label>
                  <Select value={newOrderStatus} onValueChange={setNewOrderStatus}>
                    <SelectTrigger className="w-full h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0"><SelectValue placeholder="Select new status" /></SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">{getOrderStatusIcon(s)} {s.charAt(0).toUpperCase() + s.slice(1)}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newOrderStatus !== (orderToEditStatus.order.status || "pending") && (
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-medium text-muted-foreground w-28">New:</span>
                    <StatusChip
                      tint={getOrderStatusColor(newOrderStatus)}
                      label={newOrderStatus.toUpperCase()}
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" onClick={() => { setEditStatusDialogOpen(false); setOrderToEditStatus(null); }} disabled={isUpdatingOrderStatus}>Cancel</Button>
              <Button onClick={handleOrderStatusUpdate} disabled={isUpdatingOrderStatus || newOrderStatus === (orderToEditStatus?.order.status || "pending")} className="gap-2 bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] rounded-sm hover:bg-terracotta">
                {isUpdatingOrderStatus ? (<><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>) : (<><CheckCircle className="h-4 w-4" /> Update Status</>)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===================== EDIT PAYMENT STATUS DIALOG ===================== */}
        <Dialog open={editPaymentDialogOpen} onOpenChange={setEditPaymentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 font-serif text-xl font-medium text-espresso">
                <div className="p-2 bg-maroon/10 rounded-md"><Wallet className="h-5 w-5 text-maroon" /></div>
                Update Payment Status
              </DialogTitle>
              <DialogDescription className="pt-3 text-muted-foreground">
                Change payment for <span className="font-semibold text-espresso">Order #{orderToEditPayment?.order.id}</span>
              </DialogDescription>
            </DialogHeader>
            {orderToEditPayment && (
              <div className="space-y-5">
                <div className="p-4 bg-[#FBF8F3] rounded-md border border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-maroon text-ivory font-semibold text-sm">
                        {getInitials(orderToEditPayment.customer_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-espresso text-sm">Order #{orderToEditPayment.order.id}</p>
                      <p className="text-xs text-muted-foreground">{orderToEditPayment.customer_name} • {formatCurrency(orderToEditPayment.total_with_gst)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-medium text-muted-foreground w-28">Current:</span>
                  <StatusChip
                    tint={getPaymentStatusColor(orderToEditPayment.order.payment_status)}
                    label={(orderToEditPayment.order.payment_status || "unpaid").toUpperCase()}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2 block">New Payment Status</label>
                  <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                    <SelectTrigger className="w-full h-10 bg-white rounded-sm border-border text-[13px] focus:border-maroon focus:ring-0 focus:ring-offset-0"><SelectValue placeholder="Select payment status" /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">{getPaymentStatusIcon(s)} {s.charAt(0).toUpperCase() + s.slice(1)}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newPaymentStatus !== (orderToEditPayment.order.payment_status || "unpaid") && (
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-medium text-muted-foreground w-28">New:</span>
                    <StatusChip
                      tint={getPaymentStatusColor(newPaymentStatus)}
                      label={newPaymentStatus.toUpperCase()}
                    />
                  </div>
                )}
                <div className="p-3 bg-[#FBF8F3] rounded-md border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-maroon" />
                    <p className="text-[13px] font-semibold text-espresso">Order Summary</p>
                  </div>
                  <div className="ml-6 space-y-1">
                    <p className="text-[13px] text-muted-foreground">Subtotal: <span className="font-semibold text-espresso">{formatCurrency(orderToEditPayment.subtotal)}</span></p>
                    <p className="text-[13px] text-muted-foreground">GST: <span className="font-semibold text-espresso">{formatCurrency(orderToEditPayment.gst_18_percent)}</span></p>
                    <p className="text-[13px] text-muted-foreground">Total: <span className="font-semibold text-espresso">{formatCurrency(orderToEditPayment.total_with_gst)}</span></p>
                    <p className="text-[13px] text-muted-foreground">Method: <span className="font-semibold text-espresso">{getPaymentMethodLabel(orderToEditPayment.order.payment_method)}</span></p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" onClick={() => { setEditPaymentDialogOpen(false); setOrderToEditPayment(null); }} disabled={isUpdatingPaymentStatus}>Cancel</Button>
              <Button onClick={handlePaymentStatusUpdate} disabled={isUpdatingPaymentStatus || newPaymentStatus === (orderToEditPayment?.order.payment_status || "unpaid")} className="gap-2 bg-maroon text-ivory uppercase text-[11px] tracking-[0.12em] rounded-sm hover:bg-terracotta">
                {isUpdatingPaymentStatus ? (<><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>) : (<><Wallet className="h-4 w-4" /> Update Payment</>)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===================== DELETE DIALOG ===================== */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 font-serif text-xl font-medium text-espresso">
                <div className="p-2 bg-sale/10 rounded-md"><Trash2 className="h-5 w-5 text-sale" /></div>
                Delete Order
              </DialogTitle>
              <DialogDescription className="pt-3 text-muted-foreground">
                Are you sure you want to delete <span className="font-semibold text-espresso">Order #{orderToDelete?.order.id}</span>? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {orderToDelete && (
              <div className="p-4 bg-sale/5 rounded-md border border-sale/20 my-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-sale/10 text-sale font-semibold text-sm">
                      {getInitials(orderToDelete.customer_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-espresso text-sm">Order #{orderToDelete.order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {orderToDelete.customer_name} • {formatCurrency(orderToDelete.total_with_gst)} • {orderToDelete.items_count} items
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setOrderToDelete(null); }} disabled={isDeleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteOrder} disabled={isDeleting} className="gap-2 bg-sale text-ivory uppercase text-[11px] tracking-[0.12em] rounded-sm hover:bg-sale/90">
                {isDeleting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>) : (<><Trash2 className="h-4 w-4" /> Delete Order</>)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}