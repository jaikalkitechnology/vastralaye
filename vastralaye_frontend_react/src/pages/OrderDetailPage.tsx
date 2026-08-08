import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ShoppingBag, ArrowLeft, Package, Truck, CheckCircle,
    Clock, XCircle, MapPin, Calendar, Shield, HelpCircle,
    Home, AlertCircle, Banknote, CreditCard, Wallet,
    RefreshCw, Loader2, Receipt, ChevronDown, ChevronUp,
    Download, Printer, FileText, Mail
} from 'lucide-react';
import { BASE_URL } from '@/config';
import UserLayout from "@/components/user/UserLayout";
import { toast } from 'sonner';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import html2pdf from 'html2pdf.js';
import logo from "../../public/logo.png"

// ═══════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════

interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    product_name?: string;
    product_sku?: string;
    product_image?: string;
    hsn_code?: string;
    product?: { id: number; name: string; images?: string; sku?: string; hsn_code?: string };
}

interface TrackingUpdate {
    id?: number;
    status: string;
    message: string | null;
    timestamp: string | null;
}

interface OrderDetails {
    id: number;
    user_id: number;
    total_amount: number;
    created_at: string;
    status: string;
    payment_status: string;
    payment_method?: string;
    transaction_id?: string;
    utr_number?: string;           // ✅ NEW
    shipping_address?: string;
    customer_name?: string;        // ✅ NEW
    phone_number?: string;         // ✅ NEW
    city?: string | null;          // ✅ NEW
    state?: string | null;         // ✅ NEW
    pincode?: string | null;       // ✅ NEW
    gst?: number;                  // ✅ NEW
    subtotal?: number;             // ✅ NEW
    invoice_url?: string;          // ✅ NEW
    items?: OrderItem[];
    tracking?: TrackingUpdate[];
    total_items?: number;
    user?: any;
    discount_amount: number;
    shipping_amount: number;
}

interface UserProfile {
    name: string;
    email: string;
    phone?: string;
    address?: string;
}

// ═══════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════

const getAuthToken = (): string =>
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") || "";

const getPaymentMethodInfo = (method?: string) => {
    const m = (method || 'cod').toLowerCase();
    const map: Record<string, any> = {
        cod: {
            label: 'Cash on Delivery', shortLabel: 'COD', icon: Banknote,
            gradient: 'from-green-500 to-emerald-600',
            bgGradient: 'from-green-50 to-emerald-50',
            borderColor: 'border-green-200', textColor: 'text-green-700',
            badgeColor: 'bg-green-100 text-green-800 border-green-200',
        },
        card: {
            label: 'Credit/Debit Card', shortLabel: 'Card', icon: CreditCard,
            gradient: 'from-blue-500 to-indigo-600',
            bgGradient: 'from-blue-50 to-indigo-50',
            borderColor: 'border-blue-200', textColor: 'text-blue-700',
            badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        },
        upi: {
            label: 'UPI Payment', shortLabel: 'UPI', icon: Wallet,
            gradient: 'from-purple-500 to-violet-600',
            bgGradient: 'from-purple-50 to-violet-50',
            borderColor: 'border-purple-200', textColor: 'text-purple-700',
            badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        },
        netbanking: {
            label: 'Net Banking', shortLabel: 'NetBanking', icon: Shield,
            gradient: 'from-orange-500 to-amber-600',
            bgGradient: 'from-orange-50 to-amber-50',
            borderColor: 'border-orange-200', textColor: 'text-orange-700',
            badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
        },
    };
    return map[m] || map['cod'];
};

const getProductImageUrl = (imageStr?: string | null): string => {
    if (!imageStr) return '/placeholder.svg';
    let imagePath = imageStr;
    if (imageStr.startsWith('[')) {
        try {
            const parsed = JSON.parse(imageStr);
            imagePath = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
        } catch {
            imagePath = imageStr;
        }
    }
    if (!imagePath) return '/placeholder.svg';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = BASE_URL.replace(/\/api\/v1\/?$/, '');
    const cleanPath = imagePath.replace(/^\/+/, '');
    return `${baseUrl}/${cleanPath}`;
};

const formatDate = (d: string) => {
    try {
        return new Date(d).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return d; }
};

const formatShortDate = (d: string) => {
    try {
        return new Date(d).toLocaleDateString('en-IN', {
            month: 'long', day: 'numeric', year: 'numeric',
        });
    } catch { return d; }
};

