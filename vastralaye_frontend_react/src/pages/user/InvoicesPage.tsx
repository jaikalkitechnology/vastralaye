import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { parseApiDate } from "@/lib/apiDate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText, ArrowLeft, Package, Loader2, AlertCircle,
  RefreshCw, Home, Calendar, Printer, Receipt, Download,
  Banknote, CreditCard, Wallet, Shield, CheckCircle,
  Clock, XCircle, MapPin, User, Mail, Phone, ShoppingBag,
  Truck, Share2, Copy, Send, DownloadCloud, Eye,
  ChevronDown, ExternalLink, QrCode, Check,
} from "lucide-react";
import { BASE_URL } from "@/config";
import UserLayout from "@/components/user/UserLayout";
import { toast } from "sonner";
import {
  getOrderInvoice,
  printOrderInvoice, getUserInvoices,
} from "@/api/apihelper";
import * as apihelper from "@/api/apihelper";

// These invoice endpoints are not exported from apihelper yet — resolve them
// dynamically (type-only cast) so the existing runtime fallbacks in the
// handlers below (client-side print / html2pdf / share) keep working as-is.
const downloadInvoicePDF = (apihelper as any).downloadInvoicePDF;
const emailInvoice = (apihelper as any).emailInvoice;
const shareInvoice = (apihelper as any).shareInvoice;
const getInvoiceShareLink = (apihelper as any).getInvoiceShareLink;

import { Invoice } from "@/types/index";

// Add html2pdf for client-side PDF generation if needed
import html2pdf from 'html2pdf.js';

// ═══════════════ HELPERS ═══════════════

const getPaymentInfo = (method: string) => {
  const map: Record<string, any> = {
    cod: { label: "Cash on Delivery", short: "COD", icon: Banknote, bg: "bg-ivory", border: "border-border", text: "text-espresso", badge: "bg-sand/60 text-muted-foreground border-border" },
    card: { label: "Credit/Debit Card", short: "Card", icon: CreditCard, bg: "bg-ivory", border: "border-border", text: "text-espresso", badge: "bg-sand/60 text-muted-foreground border-border" },
    upi: { label: "UPI Payment", short: "UPI", icon: Wallet, bg: "bg-ivory", border: "border-border", text: "text-espresso", badge: "bg-sand/60 text-muted-foreground border-border" },
    netbanking: { label: "Net Banking", short: "NetBanking", icon: Shield, bg: "bg-ivory", border: "border-border", text: "text-espresso", badge: "bg-sand/60 text-muted-foreground border-border" },
  };
  return map[(method || "cod").toLowerCase()] || map["cod"];
};

const getStatusConfig = (status: string) => {
  const map: Record<string, any> = {
    generated: { label: "Generated", icon: FileText, color: "text-muted-foreground", bg: "bg-sand/60", border: "border-border" },
    sent: { label: "Sent", icon: CheckCircle, color: "text-[#3E6B4F]", bg: "bg-[#3E6B4F]/10", border: "border-[#3E6B4F]/25" },
    paid: { label: "Paid", icon: CheckCircle, color: "text-[#3E6B4F]", bg: "bg-[#3E6B4F]/10", border: "border-[#3E6B4F]/25" },
    unpaid: { label: "Unpaid", icon: AlertCircle, color: "text-sale", bg: "bg-sale/10", border: "border-sale/25" },
    cancelled: { label: "Cancelled", icon: XCircle, color: "text-sale", bg: "bg-sale/10", border: "border-sale/25" },
    overdue: { label: "Overdue", icon: Clock, color: "text-[#8A6414]", bg: "bg-gold/15", border: "border-gold/30" },
  };
  return map[(status || "generated").toLowerCase()] || map["generated"];
};

