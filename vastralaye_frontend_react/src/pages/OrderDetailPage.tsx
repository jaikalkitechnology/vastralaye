import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, Package, Truck, CheckCircle,
    Clock, XCircle, Shield,
    AlertCircle, Banknote, CreditCard, Wallet,
    RefreshCw, Loader2, ChevronDown, ChevronUp,
    Download, Printer, FileText, Mail
} from 'lucide-react';
import { BASE_URL } from '@/config';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import PaymentBadges from '@/components/PaymentBadges';
import { FALLBACK_WHATSAPP } from '@/hooks/use-site-settings';
import { toast } from 'sonner';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    sgst?: number | null;
    cgst?: number | null;
    igst?: number | null;
    product?: { id: number; name: string; images?: string; sku?: string; hsn_code?: string };
}

/** Per-product GST rate: igst, else sgst+cgst, else 18 — mirrors the cart. */
const productGstRate = (it: any): number => {
    const igst = Number(it?.igst);
    if (Number.isFinite(igst) && igst > 0) return igst;
    const split = Number(it?.sgst ?? 0) + Number(it?.cgst ?? 0);
    if (Number.isFinite(split) && split > 0) return split;
    return 18;
};

/** GST inside `goodsTotal`, split into place-of-supply heads.
    Item lines are list prices; the tax is scaled pro rata so
    base + GST always add back to the amount actually paid. */
const orderTaxBreakup = (items: any[], goodsTotal: number, stateText: string) => {
    const linesTotal = items.reduce((s, it) => s + (Number(it.price) || 0) * (it.quantity || 1), 0);
    const rawGst = items.reduce((s, it) => {
        const line = (Number(it.price) || 0) * (it.quantity || 1);
        const rate = productGstRate(it);
        return s + (line - line / (1 + rate / 100));
    }, 0);
    const scale = linesTotal > 0 ? goodsTotal / linesTotal : 1;
    const gstAmount = Number((rawGst * scale).toFixed(2));
    const baseAmount = Number((goodsTotal - gstAmount).toFixed(2));

    const rates = new Set(items.map(productGstRate));
    const oneRate = rates.size === 1 && items.length > 0 ? [...rates][0] : null;
    let heads: Array<{ label: string; amount: number }>;
    if (stateText.toLowerCase().includes('maharashtra')) {
        const cgst = Number((gstAmount / 2).toFixed(2));
        const sgst = Number((gstAmount - cgst).toFixed(2));
        const half = oneRate ? ` (${oneRate / 2}%)` : '';
        heads = [
            { label: `SGST${half}`, amount: sgst },
            { label: `CGST${half}`, amount: cgst },
        ];
    } else {
        const name = stateText.trim() ? 'IGST' : 'GST';
        heads = [{ label: oneRate ? `${name} (${oneRate}%)` : name, amount: gstAmount }];
    }
    return { baseAmount, gstAmount, heads };
};

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
            gradient: 'from-espresso to-maroon',
            bgGradient: 'from-ivory to-sand',
            borderColor: 'border-border', textColor: 'text-espresso',
            badgeColor: 'bg-sand/60 text-espresso border-border',
        },
        card: {
            label: 'Credit/Debit Card', shortLabel: 'Card', icon: CreditCard,
            gradient: 'from-espresso to-maroon',
            bgGradient: 'from-ivory to-sand',
            borderColor: 'border-border', textColor: 'text-espresso',
            badgeColor: 'bg-sand/60 text-espresso border-border',
        },
        upi: {
            label: 'UPI Payment', shortLabel: 'UPI', icon: Wallet,
            gradient: 'from-espresso to-maroon',
            bgGradient: 'from-ivory to-sand',
            borderColor: 'border-border', textColor: 'text-espresso',
            badgeColor: 'bg-sand/60 text-espresso border-border',
        },
        netbanking: {
            label: 'Net Banking', shortLabel: 'NetBanking', icon: Shield,
            gradient: 'from-espresso to-maroon',
            bgGradient: 'from-ivory to-sand',
            borderColor: 'border-border', textColor: 'text-espresso',
            badgeColor: 'bg-sand/60 text-espresso border-border',
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
        delivered: <CheckCircle className="w-3.5 h-3.5" />,
        shipped: <Truck className="w-3.5 h-3.5" />,
        processing: <Package className="w-3.5 h-3.5" />,
        cancelled: <XCircle className="w-3.5 h-3.5" />,
    };
    return map[s.toLowerCase()] || <Clock className="w-3.5 h-3.5" />;
};

/* Status pill — tuned for the dark espresso band: gold tint for active
   states, green for delivered, red for cancelled. */
const getStatusColor = (s: string) => {
    const map: Record<string, string> = {
        delivered: 'bg-[#3E6B4F]/25 text-[#9FD3B2] border-[#3E6B4F]/40',
        shipped: 'bg-gold/15 text-gold border-gold/40',
        processing: 'bg-gold/15 text-gold border-gold/40',
        cancelled: 'bg-sale/15 text-[#F1A9A9] border-sale/40',
    };
    return map[s.toLowerCase()] || 'bg-gold/15 text-gold border-gold/40';
};

