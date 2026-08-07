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
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      processing: "bg-purple-100 text-purple-800 border-purple-200",
      shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
      delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      refunded: "bg-gray-100 text-gray-800 border-gray-200",
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
      paid: "bg-green-100 text-green-800 border-green-200",
      unpaid: "bg-orange-100 text-orange-800 border-orange-200",
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
        .print-btn { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 12px 32px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; margin: 0 8px; }
        .close-btn { background: linear-gradient(135deg, #6b7280, #4b5563); color: white; border: none; padding: 12px 32px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; margin: 0 8px; }
      </style>
    </head>
    <body>
      <div class="print-btn-container no-print">
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        <button class="close-btn" onclick="window.close()">✕ Close</button>
      </div>

      <div class="invoice-container">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #3b82f6;">
          <div>
            <h1 style="font-size: 32px; font-weight: 800; color: #1e40af; margin-bottom: 4px;">INVOICE</h1>
            <img src="/logo.png" alt="MizorPayMart Logo" style="width: 120px; height: auto; object-fit: contain;">
            <p style="color: #9ca3af; font-size: 12px; margin-top: 4px;">GSTIN: ${gstin}</p>
          </div>
          <div style="text-align: right;">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 12px 24px; border-radius: 12px; display: inline-block;">
              <p style="font-size: 12px; opacity: 0.9; margin-bottom: 2px;">ORDER NO.</p>
              <p style="font-size: 24px; font-weight: 800;">#${order.id}</p>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 16px; margin-bottom: 32px;">
          <div style="flex: 1; background: #f0f9ff; padding: 16px 20px; border-radius: 12px; border: 1px solid #bfdbfe;">
            <p style="font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Order Date</p>
            <p style="font-weight: 700; color: #1e3a5f; font-size: 15px;">${orderDate}</p>
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
          <div style="flex: 1; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h3 style="font-size: 13px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">📋 Bill To</h3>
            <p style="font-weight: 700; color: #111827; font-size: 16px; margin-bottom: 8px;">${customer_name}</p>
            ${customer_email ? `<p style="color: #4b5563; font-size: 13px; margin-bottom: 4px;">📧 ${customer_email}</p>` : ""}
            ${customer_phone ? `<p style="color: #4b5563; font-size: 13px; margin-bottom: 4px;">📱 ${customer_phone}</p>` : ""}
          </div>
          <div style="flex: 1; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h3 style="font-size: 13px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">📍 Ship To</h3>
            <p style="font-weight: 600; color: #111827; font-size: 14px; line-height: 1.6;">${address}</p>
          </div>
        </div>

        <div style="margin-bottom: 32px;">
          <h3 style="font-size: 13px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">📦 Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <thead>
              <tr style="background: linear-gradient(135deg, #1e40af, #3b82f6);">
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
            <div style="display: flex; justify-content: space-between; padding: 16px 20px; margin-top: 8px; background: linear-gradient(135deg, #1e40af, #3b82f6); border-radius: 12px;">
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
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="border border-gray-200/50 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  /* ================= RENDER ================= */

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
              Order Management
            </h1>
            <p className="text-gray-600 text-base">
              Track and manage all customer orders
              {gstin && (
                <span className="ml-2 text-xs text-gray-400">• GSTIN: {gstin}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="default" onClick={fetchOrders} className="gap-2 hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button size="default" className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm">
              <Download className="h-4 w-4" /> Export Data
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"><ShoppingBag className="h-6 w-6" /></div>
                <TrendingUp className="h-5 w-5 opacity-70" />
              </div>
              <p className="text-sm font-medium text-blue-100 mb-1">Total Orders</p>
              <p className="text-4xl font-bold tracking-tight">{total}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"><IndianRupee className="h-6 w-6" /></div>
                <DollarSign className="h-5 w-5 opacity-70" />
              </div>
              <p className="text-sm font-medium text-emerald-100 mb-1">Page Revenue</p>
              <p className="text-4xl font-bold tracking-tight">{formatCurrency(totalRevenue).replace("₹", "₹ ")}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"><AlertCircle className="h-6 w-6" /></div>
                <Clock className="h-5 w-5 opacity-70" />
              </div>
              <p className="text-sm font-medium text-amber-100 mb-1">Pending Orders</p>
              <p className="text-4xl font-bold tracking-tight">{pendingOrders}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"><CreditCard className="h-6 w-6" /></div>
                <Wallet className="h-5 w-5 opacity-70" />
              </div>
              <p className="text-sm font-medium text-orange-100 mb-1">Unpaid Orders</p>
              <p className="text-4xl font-bold tracking-tight">{unpaidOrders}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-11 h-11 border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Search by order ID, customer name, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[180px] h-11 border-gray-300">
                    <Filter className="h-4 w-4 mr-2" />
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
                  <SelectTrigger className="w-[140px] h-11 border-gray-300">
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
          </CardContent>
        </Card>

        {/* ===================== ORDERS LIST ===================== */}
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <Card className="border-red-200 shadow-sm">
            <CardContent className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-red-200 mb-6">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Orders</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}</p>
              <Button onClick={fetchOrders} className="bg-gradient-to-r from-blue-600 to-blue-700">Try Again</Button>
            </CardContent>
          </Card>
        ) : ordersData.length === 0 ? (
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6">
                <ShoppingBag className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {search || status !== "all" ? "No orders match your filters." : "When customers place orders, they will appear here."}
              </p>
              {(search || status !== "all") && (
                <Button onClick={() => { setSearch(""); setStatus("all"); }} className="bg-gradient-to-r from-blue-600 to-blue-700">Clear All Filters</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {ordersData.map((od) => {
                const { order, customer_name, customer_email, customer_phone, items, items_count, subtotal, gst_18_percent, total_with_gst } = od;

                return (
                  <Card key={order.id} className="border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-14 w-14 ring-4 ring-blue-100 shadow-lg">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold text-lg">
                                {getInitials(customer_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h3 className="font-bold text-gray-900 text-lg">Order #{order.id}</h3>
                              <Badge className={`${getOrderStatusColor(order.status)} border font-semibold px-3 py-1 flex items-center gap-1`}>
                                {getOrderStatusIcon(order.status)}
                                {(order.status || "pending").toUpperCase()}
                              </Badge>
                              <Badge className={`${getPaymentStatusColor(order.payment_status)} border font-semibold px-3 py-1 flex items-center gap-1`}>
                                {getPaymentStatusIcon(order.payment_status)}
                                {(order.payment_status || "unpaid").toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">{customer_name}</p>
                            {order.payment_method && (
                              <p className="text-xs text-gray-400 mt-0.5">via {getPaymentMethodLabel(order.payment_method)}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 mb-1">
                            <IndianRupee className="h-5 w-5 text-emerald-600" />
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(total_with_gst).replace("₹", "")}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400">
                            Subtotal: {formatCurrency(subtotal)} + GST: {formatCurrency(gst_18_percent)}
                          </p>
                          <div className="bg-gray-50 px-3 py-1.5 rounded-lg mt-2">
                            <div className="flex items-center gap-1.5 text-gray-900 text-xs font-medium mb-0.5">
                              <Calendar className="h-3.5 w-3.5 text-gray-500" />
                              {formatDate(order.created_at)}
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                              <Clock className="h-3.5 w-3.5" />
                              {formatTime(order.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items Preview */}
                      {items.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-3.5 w-3.5 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              {items_count} {items_count === 1 ? "Item" : "Items"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {items.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
                                {item.product_image ? (
                                  <img
                                    src={getProductImageUrl(item.product_image)!}
                                    alt={item.product_name}
                                    className="w-8 h-8 rounded object-cover border border-gray-200"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = "/placeholder.png"; // Fallback image
                                      (e.currentTarget as HTMLImageElement).onerror = null; // Prevent loop
                                    }}
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                    <ImageIcon className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-medium text-gray-800 truncate max-w-[120px]">
                                    {item.product_name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-gray-500">
                                      {item.quantity}x {formatCurrency(item.price)}
                                    </p>
                                    {item.hsn_code && (
                                      <span className="text-[10px] text-gray-400 px-1 py-0.5 bg-gray-100 rounded border">HSN: {item.hsn_code}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {items.length > 3 && (
                              <div className="flex items-center px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                                <span className="text-xs font-medium text-blue-700">
                                  +{items.length - 3} more
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-sm mb-4 sm:mb-0">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-50 rounded-lg"><Mail className="h-4 w-4 text-blue-600" /></div>
                            <span className="text-gray-700 font-medium truncate max-w-[200px]">{customer_email || "No email"}</span>
                          </div>
                          {customer_phone && (
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-emerald-50 rounded-lg"><Phone className="h-4 w-4 text-emerald-600" /></div>
                              <span className="text-gray-700 font-medium">{customer_phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-violet-50 rounded-lg"><Package className="h-4 w-4 text-violet-600" /></div>
                            <span className="text-gray-700 font-semibold">{items_count} {items_count === 1 ? "item" : "items"}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button variant="outline" size="sm" className="gap-1.5 hover:bg-gray-50 border-gray-300"
                            onClick={() => { setSelectedOrderData(od); setIsDialogOpen(true); }}>
                            <Eye className="h-4 w-4" /> View
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1.5 hover:bg-violet-50 border-violet-200 text-violet-600"
                            onClick={() => printOrderInvoice(od)}>
                            <Printer className="h-4 w-4" /> Invoice
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1.5 hover:bg-blue-50 border-blue-200 text-blue-600"
                            onClick={() => openEditStatusDialog(od)}>
                            <Pencil className="h-4 w-4" /> Status
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1.5 hover:bg-green-50 border-green-200 text-green-600"
                            onClick={() => openEditPaymentDialog(od)}>
                            <Wallet className="h-4 w-4" /> Payment
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1.5 hover:bg-red-50 border-red-200 text-red-600"
                            onClick={() => openDeleteDialog(od)}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 font-medium">
                  Showing{" "}
                  <span className="font-bold text-gray-900">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}</span>
                  {" "}of <span className="font-bold text-gray-900">{total}</span> orders
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)} className="gap-2 border-gray-300">
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
                          className={`w-10 h-10 p-0 ${page === pageNum ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md" : "border-gray-300"}`}
                          onClick={() => setPage(pageNum)}>
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="gap-2 border-gray-300">
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
              <DialogTitle className="flex items-center gap-2.5 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg"><FileText className="h-5 w-5 text-blue-700" /></div>
                Order Details
              </DialogTitle>
            </DialogHeader>

            {selectedOrderData && (() => {
              const { order, customer_name, customer_email, customer_phone, items, items_count, subtotal, gst_18_percent, total_with_gst } = selectedOrderData;

              return (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-4 ring-blue-100">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold">
                          {getInitials(customer_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-gray-900">Order #{order.id}</h3>
                        <p className="text-sm text-gray-600">{customer_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={`${getOrderStatusColor(order.status)} border font-semibold px-3 py-1 flex items-center gap-1`}>
                        {getOrderStatusIcon(order.status)}
                        {(order.status || "pending").toUpperCase()}
                      </Badge>
                      <Badge className={`${getPaymentStatusColor(order.payment_status)} border font-semibold px-3 py-1 flex items-center gap-1`}>
                        {getPaymentStatusIcon(order.payment_status)}
                        {(order.payment_status || "unpaid").toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order ID</p>
                      <p className="font-bold text-gray-900 text-lg">#{order.id}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subtotal</p>
                      <p className="font-bold text-gray-900 text-lg">{formatCurrency(subtotal)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">GST ({gstRate || "18%"})</p>
                      <p className="font-bold text-orange-600 text-lg">{formatCurrency(gst_18_percent)}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Total with GST</p>
                      <p className="font-bold text-emerald-700 text-xl">{formatCurrency(total_with_gst)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Method</p>
                      <p className="font-bold text-gray-900">{getPaymentMethodLabel(order.payment_method)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order Date</p>
                      <p className="font-bold text-gray-900">{formatDate(order.created_at)}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTime(order.created_at)}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" /> Customer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-700">{customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-700">{customer_email || "—"}</span>
                      </div>
                      {customer_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-700">{customer_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shipping_address && (
                    <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Shipping Address
                      </h4>
                      <p className="text-sm font-medium text-gray-700">{order.shipping_address}</p>
                    </div>
                  )}

                  {/* GSTIN Info */}
                  {gstin && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">GSTIN: <span className="font-bold text-gray-800">{gstin}</span></span>
                      <span className="text-sm text-gray-400 ml-2">• GST Rate: <span className="font-bold text-gray-600">{gstRate}</span></span>
                    </div>
                  )}

                  {/* Order Items */}
                  {items.length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" /> Order Items ({items_count})
                      </h4>
                      <div className="space-y-3">
                        {items.map((item) => {
                          const imgUrl = getProductImageUrl(item.product_image);
                          return (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                                  {imgUrl ? (
                                    <img src={imgUrl} alt={item.product_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                      <ImageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{item.product_name}</p>
                                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                    <p className="text-xs text-gray-500">@ {formatCurrency(item.price)} each</p>
                                    
                                    {/* ✅ HSN Code Badge */}
                                    {item.hsn_code && (
                                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-600 bg-gray-50">
                                        HSN: {item.hsn_code}
                                      </Badge>
                                    )}
                                    
                                    {item.sku && (
                                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                                        SKU: {item.sku}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="font-bold text-gray-900 text-lg">{formatCurrency(item.total)}</p>
                            </div>
                          );
                        })}

                        {/* Totals Summary */}
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm text-gray-600">Subtotal</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(subtotal)}</p>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <p className="text-sm text-orange-700">GST ({gstRate || "18%"})</p>
                            <p className="font-semibold text-orange-800">{formatCurrency(gst_18_percent)}</p>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <p className="font-bold text-gray-900">Total with GST</p>
                            <p className="font-bold text-emerald-700 text-xl">{formatCurrency(total_with_gst)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dialog Actions */}
                  <div className="flex flex-wrap justify-between gap-3 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5 hover:bg-violet-50 border-violet-200 text-violet-600"
                        onClick={() => printOrderInvoice(selectedOrderData)}>
                        <Printer className="h-4 w-4" /> Print Invoice
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 hover:bg-blue-50 border-blue-200 text-blue-600"
                        onClick={() => { setIsDialogOpen(false); openEditStatusDialog(selectedOrderData); }}>
                        <Pencil className="h-4 w-4" /> Order Status
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 hover:bg-green-50 border-green-200 text-green-600"
                        onClick={() => { setIsDialogOpen(false); openEditPaymentDialog(selectedOrderData); }}>
                        <Wallet className="h-4 w-4" /> Payment
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 hover:bg-red-50 border-red-200 text-red-600"
                        onClick={() => { setIsDialogOpen(false); openDeleteDialog(selectedOrderData); }}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-300">Close</Button>
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
              <DialogTitle className="flex items-center gap-2.5 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg"><Pencil className="h-5 w-5 text-blue-600" /></div>
                Update Order Status
              </DialogTitle>
              <DialogDescription className="pt-3 text-gray-600">
                Change status for <span className="font-bold text-gray-900">Order #{orderToEditStatus?.order.id}</span>
              </DialogDescription>
            </DialogHeader>
            {orderToEditStatus && (
              <div className="space-y-5">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm">
                        {getInitials(orderToEditStatus.customer_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Order #{orderToEditStatus.order.id}</p>
                      <p className="text-xs text-gray-600">{orderToEditStatus.customer_name} • {formatCurrency(orderToEditStatus.total_with_gst)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-28">Current:</span>
                  <Badge className={`${getOrderStatusColor(orderToEditStatus.order.status)} border font-semibold px-3 py-1 flex items-center gap-1`}>
                    {getOrderStatusIcon(orderToEditStatus.order.status)}
                    {(orderToEditStatus.order.status || "pending").toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">New Order Status</label>
                  <Select value={newOrderStatus} onValueChange={setNewOrderStatus}>
                    <SelectTrigger className="w-full h-11 border-gray-300"><SelectValue placeholder="Select new status" /></SelectTrigger>
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
                    <span className="text-sm font-medium text-gray-600 w-28">New:</span>
                    <Badge className={`${getOrderStatusColor(newOrderStatus)} border font-semibold px-3 py-1 flex items-center gap-1`}>
                      {getOrderStatusIcon(newOrderStatus)} {newOrderStatus.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" onClick={() => { setEditStatusDialogOpen(false); setOrderToEditStatus(null); }} disabled={isUpdatingOrderStatus} className="border-gray-300">Cancel</Button>
              <Button onClick={handleOrderStatusUpdate} disabled={isUpdatingOrderStatus || newOrderStatus === (orderToEditStatus?.order.status || "pending")} className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
                {isUpdatingOrderStatus ? (<><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>) : (<><CheckCircle className="h-4 w-4" /> Update Status</>)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===================== EDIT PAYMENT STATUS DIALOG ===================== */}
        <Dialog open={editPaymentDialogOpen} onOpenChange={setEditPaymentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-xl">
                <div className="p-2 bg-green-100 rounded-lg"><Wallet className="h-5 w-5 text-green-600" /></div>
                Update Payment Status
              </DialogTitle>
              <DialogDescription className="pt-3 text-gray-600">
                Change payment for <span className="font-bold text-gray-900">Order #{orderToEditPayment?.order.id}</span>
              </DialogDescription>
            </DialogHeader>
            {orderToEditPayment && (
              <div className="space-y-5">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-700 text-white font-bold text-sm">
                        {getInitials(orderToEditPayment.customer_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Order #{orderToEditPayment.order.id}</p>
                      <p className="text-xs text-gray-600">{orderToEditPayment.customer_name} • {formatCurrency(orderToEditPayment.total_with_gst)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-28">Current:</span>
                  <Badge className={`${getPaymentStatusColor(orderToEditPayment.order.payment_status)} border font-semibold px-3 py-1 flex items-center gap-1`}>
                    {getPaymentStatusIcon(orderToEditPayment.order.payment_status)}
                    {(orderToEditPayment.order.payment_status || "unpaid").toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">New Payment Status</label>
                  <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                    <SelectTrigger className="w-full h-11 border-gray-300"><SelectValue placeholder="Select payment status" /></SelectTrigger>
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
                    <span className="text-sm font-medium text-gray-600 w-28">New:</span>
                    <Badge className={`${getPaymentStatusColor(newPaymentStatus)} border font-semibold px-3 py-1 flex items-center gap-1`}>
                      {getPaymentStatusIcon(newPaymentStatus)} {newPaymentStatus.toUpperCase()}
                    </Badge>
                  </div>
                )}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-800">Order Summary</p>
                  </div>
                  <div className="ml-6 space-y-1">
                    <p className="text-sm text-amber-700">Subtotal: <span className="font-bold">{formatCurrency(orderToEditPayment.subtotal)}</span></p>
                    <p className="text-sm text-amber-700">GST: <span className="font-bold">{formatCurrency(orderToEditPayment.gst_18_percent)}</span></p>
                    <p className="text-sm text-amber-700">Total: <span className="font-bold">{formatCurrency(orderToEditPayment.total_with_gst)}</span></p>
                    <p className="text-sm text-amber-700">Method: <span className="font-bold">{getPaymentMethodLabel(orderToEditPayment.order.payment_method)}</span></p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" onClick={() => { setEditPaymentDialogOpen(false); setOrderToEditPayment(null); }} disabled={isUpdatingPaymentStatus} className="border-gray-300">Cancel</Button>
              <Button onClick={handlePaymentStatusUpdate} disabled={isUpdatingPaymentStatus || newPaymentStatus === (orderToEditPayment?.order.payment_status || "unpaid")} className="gap-2 bg-gradient-to-r from-green-600 to-green-700">
                {isUpdatingPaymentStatus ? (<><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>) : (<><Wallet className="h-4 w-4" /> Update Payment</>)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===================== DELETE DIALOG ===================== */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-xl">
                <div className="p-2 bg-red-100 rounded-lg"><Trash2 className="h-5 w-5 text-red-600" /></div>
                Delete Order
              </DialogTitle>
              <DialogDescription className="pt-3 text-gray-600">
                Are you sure you want to delete <span className="font-bold text-gray-900">Order #{orderToDelete?.order.id}</span>? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {orderToDelete && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 my-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-red-400 to-red-600 text-white font-bold text-sm">
                      {getInitials(orderToDelete.customer_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Order #{orderToDelete.order.id}</p>
                    <p className="text-xs text-gray-600">
                      {orderToDelete.customer_name} • {formatCurrency(orderToDelete.total_with_gst)} • {orderToDelete.items_count} items
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setOrderToDelete(null); }} disabled={isDeleting} className="border-gray-300">Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteOrder} disabled={isDeleting} className="gap-2 bg-gradient-to-r from-red-600 to-red-700">
                {isDeleting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>) : (<><Trash2 className="h-4 w-4" /> Delete Order</>)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}