const getImageUrl = (img: string | null): string => {
  if (!img) return "/placeholder.svg";
  try {
    const parsed = typeof img === "string" ? JSON.parse(img) : img;
    const first = Array.isArray(parsed) ? parsed[0] : img;
    if (!first) return "/placeholder.svg";
    return `${BASE_URL.replace("/api/v1", "")}/${first.replace(/^\/+/, "")}`;
  } catch {
    if (typeof img === "string") {
      return `${BASE_URL.replace("/api/v1", "")}/${img.replace(/^\/+/, "")}`;
    }
    return "/placeholder.svg";
  }
};

const formatPrice = (p: number) => `₹${p.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const formatDate = (d: string | null) => {
  if (!d) return "N/A";
  try {
    const parsed = parseApiDate(d);
    if (!parsed) return d;
    return parsed.toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  } catch { return d; }
};

const formatDateTime = (d: string | null) => {
  if (!d) return "N/A";
  try {
    const parsed = parseApiDate(d);
    if (!parsed) return d;
    return parsed.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
};

// Company details shown on the invoice paper (on-screen + print template)
const COMPANY_DETAILS: {
  name: string;
  address: string;
  email: string;
  phone: string;
  gst: string;
  logo?: string;
} = {
  name: "Your Store Name",
  address: "123 Business Street, City, State 123456",
  email: "support@yourstore.com",
  phone: "+91 1234567890",
  gst: "22AAAAA0000A1Z5",
};

// ═══════════════ INVOICE TEMPLATE COMPONENT ═══════════════

// Print-safe brand palette. The print window receives this component's raw
// outerHTML (no Tailwind stylesheet), so every style must be inline.
const P = {
  espresso: "#2B1B12",
  maroon: "#992534",
  gold: "#C29E5C",
  goldDeep: "#8A6414",
  ivory: "#FAF6F0",
  blush: "#F6E8E4",
  border: "#E5DCD1",
  muted: "#6F5D52",
  green: "#3E6B4F",
  sale: "#C62828",
};

const SERIF = "Georgia, 'Times New Roman', serif";

const kStyle: React.CSSProperties = { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: P.muted, margin: 0 };
const vStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: P.espresso, margin: "4px 0 0" };
const thL: React.CSSProperties = { background: P.espresso, color: P.ivory, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", padding: "9px 10px", textAlign: "left" };
const thR: React.CSSProperties = { ...thL, textAlign: "right" };
const thC: React.CSSProperties = { ...thL, textAlign: "center" };
const tdL: React.CSSProperties = { padding: "10px", borderBottom: `1px solid ${P.border}`, verticalAlign: "top", color: P.espresso };
const tdR: React.CSSProperties = { ...tdL, textAlign: "right" };
const tdC: React.CSSProperties = { ...tdL, textAlign: "center" };
const partyBox: React.CSSProperties = { flex: 1, background: P.ivory, border: `1px solid ${P.border}`, borderRadius: 2, padding: 14 };
const partyLabel: React.CSSProperties = { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: P.goldDeep, margin: "0 0 8px" };

interface InvoiceTemplateProps {
  invoice: Invoice;
  companyDetails?: {
    name: string;
    address: string;
    email: string;
    phone: string;
    gst: string;
    logo?: string;
  };
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  companyDetails = COMPANY_DETAILS,
}) => {
  const payInfo = getPaymentInfo(invoice.payment_method);
  const PayIcon = payInfo.icon;

  return (
    <div style={{ background: "#ffffff", color: P.espresso, fontFamily: "Arial, 'Helvetica Neue', sans-serif", fontSize: 12, maxWidth: 800, margin: "0 auto", padding: 36 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
        <div>
          {companyDetails.logo && (
            <img src={companyDetails.logo} alt="Company Logo" style={{ height: 44, marginBottom: 8 }} />
          )}
          <h2 style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 600, color: P.espresso, margin: 0 }}>
            {companyDetails.name}
          </h2>
          <p style={{ fontSize: 11, color: P.muted, lineHeight: 1.65, margin: "9px 0 0" }}>
            {companyDetails.address}<br />
            {companyDetails.email} · {companyDetails.phone}<br />
            GST: {companyDetails.gst}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, letterSpacing: "0.04em", color: P.maroon, margin: 0 }}>TAX INVOICE</h1>
          <p style={{ fontSize: 12.5, color: P.muted, margin: "5px 0 0" }}>{invoice.invoice_number}</p>
        </div>
      </div>

      {/* Double gold rule */}
      <div style={{ borderTop: `1px solid ${P.gold}`, borderBottom: `1px solid ${P.gold}`, height: 4, margin: "22px 0" }} />

      {/* Invoice Details */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
        <div style={{ minWidth: 110 }}>
          <p style={kStyle}>Invoice number</p>
          <p style={vStyle}>{invoice.invoice_number}</p>
        </div>
        <div style={{ minWidth: 110 }}>
          <p style={kStyle}>Invoice date</p>
          <p style={vStyle}>{formatDate(invoice.invoice_date)}</p>
        </div>
        <div style={{ minWidth: 110 }}>
          <p style={kStyle}>Due date</p>
          <p style={vStyle}>{formatDate(invoice.due_date)}</p>
        </div>
        <div style={{ minWidth: 80 }}>
          <p style={kStyle}>Order no.</p>
          <p style={vStyle}>#{invoice.order_id}</p>
        </div>
        <div style={{ minWidth: 110 }}>
          <p style={kStyle}>Order date</p>
          <p style={vStyle}>{formatDate((invoice as any).order_date || invoice.invoice_date)}</p>
        </div>
        <div style={{ minWidth: 110 }}>
          <p style={kStyle}>Payment</p>
          <p style={{ ...vStyle, textTransform: "capitalize" }}>{payInfo.label}</p>
        </div>
      </div>

      {/* Billing & Shipping */}
      <div style={{ display: "flex", gap: 18, margin: "22px 0" }}>
        <div style={partyBox}>
          <p style={partyLabel}>Bill to</p>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: P.espresso, margin: 0 }}>{invoice.customer_name || "Customer"}</p>
          <div style={{ fontSize: 11.5, color: P.muted, lineHeight: 1.65, marginTop: 4 }}>
            {invoice.customer_email && <div>{invoice.customer_email}</div>}
            {invoice.customer_phone && <div>{invoice.customer_phone}</div>}
            {invoice.billing_address && <div style={{ marginTop: 6 }}>{invoice.billing_address}</div>}
          </div>
        </div>
        <div style={partyBox}>
          <p style={partyLabel}>Ship to</p>
          {invoice.shipping_address ? (
            <p style={{ fontSize: 11.5, color: P.muted, lineHeight: 1.65, whiteSpace: "pre-line", margin: 0 }}>{invoice.shipping_address}</p>
          ) : (
            <p style={{ fontSize: 11.5, color: P.muted, margin: 0 }}>Same as billing address</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thL}>#</th>
            <th style={thL}>Item</th>
            <th style={thC}>HSN/SAC</th>
            <th style={thR}>Qty</th>
            <th style={thR}>Unit price</th>
            <th style={thR}>Tax %</th>
            <th style={thR}>Tax amt</th>
            <th style={thR}>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.id || index}>
              <td style={{ ...tdL, color: P.muted }}>{index + 1}</td>
              <td style={tdL}>
                {item.product_name}
                {item.product_sku && (
                  <div style={{ fontSize: 10.5, color: P.muted, marginTop: 2 }}>SKU {item.product_sku}</div>
                )}
              </td>
              <td style={{ ...tdC, color: P.muted }}>{(item as any).hsn_code || "NA"}</td>
              <td style={tdR}>{item.quantity}</td>
              <td style={tdR}>{formatPrice(item.unit_price)}</td>
              <td style={tdR}>{item.tax_rate}%</td>
              <td style={tdR}>{formatPrice(item.tax_amount)}</td>
              <td style={{ ...tdR, fontWeight: 700 }}>{formatPrice(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: 290, marginTop: 16, fontSize: 12.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: P.muted }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: P.espresso }}>{formatPrice(invoice.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: P.muted }}>
            <span>Shipping</span>
            <span style={{ fontWeight: 600, color: P.espresso }}>{invoice.shipping_amount === 0 ? "Free" : formatPrice(invoice.shipping_amount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: P.muted }}>
            <span>Tax (GST)</span>
            <span style={{ fontWeight: 600, color: P.espresso }}>{formatPrice(invoice.tax_amount)}</span>
          </div>
          {invoice.discount_amount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: P.muted }}>
              <span>Discount</span>
              <span style={{ fontWeight: 600, color: P.green }}>-{formatPrice(invoice.discount_amount)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `2px solid ${P.gold}`, marginTop: 8, paddingTop: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: P.espresso }}>Grand total</span>
            <span style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 500, color: P.maroon }}>{formatPrice(invoice.total_amount)}</span>
          </div>
          <div style={{ fontSize: 10, color: P.muted, textAlign: "right", marginTop: 4 }}>
            (Inclusive of all taxes)
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div style={{ background: P.blush, border: `1px solid ${P.border}`, borderRadius: 2, padding: "11px 14px", marginTop: 18 }}>
        <p style={{ fontSize: 11.5, color: P.muted, margin: 0 }}>
          Amount in words — <span style={{ fontWeight: 600, color: P.espresso }}>{numberToWords(invoice.total_amount)} Rupees Only</span>
        </p>
      </div>

      {/* Payment Info */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 24, borderTop: `1px solid ${P.border}`, marginTop: 20, paddingTop: 16 }}>
        <div>
          <p style={{ ...partyLabel, marginBottom: 6 }}>Payment details</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, textTransform: "capitalize" }}>
            <PayIcon size={14} color={P.goldDeep} />
            <span>{payInfo.label}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 12 }}>
            <p style={{ margin: 0 }}>
              Payment Status:{" "}
              <span style={{ fontWeight: 600, color: invoice.payment_status === 'paid' ? P.green : P.sale }}>
                {invoice.payment_status || 'Unpaid'}
              </span>
            </p>
            {invoice.paid_date && (
              <p style={{ fontSize: 10.5, color: P.muted, margin: "4px 0 0" }}>Paid on: {formatDate(invoice.paid_date)}</p>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ ...partyLabel, marginBottom: 6 }}>Bank details</p>
          <p style={{ fontSize: 10.5, color: P.muted, margin: 0, lineHeight: 1.7 }}>
            Bank: XYZ Bank<br />
            Account: 1234567890<br />
            IFSC: XYZB0001234<br />
            Branch: Main Branch
          </p>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ background: P.ivory, border: `1px solid ${P.border}`, borderRadius: 2, padding: "11px 14px", marginTop: 18 }}>
          <p style={{ ...partyLabel, marginBottom: 4 }}>Notes</p>
          <p style={{ fontSize: 11.5, color: P.muted, margin: 0 }}>{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${P.border}`, marginTop: 26, paddingTop: 18, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ display: "inline-block", width: 44, height: 1, background: P.gold }} />
          <span style={{ display: "inline-block", width: 6, height: 6, border: `1px solid ${P.gold}`, transform: "rotate(45deg)" }} />
          <span style={{ display: "inline-block", width: 44, height: 1, background: P.gold }} />
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 14, color: P.espresso, margin: 0 }}>Thank you for your business!</p>
        <p style={{ fontSize: 11, color: P.muted, margin: "6px 0 0" }}>For any queries, contact {companyDetails.email} | {companyDetails.phone}</p>
        <p style={{ fontSize: 10, color: P.muted, margin: "8px 0 0" }}>This is a computer generated invoice, no signature required.</p>
        <p style={{ fontSize: 10, color: P.muted, margin: "4px 0 0" }}>Terms: Goods once sold will not be taken back or exchanged.</p>
        <p style={{ fontSize: 10, color: P.muted, margin: "4px 0 0" }}>Subject to {companyDetails.address.split(',')[1] || 'Local'} jurisdiction.</p>
      </div>

      {/* QR Code for digital verification */}
      <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "center" }}>
          <QrCode size={56} color={P.gold} />
          <p style={{ fontSize: 10, color: P.muted, margin: "4px 0 0" }}>Scan to verify</p>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert number to words