const formatPrice = (p: number) =>
    `₹${p.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const getStatusIcon = (s: string) => {
    const map: Record<string, React.ReactNode> = {
        delivered: <CheckCircle className="w-5 h-5 text-green-600" />,
        shipped: <Truck className="w-5 h-5 text-blue-600" />,
        processing: <Package className="w-5 h-5 text-orange-600" />,
        cancelled: <XCircle className="w-5 h-5 text-red-600" />,
    };
    return map[s.toLowerCase()] || <Clock className="w-5 h-5 text-yellow-600" />;
};

const getStatusColor = (s: string) => {
    const map: Record<string, string> = {
        delivered: 'bg-green-100  text-green-800  border-green-200',
        shipped: 'bg-blue-100   text-blue-800   border-blue-200',
        processing: 'bg-orange-100 text-orange-800 border-orange-200',
        cancelled: 'bg-red-100    text-red-800    border-red-200',
    };
    return map[s.toLowerCase()] || 'bg-yellow-100 text-yellow-800 border-yellow-200';
};

const getStatusInlineStyle = (status: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
        delivered: { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' },
        shipped: { backgroundColor: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' },
        processing: { backgroundColor: '#ffedd5', color: '#c2410c', border: '1px solid #fdba74' },
        cancelled: { backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
        paid: { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' },
        unpaid: { backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
        pending: { backgroundColor: '#fef9c3', color: '#a16207', border: '1px solid #fde047' },
    };
    return map[status?.toLowerCase()] || map['pending'];
};

const getStatusDotColor = (status: string): string => {
    const map: Record<string, string> = {
        delivered: '#16a34a',
        shipped: '#2563eb',
        processing: '#ea580c',
        cancelled: '#dc2626',
        paid: '#16a34a',
        unpaid: '#dc2626',
        pending: '#ca8a04',
    };
    return map[status?.toLowerCase()] || '#ca8a04';
};

const getPaymentMethodInlineStyle = (method: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
        cod: { backgroundColor: '#dcfce7', color: '#15803d' },
        card: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
        upi: { backgroundColor: '#f3e8ff', color: '#7e22ce' },
        netbanking: { backgroundColor: '#ffedd5', color: '#c2410c' },
    };
    return map[method?.toLowerCase()] || map['cod'];
};

// ═══════════════════════════════════════════════
//  SHARED DATA HOOK
// ═══════════════════════════════════════════════

const useOrderData = (
    orderId: string | undefined,
    navigate: ReturnType<typeof useNavigate>,
) => {
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | undefined>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            const token = getAuthToken();
            if (!token) { navigate("/login"); return; }
            if (!orderId) { setError("No order ID"); setLoading(false); return; }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${BASE_URL}/users/user/orders/${orderId}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 401) { toast.error("Session expired"); navigate("/login"); return; }
                if (response.status === 404) { setError("Order not found"); setLoading(false); return; }
                if (!response.ok) {
                    const e = await response.json().catch(() => ({}));
                    throw new Error(e.detail || `Error ${response.status}`);
                }

                const data = await response.json();
                const raw = data.order || data.data || data;

           const normalized: OrderDetails = {
    id: raw.id,
    user_id: raw.user_id,
    total_amount: Number(raw.total_amount || 0),
    created_at: raw.created_at || new Date().toISOString(),
    status: raw.status || 'pending',
    payment_status: raw.payment_status || 'unpaid',
    payment_method: raw.payment_method || 'cod',
    transaction_id: raw.transaction_id || raw.txn_id || raw.razorpay_payment_id || null,
    utr_number: raw.utr_number || null,                    // ✅ NEW
    shipping_address: raw.shipping_address || null,
    customer_name: raw.customer_name || null,               // ✅ NEW
    phone_number: raw.phone_number || null,                 // ✅ NEW
    city: raw.city || null,                                 // ✅ NEW
    state: raw.state || null,                               // ✅ NEW
    pincode: raw.pincode || null,                           // ✅ NEW
    gst: Number(raw.gst || 0),                              // ✅ NEW
    subtotal: Number(raw.subtotal || 0),                    // ✅ NEW
    invoice_url: raw.invoice_url || null,                   // ✅ NEW
    user: raw.user || null,
    discount_amount: Number(raw.discount_amount || 0),
    shipping_amount: Number(raw.shipping_amount || 0),
    items: (raw.items || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity || 1,
        price: Number(item.price || 0),
        hsn_code: item.hsn_code || item.product?.hsn_code || null,
        product_name: item.product_name || item.product?.name || `Product #${item.product_id}`,
        product_sku: item.sku || item.product_sku || item.product?.sku || null,
        product_image: item.product_image || item.product?.images || null,
    })),
    tracking: raw.tracking || raw.tracking_updates || [],
    total_items: raw.total_items ||
        (raw.items || []).reduce((s: number, i: any) => s + (i.quantity || 1), 0),
};

setOrder(normalized);

// ✅ UPDATED: Use customer_name & phone_number from order directly
if (normalized.user || normalized.customer_name) {
    setUserProfile({
        name: normalized.customer_name || normalized.user?.name || 'Customer',
        email: normalized.user?.email || '',
        phone: normalized.phone_number || normalized.user?.phone || normalized.user?.mobile || '',
        address: normalized.shipping_address || normalized.user?.address || '',
    });
}

                setOrder(normalized);

                // ✅ UPDATED: Extract full customer details
                if (normalized.user) {
                    setUserProfile({
                        name: normalized.user.name || 'Customer',
                        email: normalized.user.email || '',
                        phone: normalized.user.phone || normalized.user.mobile || '',
                        address: normalized.user.address || normalized.shipping_address || '',
                    });
                }
            } catch (err: any) {
                setError(err.message);
                toast.error(err.message || "Failed to load order");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, navigate]);

    return { order, setOrder, userProfile, loading, error };
};

// ═══════════════════════════════════════════════
//  INVOICE PAGE VIEW
// ═══════════════════════════════════════════════