const getStatusInlineStyle = (status: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
        delivered: { backgroundColor: 'rgba(62,107,79,0.12)', color: '#3E6B4F', border: '1px solid rgba(62,107,79,0.35)' },
        shipped: { backgroundColor: 'rgba(201,154,69,0.15)', color: '#8A6414', border: '1px solid rgba(201,154,69,0.4)' },
        processing: { backgroundColor: 'rgba(201,154,69,0.15)', color: '#8A6414', border: '1px solid rgba(201,154,69,0.4)' },
        cancelled: { backgroundColor: 'rgba(198,40,40,0.08)', color: '#C62828', border: '1px solid rgba(198,40,40,0.3)' },
        paid: { backgroundColor: 'rgba(62,107,79,0.12)', color: '#3E6B4F', border: '1px solid rgba(62,107,79,0.35)' },
        unpaid: { backgroundColor: 'rgba(198,40,40,0.08)', color: '#C62828', border: '1px solid rgba(198,40,40,0.3)' },
        pending: { backgroundColor: 'rgba(201,154,69,0.15)', color: '#8A6414', border: '1px solid rgba(201,154,69,0.4)' },
    };
    return map[status?.toLowerCase()] || map['pending'];
};

const getStatusDotColor = (status: string): string => {
    const map: Record<string, string> = {
        delivered: '#3E6B4F',
        shipped: '#C99A45',
        processing: '#C99A45',
        cancelled: '#C62828',
        paid: '#3E6B4F',
        unpaid: '#C62828',
        pending: '#8A6414',
    };
    return map[status?.toLowerCase()] || '#8A6414';
};

const getPaymentMethodInlineStyle = (method: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
        cod: { backgroundColor: 'rgba(239,231,219,0.6)', color: '#2B1B12' },
        card: { backgroundColor: 'rgba(239,231,219,0.6)', color: '#2B1B12' },
        upi: { backgroundColor: 'rgba(239,231,219,0.6)', color: '#2B1B12' },
        netbanking: { backgroundColor: 'rgba(239,231,219,0.6)', color: '#2B1B12' },
    };
    return map[method?.toLowerCase()] || map['cod'];
};