const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  let rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = '';
  if (rupees > 0) {
    if (rupees >= 10000000) {
      result += convertLessThanThousand(Math.floor(rupees / 10000000)) + ' Crore ';
      rupees %= 10000000;
    }
    if (rupees >= 100000) {
      result += convertLessThanThousand(Math.floor(rupees / 100000)) + ' Lakh ';
      rupees %= 100000;
    }
    if (rupees >= 1000) {
      result += convertLessThanThousand(Math.floor(rupees / 1000)) + ' Thousand ';
      rupees %= 1000;
    }
    if (rupees >= 100) {
      result += convertLessThanThousand(Math.floor(rupees / 100)) + ' Hundred ';
      rupees %= 100;
    }
    if (rupees > 0) {
      result += convertLessThanThousand(rupees);
    }
    result = result.trim() + ' Rupees';
  }

  if (paise > 0) {
    result += (result ? ' and ' : '') + convertLessThanThousand(paise) + ' Paise';
  }

  return result || 'Zero';
};

// ═══════════════ MAIN COMPONENT ═══════════════

const InvoicesPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  // ─── Fetch Invoice ───
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("📄 Fetching invoice for order:", orderId);
        const data = await getOrderInvoice(parseInt(orderId));
        console.log("✅ Invoice:", data);
        setInvoice(data);

        // Generate share link if needed
        try {
          const link = await getInvoiceShareLink(data.id);
          setShareLink(link);
        } catch (shareErr) {
          console.log("Share link not available");
        }

        toast.success("Invoice loaded successfully");
      } catch (err: any) {
        console.error("❌ Error:", err);

        let errorMessage = "Failed to load invoice";

        if (err.response) {
          if (err.response.status === 404) {
            errorMessage = "Invoice not found for this order";
          } else if (err.response.status === 401) {
            errorMessage = "Unauthorized. Please login again.";
          } else if (err.response.status === 403) {
            errorMessage = "You don't have permission to view this invoice";
          } else if (err.response.data?.detail) {
            errorMessage = err.response.data.detail;
          }
        } else if (err.request) {
          errorMessage = "No response from server. Please check your connection.";
        } else {
          errorMessage = err.message || "An unexpected error occurred";
        }

        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [orderId]);

  // ─── Handle Print ───
  const handlePrintInvoice = async () => {
    if (!invoice) return;

    try {
      toast.info("Preparing invoice for printing...");

      // Try server-side print first
      try {
        await printOrderInvoice(invoice.order_id);
      } catch (serverErr) {
        // Fallback to client-side print
        if (invoiceRef.current) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Invoice ${invoice.invoice_number}</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
                    @media print {
                      body { margin: 0; padding: 15px; }
                    }
                  </style>
                </head>
                <body>
                  ${invoiceRef.current.outerHTML}
                  <script>
                    window.onload = () => {
                      setTimeout(() => {
                        window.print();
                        window.onafterprint = () => window.close();
                      }, 500);
                    }
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();
          }
        }
      }
    } catch (err: any) {
      console.error("Print error:", err);
      toast.error(err.message || "Failed to print invoice");
    }
  };

  // ─── Handle Download ───
  const handleDownloadPDF = async (format: 'pdf' | 'image' = 'pdf') => {
    if (!invoice) return;

    setGeneratingPDF(true);
    try {
      toast.info(`Generating ${format.toUpperCase()}...`);

      // Try server-side download first
      try {
        await downloadInvoicePDF(invoice.id, format);
        toast.success(`${format.toUpperCase()} downloaded successfully`);
      } catch (serverErr) {
        // Fallback to client-side PDF generation
        if (invoiceRef.current) {
          const element = invoiceRef.current;
          const opt = {
            margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
            filename: `invoice_${invoice.invoice_number}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, letterRendering: true, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
          };

          await html2pdf().set(opt).from(element).save();
          toast.success('Invoice downloaded successfully');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ─── Handle Email ───
  const handleEmailInvoice = async () => {
    if (!invoice) return;

    try {
      toast.info("Sending invoice to your email...");
      await emailInvoice(invoice.id, invoice.customer_email);
      toast.success("Invoice sent to your email");
    } catch (err: any) {
      console.error("Email error:", err);
      toast.error(err.message || "Failed to send invoice");
    }
  };

  // ─── Handle Share ───
  const handleShare = async () => {
    if (!invoice) return;

    try {
      // Try Web Share API first
      if (navigator.share) {
        const shareData = {
          title: `Invoice ${invoice.invoice_number}`,
          text: `Invoice for order #${invoice.order_id}`,
          url: shareLink || window.location.href,
        };

        await navigator.share(shareData);
        toast.success("Shared successfully");
      } else {
        // Fallback to showing share options
        setShowShareOptions(true);
      }
    } catch (err: any) {
      console.error("Share error:", err);
      if (err.name !== 'AbortError') {
        toast.error("Failed to share");
      }
    }
  };

  // ─── Handle Copy Link ───
  const handleCopyLink = () => {
    const link = shareLink || window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  // ─── Handle WhatsApp Share ───
  const handleWhatsAppShare = () => {
    const text = `Invoice ${invoice?.invoice_number} for order #${invoice?.order_id}`;
    const url = shareLink || window.location.href;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(whatsappUrl, '_blank');
  };

  // ─── Handle Retry ───
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    window.location.reload();
  };

  // ═══════ Loading ═══════
  if (loading) {
    return (
      <UserLayout>
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-maroon" />
          <p className="text-[13px] uppercase tracking-[0.12em] text-muted-foreground">Loading invoice...</p>
        </div>
      </UserLayout>
    );
  }

  // ═══════ Error ═══════
  if (error || !invoice) {
    return (
      <UserLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <AlertCircle className="h-14 w-14 text-sale/60" />
          <h2 className="font-serif text-2xl font-medium text-espresso text-center">
            {error || "Invoice Not Found"}
          </h2>
          <p className="text-muted-foreground text-center max-w-md">
            {error === "Invoice not found for this order"
              ? "No invoice has been generated for this order yet. Please check back later."
              : "We couldn't find the invoice you're looking for. It might have been removed or you don't have permission to view it."}
          </p>
          <div className="flex gap-3 mt-4 flex-wrap justify-center">
            <Button onClick={handleRetry} variant="outline" className="h-auto gap-2 rounded-sm border-border px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em]">
              <RefreshCw className="w-3.5 h-3.5" />Retry
            </Button>
            <Button onClick={() => navigate("/orders")} variant="outline" className="h-auto gap-2 rounded-sm border-border px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em]">
              <Package className="w-3.5 h-3.5" />My Orders
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="h-auto gap-2 rounded-sm border-border px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em]">
              <Home className="w-3.5 h-3.5" />Home
            </Button>
          </div>
        </div>
      </UserLayout>
    );
  }

  const payInfo = getPaymentInfo(invoice.payment_method);
  const PayIcon = payInfo.icon;
  const statusCfg = getStatusConfig(invoice.status);
  const StatusIcon = statusCfg.icon;

  return (
    <UserLayout>
      <div className="mx-auto w-full max-w-[1000px] p-4 md:p-6 space-y-5">

        {/* Hidden Invoice Template for PDF Generation */}
        <div ref={invoiceRef} className="hidden">
          <InvoiceTemplate invoice={invoice} />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="mr-auto inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-maroon"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </button>

          <Button
            variant="outline"
            className="h-auto gap-2 rounded-sm border-border px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em]"
            onClick={handlePrintInvoice}
          >
            <Printer className="h-3.5 w-3.5" />Print
          </Button>

          {/* Share Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              className="h-auto gap-2 rounded-sm border-border px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em]"
              onClick={handleShare}
            >
              <Share2 className="h-3.5 w-3.5" />Share
              <ChevronDown className="h-3 w-3" />
            </Button>

            {showShareOptions && (
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-sm border border-border bg-white shadow-md">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      handleEmailInvoice();
                      setShowShareOptions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-espresso hover:bg-ivory rounded-sm flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  <button
                    onClick={() => {
                      handleWhatsAppShare();
                      setShowShareOptions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-espresso hover:bg-ivory rounded-sm flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      handleCopyLink();
                      setShowShareOptions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-espresso hover:bg-ivory rounded-sm flex items-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button
            className="h-auto gap-2 rounded-sm bg-maroon px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ivory hover:bg-terracotta"
            onClick={() => handleDownloadPDF('pdf')}
            disabled={generatingPDF}
          >
            {generatingPDF ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Download PDF
          </Button>
        </div>

        {/* Paper */}
        <div className="max-w-[1000px] rounded-sm border border-border bg-white p-8 md:p-11">

          {/* Invoice head */}
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div>
              <p className="font-serif text-2xl font-semibold text-espresso">
                Vastra<span className="text-maroon">liya</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">
                {COMPANY_DETAILS.address}<br />
                {COMPANY_DETAILS.email} · {COMPANY_DETAILS.phone}<br />
                GSTIN: {COMPANY_DETAILS.gst}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="font-serif text-[26px] font-medium text-maroon tracking-[0.04em]">TAX INVOICE</p>
              <p className="text-[12.5px] text-muted-foreground mt-1">{invoice.invoice_number}</p>
              <p className="mt-2.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                  <StatusIcon className="h-3 w-3" />{statusCfg.label}
                </span>
              </p>
            </div>
          </div>

          {/* Double gold rule */}
          <div className="my-6 border-t border-b border-gold pt-[3px]" />

          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Invoice date</p>
              <p className="text-[13.5px] font-medium text-espresso mt-1">{formatDate(invoice.invoice_date)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Order no.</p>
              <p className="text-[13.5px] font-medium text-espresso mt-1">#{invoice.order_id}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Order date</p>
              <p className="text-[13.5px] font-medium text-espresso mt-1">{formatDate((invoice as any).order_date || invoice.invoice_date)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Payment</p>
              <p className="text-[13.5px] font-medium text-espresso mt-1">{payInfo.label}</p>
            </div>
          </div>

          {/* Bill to / Ship to */}
          <div className="grid md:grid-cols-2 gap-6 my-6">
            <div className="rounded-sm border border-border bg-ivory p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6414] mb-2">Bill to</p>
              <p className="text-[13px] font-semibold text-espresso">{invoice.customer_name || "Customer"}</p>
              <div className="mt-1 space-y-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {invoice.customer_email && <p>{invoice.customer_email}</p>}
                {invoice.customer_phone && <p>{invoice.customer_phone}</p>}
                {invoice.billing_address && <p>{invoice.billing_address}</p>}
              </div>
            </div>
            <div className="rounded-sm border border-border bg-ivory p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6414] mb-2">Ship to</p>
              {invoice.shipping_address ? (
                <>
                  <p className="text-[13px] font-semibold text-espresso">{invoice.customer_name || "Customer"}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground whitespace-pre-line">{invoice.shipping_address}</p>
                </>
              ) : (
                <p className="text-[12.5px] text-muted-foreground">Same as billing address</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr>
                  <th className="bg-espresso text-ivory text-[10px] font-semibold uppercase tracking-[0.16em] px-3 py-2.5 text-left">#</th>
                  <th className="bg-espresso text-ivory text-[10px] font-semibold uppercase tracking-[0.16em] px-3 py-2.5 text-left">Item</th>
                  <th className="bg-espresso text-ivory text-[10px] font-semibold uppercase tracking-[0.16em] px-3 py-2.5 text-right">Qty</th>
                  <th className="bg-espresso text-ivory text-[10px] font-semibold uppercase tracking-[0.16em] px-3 py-2.5 text-right">Unit price</th>
                  <th className="bg-espresso text-ivory text-[10px] font-semibold uppercase tracking-[0.16em] px-3 py-2.5 text-right">Tax</th>
                  <th className="bg-espresso text-ivory text-[10px] font-semibold uppercase tracking-[0.16em] px-3 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-3 py-3 border-b border-border text-muted-foreground">{index + 1}</td>
                    <td className="px-3 py-3 border-b border-border">
                      <p className="font-medium text-espresso">{item.product_name}</p>
                      {item.product_sku && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">SKU {item.product_sku}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 border-b border-border text-right">{item.quantity}</td>
                    <td className="px-3 py-3 border-b border-border text-right">{formatPrice(item.unit_price)}</td>
                    <td className="px-3 py-3 border-b border-border text-right text-muted-foreground">
                      {formatPrice(item.tax_amount)}
                      <span className="block text-[11px] text-muted-foreground/80">({item.tax_rate}%)</span>
                    </td>
                    <td className="px-3 py-3 border-b border-border text-right font-semibold text-espresso">{formatPrice(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="ml-auto w-full max-w-[300px] mt-5 text-[13.5px]">
            <div className="flex justify-between py-1.5 text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-espresso">{formatPrice(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-muted-foreground">
              <span>Shipping</span>
              <span className="font-medium text-espresso">
                {invoice.shipping_amount === 0 ? "Free" : formatPrice(invoice.shipping_amount)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 text-muted-foreground">
              <span>Tax (GST {invoice.tax_rate}%)</span>
              <span className="font-medium text-espresso">{formatPrice(invoice.tax_amount)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between py-1.5 text-muted-foreground">
                <span>Discount</span>
                <span className="font-medium text-[#3E6B4F]">-{formatPrice(invoice.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline border-t-2 border-gold mt-2 pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-espresso">Grand total</span>
              <span className="font-serif text-[22px] font-medium text-maroon">{formatPrice(invoice.total_amount)}</span>
            </div>
            <p className="text-[10.5px] text-muted-foreground text-right mt-1">(Inclusive of all taxes)</p>
          </div>

          {/* Amount in words */}
          <div className="rounded-sm border border-border bg-blush/60 px-4 py-3 mt-5 text-[12.5px] text-muted-foreground">
            Amount in words —{" "}
            <span className="font-medium text-espresso">{numberToWords(invoice.total_amount)} Rupees Only</span>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="rounded-sm border border-border bg-ivory px-4 py-3 mt-4 text-[12.5px] text-muted-foreground">
              <span className="font-semibold uppercase tracking-[0.14em] text-[10px] text-[#8A6414] mr-2">Notes</span>
              {invoice.notes}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-border mt-7 pt-5 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-11 bg-gold" />
              <span className="h-1.5 w-1.5 rotate-45 border border-gold" />
              <span className="h-px w-11 bg-gold" />
            </div>
            <p className="font-serif text-base text-espresso mt-3">Thank you for making us part of your story.</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              This is a computer-generated invoice and does not require a signature. · For help, write to {COMPANY_DETAILS.email}
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default InvoicesPage;