const InvoicePageView: React.FC<{
    order: OrderDetails;
    userProfile?: UserProfile;
    onBack: () => void;
}> = ({ order, userProfile, onBack }) => {
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [generatingPDF, setGeneratingPDF] = useState(false);

    const paymentInfo = getPaymentMethodInfo(order.payment_method);

    const subtotal = useMemo(
        () => order.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0,
        [order.items]
    );

    const shipping = order.shipping_amount || 0;
    const discount = order.discount_amount || 0;
    const total = Math.max(0, subtotal + shipping - discount);
    const baseAmount = Number((total / 1.18).toFixed(2));
    const gstAmount = Number((total - baseAmount).toFixed(2));

    const handlePrint = () => window.print();

    return (
        <>
            {/* ══════════════════════
                TOOLBAR (no-print)
            ══════════════════════ */}
            <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-3
                        flex flex-col sm:flex-row items-start sm:items-center
                        justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200
                         text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back to Order</span>
                        </button>
                        <div>
                            <h1 className="text-base font-bold text-gray-800">
                                Invoice <span className="text-green-600">#{order.id}</span>
                            </h1>
                            <p className="text-xs text-gray-500">{formatShortDate(order.created_at)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2
                         px-4 py-2 border border-gray-300 rounded-lg
                         text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Printer className="w-4 h-4" /><span>Print</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ══════════════════════
                PAGE BACKGROUND
            ══════════════════════ */}
            <div className="min-h-screen bg-gray-100 py-6 px-3 sm:px-4
                      print:bg-white print:p-0 print:py-0">
                <div
                    ref={invoiceRef}
                    style={{
                        backgroundColor: '#ffffff',
                        width: '100%',
                        maxWidth: '780px',
                        margin: '0 auto',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
                        fontSize: '14px',
                        color: '#1f2937',
                    }}
                >
                    {/* ── HEADER ── */}
                    <div style={{
                        background: 'linear-gradient(135deg,#16a34a 0%,#15803d 100%)',
                        padding: '32px 40px',
                        color: '#ffffff',
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start', gap: '24px',
                            flexWrap: 'wrap',
                        }}>
                            <div>
                                <div style={{
                                    display: "flex", alignItems: "left",
                                    justifyContent: "left", marginBottom: "12px"
                                }}>
                                    <div style={{
                                        width: "50%", maxWidth: "120px", height: "30px",
                                        padding: "10px", borderRadius: "16px", overflow: "hidden",
                                        display: "flex", alignItems: "left", justifyContent: "left",
                                        backgroundColor: "rgba(255,255,255,0.2)"
                                    }}>
                                        <img src={logo} alt="logo"
                                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                        />
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#dcfce7', lineHeight: '1.9' }}>
                                    <div>1PLOT NO 69-71, OM SHUBHAM TOWER, Faridabad, Haryana – 121001</div>
                                    <div>GST: 06AAQCM6479G1ZV</div>
                                    <div>support@mizorpaymart.com<br />  +91 85275 96413</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', color: '#86efac', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>tax Invoice</div>
                                <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px' }}>#{order.id}</div>
                                <div style={{ marginTop: '12px', fontSize: '12px', color: '#dcfce7', lineHeight: '1.9' }}>
                                    <div>Date: {formatShortDate(order.created_at)}</div>
                                    <div>INV-{String(order.id).padStart(6, '0')}</div>
                                </div>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '999px',
                                    padding: '4px 14px', marginTop: '10px', fontSize: '12px',
                                    fontWeight: '600', textTransform: 'capitalize'
                                }}>
                                    <span style={{
                                        width: '7px', height: '7px', borderRadius: '50%',
                                        backgroundColor: '#ffffff', display: 'inline-block'
                                    }} />
                                    {order.status}
                                </div>
                            </div>
                        </div>
                    </div>

                    
                  {/* ── BILL TO / SHIP TO ── */}
<div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap' }}>

    {/* ✅ BILL TO - Full Customer Details from Order */}
    <div style={{ flex: '1 1 200px', padding: '24px 32px', borderRight: '1px solid #f3f4f6' }}>
        <div style={{
            fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: '2px', color: '#9ca3af', marginBottom: '12px'
        }}>Bill To</div>

        {(order.customer_name || userProfile) ? (
            <div style={{ lineHeight: '1.9' }}>

                {/* Customer Name */}
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>
                    {order.customer_name || userProfile?.name || 'Customer'}
                </div>

                {/* Email */}
                {userProfile?.email && (
                    <div style={{
                        fontSize: '13px', color: '#6b7280',
                        display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px'
                    }}>
                        <span style={{ fontSize: '14px' }}>📧</span>
                        {userProfile.email}
                    </div>
                )}

                {/* Phone Number */}
                {(order.phone_number || userProfile?.phone) && (
                    <div style={{
                        fontSize: '13px', color: '#6b7280',
                        display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px'
                    }}>
                        <span style={{ fontSize: '14px' }}>📞</span>
                        {(order.phone_number || userProfile?.phone)?.trim()}
                    </div>
                )}

                {/* Full Address with City, State, Pincode */}
                {/* {(order.shipping_address || order.city || order.state || order.pincode) && (
                    <div style={{
                        fontSize: '13px', color: '#6b7280',
                        display: 'flex', alignItems: 'flex-start', gap: '6px',
                        marginTop: '6px', lineHeight: '1.6',
                    }}>
                        <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>📍</span>
                        <div>
                     
                            {order.shipping_address && (
                                <div>{order.shipping_address}</div>
                            )}

                         
                            {(order.city || order.state || order.pincode) && (
                                <div style={{ marginTop: '2px' }}>
                                    {[
                                        order.city?.trim(),
                                        order.state?.trim(),
                                        order.pincode?.trim()
                                    ].filter(Boolean).join(', ')}
                                </div>
                            )}
                        </div>
                    </div>
                )} */}

                {/* GST Number if available */}
                {/* {order.gst && order.gst > 0 && (
                    <div style={{
                        fontSize: '12px', color: '#6b7280',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        marginTop: '6px',
                        padding: '4px 10px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #f3f4f6',
                    }}>
                        <span style={{ fontSize: '13px' }}>🧾</span>
                        <span>GST: {formatPrice(order.gst)}</span>
                    </div>
                )} */}
            </div>
        ) : (
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                Customer details not available
            </div>
        )}
    </div>

    {/* ✅ SHIP TO - Full Shipping Details */}
    <div style={{ flex: '1 1 200px', padding: '24px 32px' }}>
        <div style={{
            fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: '2px', color: '#9ca3af', marginBottom: '12px'
        }}>Ship To</div>

        {order.shipping_address ? (
            <div style={{ lineHeight: '1.9' }}>

                {/* Customer Name at top */}
                {/* {order.customer_name && (
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
                        {order.customer_name.trim()}
                    </div>
                )} */}

                {/* Street Address */}
                <div style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'pre-line' }}>
                    {order.shipping_address}
                </div>

                {/* City, State, Pincode */}
                {(order.city || order.state || order.pincode) && (
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                        {[
                            order.city?.trim(),
                            order.state?.trim(),
                            order.pincode ? `- ${order.pincode.trim()}` : null
                        ].filter(Boolean).join(', ')}
                    </div>
                )}

                {/* Phone */}
                {/* {(order.phone_number || userProfile?.phone) && (
                    <div style={{
                        marginTop: '6px', display: 'flex', alignItems: 'center',
                        gap: '6px', fontSize: '13px', color: '#6b7280'
                    }}>
                        <span style={{ fontSize: '14px' }}>📞</span>
                        {(order.phone_number || userProfile?.phone)?.trim()}
                    </div>
                )} */}
            </div>
        ) : (
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                Shipping address not available
            </div>
        )}
    </div>