/* Payment-status chip on light cards. */
const getPayStatusChipClass = (s?: string) => {
    const k = (s || 'unpaid').toLowerCase();
    if (k === 'paid') return 'border-[#3E6B4F]/30 bg-[#3E6B4F]/10 text-[#3E6B4F]';
    if (k === 'unpaid' || k === 'failed') return 'border-sale/25 bg-sale/5 text-sale';
    return 'border-gold/40 bg-gold/10 text-[#8A6414]';
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
        sgst: item.sgst ?? null,
        cgst: item.cgst ?? null,
        igst: item.igst ?? null,
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

/* Ornamental assets shared by the invoice paper */
const PAISLEY_BG =
    "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='130' height='130' viewBox='0 0 130 130'><g fill='none' stroke='%23C99A45'><path d='M33 11c14 6 22 18 20 32-2 12-11 22-22 24-8 2-13-2-14-8-1-6 3-11 9-11 5 0 9 3 9 8'/><rect x='92' y='26' width='6' height='6' transform='rotate(45 95 29)'/><path d='M97 119c-14-6-22-18-20-32 2-12 11-22 22-24 8-2 13 2 14 8 1 6-3 11-9 11-5 0-9-3-9-8'/><rect x='29' y='94' width='6' height='6' transform='rotate(45 32 97)'/></g></svg>\")";

const toolbarBtn =
    'inline-flex items-center gap-2 rounded-sm border border-border bg-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso transition-colors hover:border-maroon/40 hover:text-maroon';
const toolbarBtnMaroon =
    'inline-flex items-center gap-2 rounded-sm border border-maroon bg-maroon px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:bg-espresso hover:border-espresso';

const InvoicePageView: React.FC<{
    order: OrderDetails;
    userProfile?: UserProfile;
    onBack: () => void;
    onEmail?: () => void;
}> = ({ order, userProfile, onBack, onEmail }) => {
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
    const { baseAmount, gstAmount, heads: taxHeads } = orderTaxBreakup(
        order.items || [],
        Math.max(0, subtotal - discount),
        String(order.state || order.shipping_address || ''),
    );

    const handlePrint = () => window.print();

    const invoiceNo = `INV-${String(order.id).padStart(6, '0')}`;
    const isPaid = (order.payment_status || '').toLowerCase() === 'paid';
    const phone = (order.phone_number || userProfile?.phone)?.trim();
    const cityLine = [
        order.city?.trim(),
        order.state?.trim(),
        order.pincode ? `- ${order.pincode.trim()}` : null,
    ].filter(Boolean).join(', ');

    const metaLabel = 'text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground';
    const totRow = 'flex justify-between py-1.5 text-muted-foreground';

    return (
        <div className="flex min-h-screen flex-col bg-ivory print:bg-white">
            <div className="no-print"><NavBar /></div>

            <main className="flex-1">
                {/* ── ESPRESSO PAGE BAND (no-print) ── */}
                <div className="no-print bg-espresso border-b-[3px] border-gold">
                    <div className="container mx-auto flex flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.16em] text-ivory/55">
                                Home · My Account · Order #{order.id} · <span className="font-medium text-gold">Invoice</span>
                            </p>
                            <h1 className="mt-1.5 font-serif text-[28px] font-medium text-ivory">Tax Invoice</h1>
                        </div>
                        <p className="text-[12.5px] text-ivory/65 sm:text-right">
                            {invoiceNo} · Issued {formatShortDate(order.created_at)}
                        </p>
                    </div>
                </div>

                <div className="container mx-auto max-w-[1000px] px-4 print:max-w-none print:px-0">
                    {/* ── TOOLBAR (no-print) ── */}
                    <div className="no-print flex flex-wrap items-center gap-2.5 py-6">
                        <button
                            onClick={onBack}
                            className="mr-auto inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-maroon"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to order
                        </button>
                        <button onClick={handlePrint} className={toolbarBtn} disabled={generatingPDF}>
                            <Printer className="h-3.5 w-3.5" />Print
                        </button>
                        {onEmail && (
                            <button onClick={onEmail} className={toolbarBtn}>
                                <Mail className="h-3.5 w-3.5" />Email Invoice
                            </button>
                        )}
                        <button onClick={handlePrint} className={toolbarBtnMaroon} disabled={generatingPDF}>
                            <Download className="h-3.5 w-3.5" />Download PDF
                        </button>
                    </div>

                    {/* ══════════════════════
                        INVOICE PAPER
                    ══════════════════════ */}
                    <div
                        ref={invoiceRef}
                        className="relative mb-14 overflow-hidden rounded-sm border border-border bg-white print:mb-0 print:rounded-none print:border-0"
                    >
                        {/* ── ESPRESSO LETTERHEAD ── */}
                        <div className="relative flex flex-col justify-between gap-5 overflow-hidden bg-espresso px-6 py-6 text-ivory sm:flex-row sm:items-center sm:px-9">
                            <span
                                aria-hidden
                                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                                style={{ backgroundImage: PAISLEY_BG, backgroundSize: '130px 130px' }}
                            />
                            {/* Image-only logo on an ivory chip — the artwork carries the name */}
                            <div className="relative flex items-center gap-3.5">
                                <img
                                    src="/logo_vas.png"
                                    alt="Vastraliya"
                                    className="h-[72px] w-[72px] shrink-0 rounded-md bg-ivory object-contain p-1"
                                />
                                <p className="text-[11px] leading-relaxed text-ivory/60">
                                    Gala No 230, Pride Industrial Estate, Vasai East, Thane, Maharashtra – 401208<br />
                                    support@vastraliya.com · +91 70661 81207 · GSTIN 27AAMCV4451F1Z4
                                </p>
                            </div>
                            <div className="relative sm:text-right">
                                <p className="font-serif text-2xl tracking-[0.06em] text-gold">TAX INVOICE</p>
                                <p className="mt-1 text-xs text-ivory/65">{invoiceNo} · Original for recipient</p>
                                <span className="mt-2.5 inline-flex rounded-full border border-gold/60 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
                                    {isPaid ? 'Paid' : `${paymentInfo.label} · ${order.payment_status || 'Unpaid'}`}
                                </span>
                            </div>
                        </div>

                        <div className="px-6 pb-8 pt-7 sm:px-9">
                            {/* ── META STRIP ── */}
                            <div className={`grid grid-cols-2 gap-4 rounded-sm border border-border bg-ivory px-[18px] py-3.5 ${order.state ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                                <div>
                                    <p className={metaLabel}>Invoice date</p>
                                    <p className="mt-0.5 text-[13.5px] font-medium text-espresso">{formatShortDate(order.created_at)}</p>
                                </div>
                                <div>
                                    <p className={metaLabel}>Order no.</p>
                                    <p className="mt-0.5 text-[13.5px] font-medium text-espresso">#{order.id}</p>
                                </div>
                                <div>
                                    <p className={metaLabel}>Order date</p>
                                    <p className="mt-0.5 text-[13.5px] font-medium text-espresso">{formatShortDate(order.created_at)}</p>
                                </div>
                                {order.state && (
                                    <div>
                                        <p className={metaLabel}>Place of supply</p>
                                        <p className="mt-0.5 text-[13.5px] font-medium text-espresso">{order.state.trim()}</p>
                                    </div>
                                )}
                            </div>

                            {/* ── BILL TO / SHIP TO ── */}
                            <div className="my-5 grid gap-5 sm:grid-cols-2">
                                <div className="rounded-sm border border-border px-4 py-4">
                                    <p className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#8A6414]">Bill to</p>
                                    {(order.customer_name || userProfile) ? (
                                        <>
                                            <p className="text-sm font-semibold text-espresso">
                                                {order.customer_name || userProfile?.name || 'Customer'}
                                            </p>
                                            {(userProfile?.email || phone) && (
                                                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                                                    {[userProfile?.email, phone].filter(Boolean).join(' · ')}
                                                </p>
                                            )}
                                            {order.shipping_address && (
                                                <p className="mt-0.5 whitespace-pre-line text-[12.5px] text-muted-foreground">
                                                    {order.shipping_address}{cityLine ? `, ${cityLine}` : ''}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-[12.5px] text-muted-foreground">Customer details not available</p>
                                    )}
                                </div>
                                <div className="rounded-sm border border-border px-4 py-4">
                                    <p className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#8A6414]">Ship to</p>
                                    {order.shipping_address ? (
                                        <>
                                            {(order.customer_name || userProfile?.name) && (
                                                <p className="text-sm font-semibold text-espresso">
                                                    {order.customer_name || userProfile?.name}
                                                </p>
                                            )}
                                            <p className="mt-0.5 whitespace-pre-line text-[12.5px] text-muted-foreground">
                                                {order.shipping_address}
                                            </p>
                                            {cityLine && (
                                                <p className="mt-0.5 text-[12.5px] text-muted-foreground">{cityLine}</p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-[12.5px] text-muted-foreground">Shipping address not available</p>
                                    )}
                                </div>
                            </div>

                            {/* ── ITEMS TABLE ── */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-[13px]">
                                    <thead>
                                        <tr>
                                            <th className="w-[46px] bg-espresso px-3 py-2.5" />
                                            <th className="bg-espresso px-3 py-2.5 text-left text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ivory">Item</th>
                                            <th className="bg-espresso px-3 py-2.5 text-right text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ivory">Qty</th>
                                            <th className="bg-espresso px-3 py-2.5 text-right text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ivory">Price</th>
                                            <th className="bg-espresso px-3 py-2.5 text-right text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ivory">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items && order.items.length > 0 ? (
                                            order.items.map((item, i) => (
                                                <tr key={item.id || i}>
                                                    <td className="border-b border-border px-3 py-2.5 align-middle">
                                                        <img
                                                            src={getProductImageUrl(item.product_image || item.product?.images)}
                                                            alt={item.product_name || ''}
                                                            className="block aspect-[3/4] w-[34px] rounded-[2px] border border-border bg-sand object-cover"
                                                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                    </td>
                                                    <td className="border-b border-border px-3 py-2.5 align-middle">
                                                        <p className="text-espresso">{item.product_name || `Product #${item.product_id}`}</p>
                                                        {(item.product_sku || item.hsn_code) && (
                                                            <p className="text-[10.5px] text-muted-foreground">
                                                                {[
                                                                    item.product_sku ? `SKU ${item.product_sku}` : null,
                                                                    item.hsn_code ? `HSN ${item.hsn_code}` : null,
                                                                ].filter(Boolean).join(' · ')}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="border-b border-border px-3 py-2.5 text-right align-middle text-espresso">{item.quantity}</td>
                                                    <td className="border-b border-border px-3 py-2.5 text-right align-middle text-espresso">{formatPrice(item.price)}</td>
                                                    <td className="border-b border-border px-3 py-2.5 text-right align-middle font-semibold text-espresso">{formatPrice(item.price * item.quantity)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="border-b border-border px-3 py-8 text-center text-muted-foreground">
                                                    No items available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── TOTALS ── */}
                            <div className="mt-5 flex flex-col items-start gap-6 sm:flex-row">
                                {discount > 0 && (
                                    <div className="w-full flex-1 rounded-sm border border-border bg-blush/60 px-4 py-3.5 text-[12.5px] text-muted-foreground">
                                        You saved <b className="font-semibold text-[#3E6B4F]">{formatPrice(discount)}</b> on this order 🎉
                                    </div>
                                )}
                                <div className="w-full text-[13.5px] sm:ml-auto sm:w-[300px]">
                                    <div className={totRow}>
                                        <span>Subtotal ({order.total_items || order.items?.length || 0} items)</span>
                                        <b className="font-medium text-espresso">{formatPrice(subtotal)}</b>
                                    </div>
                                    {discount > 0 && (
                                        <div className={totRow}>
                                            <span>Discount</span>
                                            <b className="font-medium text-[#3E6B4F]">− {formatPrice(discount)}</b>
                                        </div>
                                    )}
                                    <div className={totRow}>
                                        <span>Base Amount</span>
                                        <b className="font-medium text-espresso">{formatPrice(baseAmount)}</b>
                                    </div>
                                    {taxHeads.map((head) => (
                                        <div key={head.label} className={totRow}>
                                            <span>{head.label} (incl.)</span>
                                            <b className="font-medium text-espresso">{formatPrice(head.amount)}</b>
                                        </div>
                                    ))}
                                    <div className={totRow}>
                                        <span>Shipping</span>
                                        <b className="font-medium text-espresso">{shipping === 0 ? 'Free' : formatPrice(shipping)}</b>
                                    </div>
                                    <div className="mt-1.5 flex items-baseline justify-between border-t-2 border-gold pt-2.5">
                                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-espresso">Grand total</span>
                                        <span className="font-serif text-[23px] font-medium text-maroon">{formatPrice(total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── PAYMENT REFERENCES ── */}
                            {(order.transaction_id || order.utr_number) && (
                                <p className="mt-4 break-all text-[11px] text-muted-foreground">
                                    {order.transaction_id && (
                                        <>Transaction ID <span className="font-mono text-espresso">{order.transaction_id}</span></>
                                    )}
                                    {order.transaction_id && order.utr_number && ' · '}
                                    {order.utr_number && (
                                        <>UTR <span className="font-mono text-espresso">{order.utr_number}</span></>
                                    )}
                                </p>
                            )}

                            {/* ── SIGNATORY ── */}
                            <div className="mt-7 flex items-end justify-end border-t border-border pt-5">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="h-px w-9 bg-gold/60" />
                                        <span className="h-1.5 w-1.5 rotate-45 border border-gold" />
                                        <span className="h-px w-9 bg-gold/60" />
                                    </div>
                                    <p className="mt-2 font-serif text-sm text-espresso">For Vastraliya</p>
                                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Authorised signatory</p>
                                </div>
                            </div>
                        </div>

                        <p className="px-6 pb-2 text-center font-serif text-[15px] text-espresso sm:px-9">
                            Thank you for making us part of your story.
                        </p>
                        <p className="px-6 pb-6 text-center text-[10.5px] leading-relaxed text-muted-foreground sm:px-9">
                            This is a computer-generated invoice and does not require a physical signature.
                            All prices are inclusive of applicable taxes. · support@vastraliya.com
                        </p>

                        {/* Faint heritage strip along the paper base */}
                        <div className="relative h-[66px] border-t border-border bg-ivory">
                            <svg
                                className="absolute bottom-0 left-0 h-full w-full opacity-50"
                                viewBox="0 0 1440 230"
                                preserveAspectRatio="xMidYMax slice"
                                aria-hidden
                            >
                                <g fill="none" stroke="#C99A45" strokeWidth="2" strokeOpacity=".55">
                                    <path d="M60 230V150h40v-28h44v28h40v80" /><path d="M266 230l9-110h16l9 110z" />
                                    <path d="M660 224v-72h120v72M692 152h56M694 152c-4-24 9-42 26-50 17 8 30 26 26 50zM720 102v-13M612 224l4-90M628 224l-4-90M828 224l-4-90M812 224l4-90" />
                                    <path d="M1044 230l12-100h32l12 100zM1288 230v-58h46v58M1394 230v-58h46v58M1334 230v-38h60v38" />
                                    <path d="M0 218c160-18 320-14 470 0s330 12 480-4 330-14 490 4" />
                                </g>
                            </svg>
                        </div>
                    </div>
                </div>
            </main>

            <div className="no-print"><Footer /></div>

            <style>{`
                @media print {
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { margin: 0; padding: 0; background: white; }
                    .no-print { display: none !important; }
                    [data-sonner-toaster], [role="region"][aria-label^="Notifications"] { display: none !important; }
                    @page { size: A4 portrait; margin: 8mm; }
                    tr { page-break-inside: avoid; }
                    thead { display: table-header-group; }
                }
            `}</style>
        </div>
    );
};

// ═══════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════

const JOURNEY_STEPS = ['Placed', 'Processing', 'Shipped', 'Delivered'];

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
        <div className="flex min-h-screen flex-col bg-ivory">
            <NavBar />
            <main className="flex flex-1 items-center justify-center">
                <div className="flex items-center gap-3 py-24">
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-maroon border-t-transparent" aria-hidden />
                    <p className="text-muted-foreground">Loading order #{orderId}…</p>
                </div>
            </main>
            <Footer />
        </div>
    );

    if (error || !order) return (
        <div className="flex min-h-screen flex-col bg-ivory">
            <NavBar />
            <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
                <AlertCircle className="h-14 w-14 text-sale/70" />
                <h2 className="font-serif text-2xl font-medium text-espresso">{error || "Order Not Found"}</h2>
                <div className="flex gap-3">
                    <Button onClick={() => window.location.reload()} variant="outline" className="rounded-sm border-border text-[11px] font-semibold uppercase tracking-[0.14em]">
                        <RefreshCw className="mr-2 h-4 w-4" />Retry
                    </Button>
                    <Button onClick={() => navigate('/orders')} variant="outline" className="rounded-sm border-border text-[11px] font-semibold uppercase tracking-[0.14em]">
                        <ArrowLeft className="mr-2 h-4 w-4" />Orders
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );

    if (view === 'invoice') {
        return (
            <InvoicePageView
                order={order}
                userProfile={userProfile}
                onBack={() => setView('detail')}
                onEmail={emailInvoice}
            />
        );
    }

    const paymentInfo = getPaymentMethodInfo(order.payment_method);
    const PaymentIcon = paymentInfo.icon;
    const totalItems = order.total_items || order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
    const canCancel = ['pending', 'processing'].includes(order.status.toLowerCase());
    const canReorder = ['delivered', 'cancelled'].includes(order.status.toLowerCase());

    /* Presentation-only derivations */
    const subtotal = (order.items || []).reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0
    );
    const shipping = order.shipping_amount || 0;
    const discount = order.discount_amount || 0;
    const total = Math.max(0, subtotal + shipping - discount);
    const { baseAmount, gstAmount, heads: taxHeads } = orderTaxBreakup(
        order.items || [],
        Math.max(0, subtotal - discount),
        String(order.state || order.shipping_address || ''),
    );

    const isCancelled = order.status.toLowerCase() === 'cancelled';
    const statusKey = order.status.toLowerCase();
    const journeyIdx =
        statusKey === 'delivered' ? 3 :
        statusKey === 'shipped' ? 2 :
        statusKey === 'processing' ? 1 : 0;

    const stepStamp = (keys: string[]): string | null => {
        const u = (order.tracking || []).find(t =>
            keys.some(k => (t.status || '').toLowerCase().includes(k))
        );
        return u?.timestamp ? formatDate(u.timestamp) : null;
    };
    const stepDates: (string | null)[] = [
        order.created_at ? formatDate(order.created_at) : null,
        stepStamp(['processing', 'confirmed']),
        stepStamp(['shipped', 'dispatch']),
        stepStamp(['delivered']),
    ];

    const latestUpdate = order.tracking && order.tracking.length > 0
        ? order.tracking[order.tracking.length - 1]
        : null;

    const codDue =
        paymentInfo.shortLabel === "COD" &&
        order.status !== "cancelled" &&
        (order.payment_status || '').toLowerCase() !== 'paid';

    const phone = (order.phone_number || userProfile?.phone)?.trim();
    const cityLine = [order.city?.trim(), order.state?.trim(), order.pincode?.trim()]
        .filter(Boolean).join(', ');

    const chipMuted =
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-sand/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground';
    const summaryRow = 'flex justify-between py-1.5 text-[13.5px] text-muted-foreground';

    return (
        <div className="flex min-h-screen flex-col bg-ivory">
            <NavBar />

            <main className="flex-1">
                {/* ── ESPRESSO BAND ── */}
                <div className="bg-espresso border-b-[3px] border-gold">
                    <div className="container mx-auto flex flex-col gap-4 px-4 py-7 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.16em] text-ivory/55">
                                Home · My Account · <span className="font-medium text-gold">Order #{order.id}</span>
                            </p>
                            <h1 className="mt-2 font-serif text-3xl font-medium text-ivory">Order #{order.id}</h1>
                        </div>
                        <div className="sm:text-right">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}{order.status}
                            </span>
                            <p className="mt-1.5 text-[12.5px] text-ivory/65">
                                Placed {formatShortDate(order.created_at)} · {totalItems} items · {formatPrice(total)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4">
                    {/* ── TOOLBAR ── */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-6">
                        <button
                            onClick={() => navigate('/account/orders')}
                            className="mr-auto inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-maroon"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to orders
                        </button>
                        <button
                            onClick={() => { setView('invoice'); setTimeout(() => window.print(), 700); }}
                            className={toolbarBtn}
                        >
                            <Printer className="h-3.5 w-3.5" />Print
                        </button>
                        <button onClick={() => setView('invoice')} className={toolbarBtn}>
                            <FileText className="h-3.5 w-3.5" />View Invoice
                        </button>
                        <button
                            onClick={() => { setView('invoice'); setTimeout(() => window.print(), 700); }}
                            className={toolbarBtnMaroon}
                        >
                            <Download className="h-3.5 w-3.5" />Download Invoice
                        </button>
                    </div>

                    <div className="grid items-start gap-6 pb-16 pt-6 lg:grid-cols-[2fr_1fr]">
                        {/* ══════════ LEFT COLUMN ══════════ */}
                        <div className="min-w-0 space-y-6">

                            {/* ── ORDER JOURNEY ── */}
                            <section className="rounded-sm border border-border bg-white">
                                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-ivory px-5 py-3">
                                    <h3 className="font-serif text-base font-medium text-espresso">Order Journey</h3>
                                    {codDue && (
                                        <span className={chipMuted}>COD · {formatPrice(total)} due on delivery</span>
                                    )}
                                </header>
                                <div className="p-5">
                                    {isCancelled ? (
                                        <div className="flex items-center gap-3 rounded-sm border border-sale/30 bg-sale/5 px-4 py-3.5 text-[13px] text-sale">
                                            <XCircle className="h-4 w-4 shrink-0" />
                                            <span>
                                                This order has been cancelled.
                                                <span className="ml-1 capitalize text-sale/80">Payment status: {order.payment_status}.</span>
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex items-start">
                                            {JOURNEY_STEPS.map((step, i) => {
                                                const done = i < journeyIdx;
                                                const now = i === journeyIdx;
                                                return (
                                                    <div key={step} className="relative flex-1 text-center">
                                                        {i > 0 && (
                                                            <span
                                                                aria-hidden
                                                                className={`absolute left-[-50%] top-[7px] h-0.5 w-full ${i <= journeyIdx ? 'bg-gold' : 'bg-sand'}`}
                                                            />
                                                        )}
                                                        <span
                                                            className={`relative z-10 mx-auto block h-[15px] w-[15px] rounded-full border-2 ${
                                                                done
                                                                    ? 'border-gold bg-gold'
                                                                    : now
                                                                        ? `border-gold shadow-[0_0_0_5px_rgba(201,154,69,0.2)] ${journeyIdx === 3 ? 'bg-gold' : 'bg-white'}`
                                                                        : 'border-sand bg-white'
                                                            }`}
                                                        />
                                                        <span className={`mt-2 block text-[10px] uppercase tracking-[0.12em] ${done || now ? 'font-semibold text-espresso' : 'text-muted-foreground'}`}>
                                                            {step}
                                                        </span>
                                                        {(done || now) && stepDates[i] && (
                                                            <span className="mt-0.5 block px-1 text-[10.5px] text-muted-foreground">
                                                                {stepDates[i]}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {latestUpdate && (
                                        <div className="mt-4 flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-border pt-3 text-[12.5px] text-muted-foreground">
                                            <span className="min-w-0">
                                                <b className="font-medium text-espresso">{latestUpdate.status}</b>
                                                {latestUpdate.message ? <> · {latestUpdate.message}</> : null}
                                            </span>
                                            {latestUpdate.timestamp && <span className="shrink-0">{formatDate(latestUpdate.timestamp)}</span>}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* ── ITEMS ── */}
                            {order.items && order.items.length > 0 && (
                                <section className="rounded-sm border border-border bg-white">
                                    <header className="flex items-center justify-between border-b border-border bg-ivory px-5 py-3">
                                        <h3 className="font-serif text-base font-medium text-espresso">Items</h3>
                                        <span className="text-xs text-muted-foreground">{totalItems} items</span>
                                    </header>
                                    <div className="px-5 pb-5 pt-1">
                                        {order.items.map((item, i) => (
                                            <div key={item.id || i} className="flex items-center gap-3.5 border-b border-border py-3.5 last:border-b-0">
                                                <img
                                                    src={getProductImageUrl(item.product_image)}
                                                    alt=""
                                                    className="aspect-[3/4] w-[52px] shrink-0 rounded-[3px] border border-border bg-sand object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-serif text-[14.5px] leading-snug text-espresso">
                                                        {item.product_name || `Product #${item.product_id}`}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        Qty {item.quantity} × {formatPrice(item.price)}
                                                        {item.hsn_code ? ` · HSN ${item.hsn_code}` : ''}
                                                    </p>
                                                </div>
                                                <p className="ml-auto shrink-0 text-sm font-semibold text-espresso">
                                                    {formatPrice(item.price * item.quantity)}
                                                </p>
                                            </div>
                                        ))}
                                        <div className="mt-0.5 flex justify-between border-t border-border pt-3 text-[13px] text-muted-foreground">
                                            <span>Subtotal ({totalItems} items)</span>
                                            <b className="font-semibold text-espresso">{formatPrice(subtotal)}</b>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* ── TRACKING HISTORY ── */}
                            {order.tracking && order.tracking.length > 0 && (
                                <section className="rounded-sm border border-border bg-white">
                                    <header className="flex items-center justify-between border-b border-border bg-ivory px-5 py-3">
                                        <h3 className="font-serif text-base font-medium text-espresso">Tracking History</h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground">{order.tracking.length} updates</span>
                                            <button
                                                onClick={() => setShowTracking(!showTracking)}
                                                className="text-muted-foreground transition-colors hover:text-maroon"
                                                aria-label={showTracking ? 'Collapse tracking history' : 'Expand tracking history'}
                                            >
                                                {showTracking ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </header>
                                    {showTracking && (
                                        <div className="p-5">
                                            {[...order.tracking].reverse().map((t, i, arr) => (
                                                <div key={i} className="relative flex gap-3.5 pb-4 last:pb-0">
                                                    {i < arr.length - 1 && (
                                                        <span aria-hidden className="absolute bottom-0 left-[6px] top-4 w-px bg-border" />
                                                    )}
                                                    <span
                                                        aria-hidden
                                                        className={`relative z-10 mt-0.5 h-[13px] w-[13px] shrink-0 rounded-full border-2 border-white outline outline-1 ${
                                                            i === 0 ? 'bg-gold outline-gold' : 'bg-sand outline-border'
                                                        }`}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className={`text-[13.5px] font-semibold ${i === 0 ? 'text-espresso' : 'text-espresso/75'}`}>
                                                            {t.status}
                                                        </p>
                                                        {t.message && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{t.message}</p>}
                                                        {t.timestamp && (
                                                            <p className="mt-0.5 text-[11px] tracking-[0.04em] text-muted-foreground">
                                                                {formatDate(t.timestamp)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>

                        {/* ══════════ RIGHT COLUMN ══════════ */}
                        <div className="min-w-0 space-y-6">

                            {/* ── PAYMENT SUMMARY ── */}
                            <section className="rounded-sm border border-border bg-white">
                                <header className="border-b border-border bg-ivory px-5 py-3">
                                    <h3 className="font-serif text-base font-medium text-espresso">Payment Summary</h3>
                                </header>
                                <div className="p-5">
                                    <div className={summaryRow}>
                                        <span>Subtotal</span>
                                        <b className="font-medium text-espresso">{formatPrice(subtotal)}</b>
                                    </div>
                                    {discount > 0 && (
                                        <div className={summaryRow}>
                                            <span>Discount</span>
                                            <b className="font-medium text-[#3E6B4F]">− {formatPrice(discount)}</b>
                                        </div>
                                    )}
                                    <div className={summaryRow}>
                                        <span>Base Amount</span>
                                        <b className="font-medium text-espresso">{formatPrice(baseAmount)}</b>
                                    </div>
                                    {taxHeads.map((head) => (
                                        <div key={head.label} className={summaryRow}>
                                            <span>{head.label} (incl.)</span>
                                            <b className="font-medium text-espresso">{formatPrice(head.amount)}</b>
                                        </div>
                                    ))}
                                    <div className={summaryRow}>
                                        <span>Shipping</span>
                                        <b className="font-medium text-espresso">{shipping === 0 ? 'Free' : formatPrice(shipping)}</b>
                                    </div>
                                    <div className="mt-2 flex items-baseline justify-between border-t-2 border-gold pt-2.5">
                                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-espresso">Total</span>
                                        <span className="font-serif text-[23px] font-medium text-maroon">{formatPrice(total)}</span>
                                    </div>

                                    <div className="mt-3.5 flex flex-wrap gap-2">
                                        <span className={chipMuted}>
                                            <PaymentIcon className="h-3 w-3" />{paymentInfo.label}
                                        </span>
                                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${getPayStatusChipClass(order.payment_status)}`}>
                                            {order.payment_status || 'Unpaid'}
                                        </span>
                                    </div>

                                    {(order.transaction_id || order.utr_number) && (
                                        <p className="mt-3 break-all text-[11px] text-muted-foreground">
                                            {order.transaction_id && (
                                                <>Txn <span className="font-mono text-espresso">{order.transaction_id}</span></>
                                            )}
                                            {order.transaction_id && order.utr_number && ' · '}
                                            {order.utr_number && (
                                                <>UTR <span className="font-mono text-espresso">{order.utr_number}</span></>
                                            )}
                                        </p>
                                    )}

                                    <div className="mt-3.5 border-t border-border pt-3.5">
                                        <PaymentBadges />
                                    </div>
                                </div>
                            </section>

                            {/* ── DELIVERY ADDRESS ── */}
                            {order.shipping_address && (
                                <section className="rounded-sm border border-border bg-white">
                                    <header className="border-b border-border bg-ivory px-5 py-3">
                                        <h3 className="font-serif text-base font-medium text-espresso">Delivery Address</h3>
                                    </header>
                                    <div className="p-5 text-[13px] leading-relaxed text-muted-foreground">
                                        <p>
                                            <b className="text-[13.5px] font-semibold text-espresso">
                                                {order.customer_name || userProfile?.name || 'Customer'}
                                            </b>
                                            {phone && <> · {phone}</>}
                                        </p>
                                        <p className="mt-1 whitespace-pre-line">{order.shipping_address}</p>
                                        {cityLine && <p>{cityLine}</p>}
                                    </div>
                                </section>
                            )}

                            {/* ── HELP STRIP ── */}
                            <section className="relative overflow-hidden rounded-sm bg-espresso p-5 text-ivory">
                                <span aria-hidden className="pointer-events-none absolute inset-2 rounded-[2px] border border-gold/35" />
                                <h4 className="font-serif text-[16.5px] font-medium">Need help with this order?</h4>
                                <p className="mt-1 text-xs text-ivory/65">Chat with us on WhatsApp or write to support@vastraliya.com</p>
                                <a
                                    href={`https://wa.me/${FALLBACK_WHATSAPP}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="relative mt-3.5 inline-flex rounded-sm border border-gold px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold/10"
                                >
                                    WhatsApp Support
                                </a>
                            </section>

                            {/* ── ACTIONS ── */}
                            {canCancel && (
                                <div>
                                    <button
                                        onClick={() => setShowCancelDialog(true)}
                                        disabled={canceling}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-sale/40 bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sale transition-colors hover:bg-sale/5 disabled:opacity-60"
                                    >
                                        <XCircle className="h-3.5 w-3.5" />Cancel Order
                                    </button>
                                    <p className="mt-2 text-center text-[11px] text-muted-foreground">
                                        Cancellation available until the order ships
                                    </p>
                                </div>
                            )}
                            {canReorder && (
                                <button
                                    onClick={async () => {
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
                                    }}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-maroon/40 bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-maroon transition-colors hover:bg-maroon/5"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />Reorder
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/products')}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-border bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso transition-colors hover:border-maroon/40 hover:text-maroon"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Cancel Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent className="rounded-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 font-serif font-medium text-sale">
                            <XCircle className="w-5 h-5" />Cancel Order
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure? This cannot be undone.
                            <div className="mt-4 space-y-1 rounded-sm border border-border bg-ivory p-4">
                                <p className="text-sm"><strong className="font-semibold text-espresso">Order:</strong> #{order.id}</p>
                                <p className="text-sm"><strong className="font-semibold text-espresso">Total:</strong> {formatPrice(order.total_amount)}</p>
                                <p className="text-sm"><strong className="font-semibold text-espresso">Payment:</strong> {paymentInfo.label}</p>
                                {order.transaction_id && (
                                    <p className="text-sm break-all"><strong className="font-semibold text-espresso">Transaction:</strong> {order.transaction_id}</p>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={canceling} className="rounded-sm">Keep Order</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} disabled={canceling} className="rounded-sm bg-sale text-white hover:bg-sale/90">
                            {canceling ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Cancelling…</> : 'Yes, Cancel'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default OrderDetailPage;