</div>

                    {/* ── ITEMS TABLE ── */}
                    <div style={{ padding: '24px 32px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{
                                    backgroundColor: '#f9fafb',
                                    borderTop: '1px solid #e5e7eb',
                                    borderBottom: '1px solid #e5e7eb',
                                }}>
                                    {[
                                        { label: '#', align: 'left', width: '30px' },
                                        { label: 'Product', align: 'left', width: 'auto' },
                                        { label: 'HSN', align: 'left', width: '60px' },
                                        { label: 'Qty', align: 'center', width: '55px' },
                                        { label: 'Unit Price', align: 'right', width: '95px' },
                                        { label: 'Amount', align: 'right', width: '105px' },
                                    ].map(col => (
                                        <th key={col.label} style={{
                                            padding: '10px 10px',
                                            textAlign: col.align as any,
                                            fontWeight: '600',
                                            color: '#6b7280',
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.8px',
                                            width: col.width,
                                        }}>{col.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {order.items && order.items.length > 0 ? (
                                    order.items.map((item, i) => (
                                        <tr
                                            key={item.id || i}
                                            style={{
                                                borderBottom: '1px solid #f3f4f6',
                                                backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa',
                                            }}
                                        >
                                            <td style={{ padding: '14px 10px', color: '#9ca3af', fontSize: '12px' }}>
                                                {i + 1}
                                            </td>
                                            <td style={{ padding: '14px 10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '46px', height: '46px',
                                                        border: '1px solid #e5e7eb', borderRadius: '8px',
                                                        overflow: 'hidden', flexShrink: 0,
                                                        backgroundColor: '#f9fafb',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <img
                                                            src={getProductImageUrl(item.product_image || item.product?.images)}
                                                            alt={item.product_name || ''}
                                                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                    </div>
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <div style={{
                                                            fontWeight: '600', color: '#111827', fontSize: '13px',
                                                            lineHeight: '1.5', wordBreak: 'break-word', whiteSpace: 'normal'
                                                        }}>
                                                            {item.product_name || `Product #${item.product_id}`}
                                                        </div>
                                                        {item.product_sku && (
                                                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                                                                SKU: {item.product_sku}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 10px', color: '#6b7280', fontSize: '12px' }}>
                                                {item.hsn_code || '-'}
                                            </td>
                                            <td style={{ padding: '14px 10px', textAlign: 'center', color: '#374151', fontWeight: '500' }}>
                                                {item.quantity}
                                            </td>
                                            <td style={{ padding: '14px 10px', textAlign: 'right', color: '#374151' }}>
                                                {formatPrice(item.price)}
                                            </td>
                                            <td style={{ padding: '14px 10px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>
                                                {formatPrice(item.price * item.quantity)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                                            No items available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── TOTALS + PAYMENT ── */}
                    <div style={{
                        padding: '0 32px 32px',
                        display: 'flex', justifyContent: 'flex-end',
                        gap: '16px', flexWrap: 'wrap'
                    }}>
                        {/* Order Summary */}
                   {/* Order Summary */}
<div style={{ width: '255px', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
    <div style={{ backgroundColor: '#f9fafb', padding: '10px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Order Summary
        </span>
    </div>
    <div style={{ padding: '16px' }}>

        {/* Subtotal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
            <span style={{ color: '#6b7280' }}>Subtotal ({order.total_items || order.items?.length || 0} items)</span>
            <span style={{ color: '#374151', fontWeight: '500' }}>{formatPrice(subtotal)}</span>
        </div>

        {/* Base Amount */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
            <span style={{ color: '#6b7280' }}>Base Amount</span>
            <span style={{ color: '#374151', fontWeight: '500' }}>{formatPrice(baseAmount)}</span>
        </div>

        {/* GST */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
            <span style={{ color: '#6b7280' }}>GST (18%)</span>
            <span style={{ color: '#374151', fontWeight: '500' }}>{formatPrice(gstAmount)}</span>
        </div>

        {/* Shipping */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
            <span style={{ color: '#6b7280' }}>Shipping</span>
            <span style={{ color: '#16a34a', fontWeight: '600' }}>
                {shipping === 0 ? (
                    <span style={{
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: '700',
                    }}>
                        FREE
                    </span>
                ) : formatPrice(shipping)}
            </span>
        </div>

        {/* ✅ Discount */}
        {discount > 0 && (
            <>
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: '10px', fontSize: '13px',
                }}>
                    <span style={{
                        color: '#16a34a',
                        display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                        <span style={{ fontSize: '13px' }}>🏷️</span>
                        Discount
                    </span>
                    <span style={{
                        color: '#16a34a', fontWeight: '700',
                        display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                        <span style={{
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            padding: '1px 6px',
                            borderRadius: '999px',
                            fontSize: '9px',
                            fontWeight: '800',
                            letterSpacing: '0.5px',
                        }}>
                            SAVE
                        </span>
                        - {formatPrice(discount)}
                    </span>
                </div>

                {/* ✅ Savings Banner */}
                <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <span style={{ fontSize: '16px' }}>🎉</span>
                    <div>
                        <div style={{
                            fontSize: '11px', fontWeight: '700', color: '#15803d',
                            lineHeight: '1.4',
                        }}>
                            You saved {formatPrice(discount)}!
                        </div>
                        <div style={{
                            fontSize: '10px', color: '#22c55e',
                            lineHeight: '1.4',
                        }}>
                            Discount applied successfully
                        </div>
                    </div>
                </div>
            </>
        )}

        {/* Divider + Total */}
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '12px',
            borderTop: '2px solid #e5e7eb',
            marginTop: '4px',
        }}>
            <span style={{
                fontWeight: '700', fontSize: '15px', color: '#111827',
                display: 'flex', alignItems: 'center', gap: '4px',
            }}>
                Total
            </span>
            <span style={{ fontWeight: '900', fontSize: '20px', color: '#16a34a' }}>
                {formatPrice(total)}
            </span>
        </div>

    </div>
</div>

                       {/* Payment Details */}
<div style={{ width: '255px', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
    <div style={{ backgroundColor: '#f9fafb', padding: '10px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Payment Details
        </span>
    </div>
    <div style={{ padding: '16px' }}>

        {/* Method */}
        <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Method
            </div>
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
                ...getPaymentMethodInlineStyle(order.payment_method || 'cod')
            }}>
                <span style={{ fontSize: '14px' }}>
                    {(order.payment_method || 'cod').toLowerCase() === 'cod' && '💵'}
                    {(order.payment_method || '').toLowerCase() === 'card' && '💳'}
                    {(order.payment_method || '').toLowerCase() === 'upi' && '📱'}
                    {(order.payment_method || '').toLowerCase() === 'netbanking' && '🏦'}
                </span>
                {paymentInfo.label}
            </div>
        </div>

        {/* ✅ Transaction ID */}
        <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Transaction ID
            </div>
            {order.transaction_id ? (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                    backgroundColor: '#dbeafe', color: '#1d4ed8',
                    fontFamily: "'Courier New', Courier, monospace",
                    wordBreak: 'break-all', maxWidth: '100%', lineHeight: '1.4',
                }}>
                    <span style={{ fontSize: '12px', flexShrink: 0 }}>🔗</span>
                    {order.transaction_id}
                </div>
            ) : (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                    backgroundColor: '#fef9c3', color: '#a16207',
                }}>
                    <span style={{ fontSize: '12px' }}>⏳</span>
                    {(order.payment_method || 'cod').toLowerCase() === 'cod'
                        ? 'Pay on delivery'
                        : 'Awaiting confirmation'}
                </div>
            )}
        </div>

        {/* ✅ UTR Number (if available) */}
        {order.utr_number && (
            <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    UTR Number
                </div>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                    backgroundColor: '#f3e8ff', color: '#7e22ce',
                    fontFamily: "'Courier New', Courier, monospace",
                    wordBreak: 'break-all', maxWidth: '100%', lineHeight: '1.4',
                }}>
                    <span style={{ fontSize: '12px', flexShrink: 0 }}>🏦</span>
                    {order.utr_number}
                </div>
            </div>
        )}

        {/* Payment Status */}
        <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Payment Status
            </div>
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '5px 12px', borderRadius: '999px', fontSize: '12px',
                fontWeight: '700', textTransform: 'capitalize',
                ...getStatusInlineStyle(order.payment_status || 'unpaid')
            }}>
                <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: getStatusDotColor(order.payment_status || 'unpaid'),
                    display: 'inline-block', flexShrink: 0
                }} />
                {order.payment_status || 'Unpaid'}
            </div>
        </div>

        {/* Order Status */}
        <div>
            <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Order Status
            </div>
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '5px 12px', borderRadius: '999px', fontSize: '12px',
                fontWeight: '700', textTransform: 'capitalize',
                ...getStatusInlineStyle(order.status)
            }}>
                <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: getStatusDotColor(order.status),
                    display: 'inline-block', flexShrink: 0
                }} />
                {order.status}
            </div>
        </div>

    </div>
</div>
                    </div>

                

                    {/* ── FOOTER BAND ── */}
                    <div style={{
                        backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb',
                        padding: 'clamp(16px, 4vw, 24px) clamp(16px, 5vw, 32px)',
                        display: 'flex',
                        flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: window.innerWidth < 640 ? 'stretch' : 'flex-start',
                        gap: window.innerWidth < 640 ? '12px' : '16px',
                        flexWrap: 'wrap',
                        textAlign: window.innerWidth < 640 ? 'center' : 'left'
                    }}>
                        <div style={{ width: window.innerWidth < 640 ? '100%' : 'auto' }}>
                            <div style={{
                                fontWeight: '600', color: '#374151',
                                fontSize: window.innerWidth < 640 ? '13px' : '14px',
                                marginBottom: '6px', display: 'flex', alignItems: 'center',
                                justifyContent: window.innerWidth < 640 ? 'center' : 'flex-start',
                                gap: '4px', flexWrap: 'wrap'
                            }}>
                                Thank you for shopping with us! <span style={{ fontSize: window.innerWidth < 640 ? '16px' : '14px' }}>🎉</span>
                            </div>
                            <div style={{
                                fontSize: window.innerWidth < 640 ? '11px' : '12px', color: '#6b7280',
                                display: 'flex',
                                flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                                alignItems: window.innerWidth < 640 ? 'center' : 'flex-start',
                                gap: window.innerWidth < 480 ? '4px' : '6px', flexWrap: 'wrap'
                            }}>
                                <span>Questions?</span>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                                    alignItems: window.innerWidth < 480 ? 'center' : 'center',
                                    gap: window.innerWidth < 480 ? '2px' : '4px', flexWrap: 'wrap'
                                }}>
                                    <span>Email</span>
                                    <a href="mailto:support@mizorpaymart.com" style={{
                                        color: '#16a34a', textDecoration: 'none', fontWeight: '500',
                                        borderBottom: window.innerWidth < 640 ? '1px dashed #16a34a' : 'none'
                                    }}>support@mizorpaymart.com</a>
                                </div>
                            </div>
                        </div>
                        <div style={{
                            fontSize: window.innerWidth < 640 ? '10px' : '11px',
                            color: '#9ca3af',
                            textAlign: window.innerWidth < 640 ? 'center' : 'right',
                            lineHeight: window.innerWidth < 640 ? '1.6' : '1.8',
                            width: window.innerWidth < 640 ? '100%' : 'auto',
                            borderTop: window.innerWidth < 640 ? '1px solid #e5e7eb' : 'none',
                            paddingTop: window.innerWidth < 640 ? '12px' : '0',
                            marginTop: window.innerWidth < 640 ? '4px' : '0'
                        }}>
                            <div>Computer-generated invoice. No signature required.</div>
                            <div>All prices are inclusive of applicable taxes.</div>
                        </div>
                    </div>

                    <div style={{ height: '6px', background: 'linear-gradient(90deg,#16a34a,#4ade80,#16a34a)' }} />
                </div>
            </div>

            <style>{`
                @media print {
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { margin: 0; padding: 0; background: white; }
                    .no-print { display: none !important; }
                    @page { size: A4 portrait; margin: 8mm; }
                    tr { page-break-inside: avoid; }
                    thead { display: table-header-group; }
                }
            `}</style>
        </>
    );
};

// ═══════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════

const OrderDetailPage = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [view, setView] = useState<'detail' | 'invoice'>('detail');
    const { order, setOrder, userProfile, loading, error } = useOrderData(orderId, navigate);
    const [canceling, setCanceling] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showTracking, setShowTracking] = useState(true);

    const emailInvoice = async () => {
        if (!order) return;
        try {
            const token = getAuthToken();
            const res = await fetch(`${BASE_URL}/users/user/orders/${orderId}/email-invoice`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userProfile?.email }),
            });
            if (res.ok) toast.success('Invoice sent to your email');
            else throw new Error('Failed');
        } catch {
            toast.error('Could not email invoice.');
        }
    };

    const handleCancel = async () => {
        if (!orderId) return;
        const token = getAuthToken();
        if (!token) return;
        setCanceling(true);
        try {
            const res = await fetch(`${BASE_URL}/users/user/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                throw new Error(e.detail || 'Failed to cancel');
            }
            const result = await res.json();
            toast.success(result.message || "Order cancelled");
            setShowCancelDialog(false);
            if (order) setOrder({
                ...order,
                status: 'cancelled',
                payment_status: result.payment_status || order.payment_status,
            });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setCanceling(false);
        }
    };

    if (loading) return (
        <UserLayout>
            <div className="flex justify-center items-center h-64 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#7A1F2B]" />
                <p className="text-gray-600">Loading order #{orderId}…</p>
            </div>
        </UserLayout>
    );

    if (error || !order) return (
        <UserLayout>
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-16 w-16 text-red-400" />
                <h2 className="text-2xl font-bold">{error || "Order Not Found"}</h2>
                <div className="flex gap-3">
                    <Button onClick={() => window.location.reload()} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />Retry
                    </Button>
                    <Button onClick={() => navigate('/orders')} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />Orders
                    </Button>
                </div>
            </div>
        </UserLayout>
    );

    if (view === 'invoice') {
        return (
            <InvoicePageView
                order={order}
                userProfile={userProfile}
                onBack={() => setView('detail')}
            />
        );
    }

    const paymentInfo = getPaymentMethodInfo(order.payment_method);
    const PaymentIcon = paymentInfo.icon;
    const totalItems = order.total_items || order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
    const canCancel = ['pending', 'processing'].includes(order.status.toLowerCase());
    const canReorder = ['delivered', 'cancelled'].includes(order.status.toLowerCase());

    return (
        <UserLayout>
            <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

                {/* ── TOP HEADER BAR ── */}
                <div className="bg-gradient-to-r from-[#7A1F2B]/10 via-[#B85C38]/5 to-[#7A1F2B]/10 rounded-2xl p-4 sm:p-6 border border-[#7A1F2B]/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <Button variant="outline" size="icon" onClick={() => navigate('/account/orders')} className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl border-[#7A1F2B]/30 flex-shrink-0">
                                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-[#7A1F2B]" />
                            </Button>
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold truncate bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] bg-clip-text text-transparent">
                                    Order #{order.id}
                                </h1>
                                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 mt-1">
                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{formatDate(order.created_at)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`${getStatusColor(order.status)} capitalize px-3 py-1.5 rounded-full`}>
                                <div className="flex items-center gap-1.5">{getStatusIcon(order.status)}<span>{order.status}</span></div>
                            </Badge>
                            <Badge variant="outline" className={`${paymentInfo.badgeColor} px-3 py-1 rounded-full text-xs`}>
                                <PaymentIcon className="w-3 h-3 mr-1" />{paymentInfo.shortLabel}
                            </Badge>
                            <Button variant="outline" onClick={() => setView('invoice')} className="border-[#7A1F2B] text-[#7A1F2B] hover:bg-[#7A1F2B]/5">
                                <FileText className="w-4 h-4 mr-2" />View Invoice
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="border-[#7A1F2B] text-[#7A1F2B]">
                                        <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setView('invoice'); setTimeout(() => window.print(), 700); }}>
                                        <Printer className="w-4 h-4 mr-2" />Print
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Mobile invoice button */}
                <div className="sm:hidden">
                    <Button onClick={() => setView('invoice')} className="w-full bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] text-white">
                        <FileText className="w-4 h-4 mr-2" />View / Download Invoice
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">

                            {/* ── ORDER SUMMARY CARD ── */}
                            <Card className="border-[#7A1F2B]/20 shadow-lg">
                                <CardHeader className="border-b border-[#7A1F2B]/10">
                                    <CardTitle className="flex items-center gap-3 text-[#7A1F2B]">
                                        <div className="w-10 h-10 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] rounded-lg flex items-center justify-center flex-shrink-0">
                                            <ShoppingBag className="w-5 h-5 text-white" />
                                        </div>
                                        Order Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    {(() => {
                                        const subtotal = order.items.reduce(
                                            (sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0
                                        );
                                        const shipping = order.shipping_amount || 0;
                                        const discount = order.discount_amount || 0;
                                        const total = Math.max(0, subtotal + shipping - discount);

                                        return (
                                            <>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Total Items</p>
                                                        <p className="text-2xl font-bold">{totalItems}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                                                        <p className="text-2xl font-bold">{formatPrice(total)}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                                                        <div className="mb-1 flex justify-center">{getStatusIcon(order.status)}</div>
                                                        <p className="text-xs text-gray-500">Status</p>
                                                        <p className="font-semibold capitalize text-xs sm:text-sm mt-0.5">{order.status}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                                                        <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                                                        <p className="text-xs text-gray-500">Payment</p>
                                                        <p className="font-semibold capitalize text-xs sm:text-sm mt-0.5">{order.payment_status}</p>
                                                    </div>
                                                    <div className={`p-3 bg-gradient-to-r ${paymentInfo.bgGradient} rounded-xl text-center border ${paymentInfo.borderColor}`}>
                                                        <PaymentIcon className={`w-5 h-5 mx-auto mb-1 ${paymentInfo.textColor}`} />
                                                        <p className="text-xs text-gray-500">Method</p>
                                                        <p className={`font-semibold text-xs sm:text-sm mt-0.5 ${paymentInfo.textColor}`}>{paymentInfo.shortLabel}</p>
                                                    </div>
                                                </div>

                                                {/* ✅ Transaction ID in Order Detail View */}
                                                {order.transaction_id && (
                                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center gap-3">
                                                        <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-blue-500 font-medium">Transaction ID</p>
                                                            <p className="text-sm text-blue-800 font-mono font-bold">{order.transaction_id}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {paymentInfo.shortLabel === "COD" && order.status !== "cancelled" && (
                                                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200 flex items-center gap-3">
                                                        <Banknote className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                                        <p className="text-sm text-yellow-800">
                                                            Please keep {formatPrice(total)} ready at delivery
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </CardContent>
                            </Card>

                        {/* ── ITEMS CARD ── */}
                        {order.items && order.items.length > 0 && (
                            <Card className="border-[#7A1F2B]/20 shadow-lg">
                                <CardHeader className="border-b border-[#7A1F2B]/10">
                                    <CardTitle className="flex items-center gap-3 text-[#7A1F2B]">
                                        <div className="w-10 h-10 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Package className="w-5 h-5 text-white" />
                                        </div>
                                        Items ({order.items.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 space-y-3">
                                    {order.items.map((item, i) => (
                                        <div key={item.id || i} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={getProductImageUrl(item.product_image)}
                                                    alt=""
                                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border flex-shrink-0"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm sm:text-base line-clamp-2">
                                                        {item.product_name || `Product #${item.product_id}`}
                                                    </p>
                                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                                                        <p className="text-xs sm:text-sm text-gray-500">
                                                            Qty: {item.quantity} × {formatPrice(item.price)}
                                                        </p>
                                                        {item.hsn_code && (
                                                            <p className="text-xs text-gray-400 border-l pl-3 border-gray-300">
                                                                HSN: {item.hsn_code}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="font-bold text-sm sm:text-base flex-shrink-0">
                                                {formatPrice(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    ))}

                                    {/* Price Breakdown */}
                                    {(() => {
                                        const subtotal = order.items.reduce(
                                            (sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0
                                        );
                                        const shipping = order.shipping_amount || 0;
                                        const discount = order.discount_amount || 0;
                                        const total = Math.max(0, subtotal + shipping - discount);
                                        const baseAmount = Number((total / 1.18).toFixed(2));
                                        const gstAmount = Number((total - baseAmount).toFixed(2));

                                        return (
                                            <>
                                                <div className="flex justify-between text-sm text-gray-600 pt-4 border-t">
                                                    <span>Base Amount (Excl. GST)</span>
                                                    <span className="font-medium">{formatPrice(baseAmount)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-600">
                                                    <span>GST (18%)</span>
                                                    <span className="font-medium">{formatPrice(gstAmount)}</span>
                                                </div>
                                                <div className="flex justify-between pt-3 border-t mt-2">
                                                    <span className="font-semibold">Total</span>
                                                    <span className="text-xl font-bold">{formatPrice(total)}</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        )}

                        {/* ── TRACKING CARD ── */}
                        {order.tracking && order.tracking.length > 0 && (
                            <Card className="border-[#7A1F2B]/20 shadow-lg">
                                <CardHeader className="border-b border-[#7A1F2B]/10">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-3 text-[#7A1F2B]">
                                            <div className="w-10 h-10 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Truck className="w-5 h-5 text-white" />
                                            </div>
                                            Tracking
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" onClick={() => setShowTracking(!showTracking)}>
                                            {showTracking ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </CardHeader>
                                {showTracking && (
                                    <CardContent className="p-6">
                                        <div className="relative">
                                            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200" />
                                            <div className="space-y-6">
                                                {order.tracking.map((t, i) => {
                                                    const isLatest = i === order.tracking!.length - 1;
                                                    return (
                                                        <div key={i} className="relative flex gap-4">
                                                            <div className={`relative z-10 w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${isLatest ? 'bg-green-500 ring-4 ring-green-100' : 'bg-gray-300'}`}>
                                                                {isLatest ? <CheckCircle className="w-5 h-5 text-white" /> : <Clock className="w-4 h-4 text-white" />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h4 className={`font-semibold ${isLatest ? 'text-gray-900' : 'text-gray-600'}`}>{t.status}</h4>
                                                                    {isLatest && <Badge className="bg-green-100 text-green-800 border-0 text-xs">Latest</Badge>}
                                                                </div>
                                                                {t.message && <p className="text-sm text-gray-600 mt-1">{t.message}</p>}
                                                                {t.timestamp && <p className="text-xs text-gray-400 mt-1">{formatDate(t.timestamp)}</p>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        )}
                    </div>

                    {/* ── RIGHT SIDEBAR ── */}
                    <div className="space-y-6">

                        {/* Payment Card */}
                        <Card className={`${paymentInfo.borderColor} shadow-lg`}>
                            <CardHeader className="border-b border-gray-100">
                                <CardTitle className="flex items-center gap-3">
                                    <div className={`w-10 h-10 bg-gradient-to-r ${paymentInfo.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                        <PaymentIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <span className={paymentInfo.textColor}>Payment</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {(() => {
                                    const subtotal = order.items.reduce(
                                        (sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0
                                    );
                                    const shipping = order.shipping_amount || 0;
                                    const discount = order.discount_amount || 0;
                                    const total = Math.max(0, subtotal + shipping - discount);
                                    const baseAmount = Number((total / 1.18).toFixed(2));
                                    const gstAmount = Number((total - baseAmount).toFixed(2));

                                    return (
                                        <div className={`p-4 bg-gradient-to-r ${paymentInfo.bgGradient} rounded-xl border ${paymentInfo.borderColor} space-y-3`}>
                                            <p className={`font-semibold ${paymentInfo.textColor}`}>{paymentInfo.label}</p>

                                            {/* ✅ Transaction ID in sidebar */}
                                            {order.transaction_id && (
                                                <div className="pt-2 pb-1">
                                                    <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                                                    <p className="text-sm font-mono font-bold text-gray-800 bg-white/60 px-2 py-1 rounded break-all">
                                                        {order.transaction_id}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="space-y-2 pt-3 border-t border-gray-200/50 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Status</span>
                                                    <span className="font-medium capitalize">{order.payment_status}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Base Amount</span>
                                                    <span className="font-medium">{formatPrice(baseAmount)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">GST (18%)</span>
                                                    <span className="font-medium">{formatPrice(gstAmount)}</span>
                                                </div>
                                                {shipping > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Shipping</span>
                                                        <span className="font-medium">{formatPrice(shipping)}</span>
                                                    </div>
                                                )}
                                                {discount > 0 && (
                                                    <div className="flex justify-between text-green-600">
                                                        <span>Discount</span>
                                                        <span className="font-medium">- {formatPrice(discount)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between pt-2 border-t font-bold">
                                                    <span>Total</span>
                                                    <span>{formatPrice(total)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>

                        {/* Shipping Card */}
                        {order.shipping_address && (
                            <Card className="border-[#7A1F2B]/20 shadow-lg">
                                <CardHeader className="border-b border-[#7A1F2B]/10">
                                    <CardTitle className="flex items-center gap-3 text-[#7A1F2B]">
                                        <div className="w-10 h-10 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] rounded-lg flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-5 h-5 text-white" />
                                        </div>
                                        Shipping
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-sm text-gray-700 p-3 bg-[#7A1F2B]/5 rounded-lg leading-relaxed">{order.shipping_address}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Invoice Card */}
                        <Card className="border-[#7A1F2B]/20 shadow-lg">
                            <CardHeader className="border-b border-[#7A1F2B]/10">
                                <CardTitle className="flex items-center gap-3 text-[#7A1F2B]">
                                    <div className="w-10 h-10 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Receipt className="w-5 h-5 text-white" />
                                    </div>
                                    Invoice
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-3">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Invoice #</span>
                                        <span className="font-medium">INV-{String(order.id).padStart(6, '0')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Date</span>
                                        <span className="font-medium">{formatShortDate(order.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Items</span>
                                        <span className="font-medium">{totalItems}</span>
                                    </div>
                                </div>
                                <div className="pt-3 space-y-2">
                                    <Button onClick={() => setView('invoice')} className="w-full bg-[#7A1F2B] hover:bg-[#457a3d] text-white">
                                        <FileText className="w-4 h-4 mr-2" />View Invoice
                                    </Button>
                                    <Button onClick={() => { setView('invoice'); setTimeout(() => window.print(), 700); }} variant="outline" className="w-full border-[#7A1F2B] text-[#7A1F2B]">
                                        <Printer className="w-4 h-4 mr-2" />Print
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {canCancel && (
                                <Button onClick={() => setShowCancelDialog(true)} variant="outline" className="w-full border-red-500 text-red-600 hover:bg-red-50" disabled={canceling}>
                                    <XCircle className="w-4 h-4 mr-2" />Cancel Order
                                </Button>
                            )}
                            {canReorder && (
                                <Button onClick={async () => {
                                    const token = getAuthToken();
                                    try {
                                        const res = await fetch(`${BASE_URL}/users/user/orders/${orderId}/reorder`, {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        if (!res.ok) throw new Error('Failed');
                                        const d = await res.json();
                                        toast.success(`New order #${d.id} created!`);
                                        navigate(`/orders/${d.id}`);
                                    } catch { toast.error("Failed to reorder"); }
                                }} variant="outline" className="w-full border-[#7A1F2B] text-[#7A1F2B]">
                                    <RefreshCw className="w-4 h-4 mr-2" />Reorder
                                </Button>
                            )}
                            <Button onClick={() => navigate('/products')} className="w-full bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] text-white">
                                <Home className="w-4 h-4 mr-2" />Continue Shopping
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                            <XCircle className="w-5 h-5" />Cancel Order
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure? This cannot be undone.
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-1">
                                <p className="text-sm"><strong>Order:</strong> #{order.id}</p>
                                <p className="text-sm"><strong>Total:</strong> {formatPrice(order.total_amount)}</p>
                                <p className="text-sm"><strong>Payment:</strong> {paymentInfo.label}</p>
                                {order.transaction_id && (
                                    <p className="text-sm"><strong>Transaction:</strong> {order.transaction_id}</p>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={canceling}>Keep Order</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} disabled={canceling} className="bg-red-600 hover:bg-red-700">
                            {canceling ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Cancelling…</> : 'Yes, Cancel'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </UserLayout>
    );
};

export default OrderDetailPage;