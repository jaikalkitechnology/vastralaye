import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText, ArrowLeft, Package, Loader2, AlertCircle,
  RefreshCw, Home, Calendar, Printer, Receipt, Download,
  Banknote, CreditCard, Wallet, Shield, CheckCircle,
  Clock, XCircle, MapPin, User, Mail, Phone, ShoppingBag,
  Truck, Eye, DownloadCloud,
} from "lucide-react";
import { BASE_URL } from "@/config";
import UserLayout from "@/components/user/UserLayout";
import { toast } from "sonner";
// @ts-ignore
import html2pdf from "html2pdf.js";

// ═══════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════

interface InvoiceItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku?: string;
  product_image?: string | null;
  product_description?: string;
  hsn_code?: string; // ✅ Added HSN Code field
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  total: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  user_id: number;
  status: string;
  payment_status: string;
  payment_method: string;
  invoice_date: string | null;
  due_date: string | null;
  order_date?: string | null;
  paid_date?: string | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  billing_address?: string;
  shipping_address?: string;
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  total_products: number;
  total_items: number;
  items: InvoiceItem[];
}

// ═══════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════

const getAuthToken = (): string =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("token") ||
  localStorage.getItem("userToken") || "";

const getPaymentInfo = (method: string) => {
  const map: Record<string, any> = {
    cod: {
      label: "Cash on Delivery", short: "COD", icon: Banknote,
      gradient: "from-green-500 to-emerald-600",
      bg: "from-green-50 to-emerald-50",
      border: "border-green-200", text: "text-green-700",
      badge: "bg-green-100 text-green-800 border-green-200",
      inlineBg: "#dcfce7", inlineColor: "#15803d",
    },
    card: {
      label: "Credit/Debit Card", short: "Card", icon: CreditCard,
      gradient: "from-blue-500 to-indigo-600",
      bg: "from-blue-50 to-indigo-50",
      border: "border-blue-200", text: "text-blue-700",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      inlineBg: "#dbeafe", inlineColor: "#1d4ed8",
    },
    upi: {
      label: "UPI Payment", short: "UPI", icon: Wallet,
      gradient: "from-purple-500 to-violet-600",
      bg: "from-purple-50 to-violet-50",
      border: "border-purple-200", text: "text-purple-700",
      badge: "bg-purple-100 text-purple-800 border-purple-200",
      inlineBg: "#f3e8ff", inlineColor: "#7e22ce",
    },
    netbanking: {
      label: "Net Banking", short: "NetBanking", icon: Shield,
      gradient: "from-orange-500 to-amber-600",
      bg: "from-orange-50 to-amber-50",
      border: "border-orange-200", text: "text-orange-700",
      badge: "bg-orange-100 text-orange-800 border-orange-200",
      inlineBg: "#ffedd5", inlineColor: "#c2410c",
    },
  };
  return map[(method || "cod").toLowerCase()] || map["cod"];
};

const getStatusConfig = (status: string) => {
  const map: Record<string, any> = {
    generated: {
      label: "Generated", icon: FileText,
      color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200",
      inlineBg: "#dbeafe", inlineColor: "#1d4ed8", dot: "#2563eb",
    },
    sent: {
      label: "Sent", icon: CheckCircle,
      color: "text-green-700", bg: "bg-green-100", border: "border-green-200",
      inlineBg: "#dcfce7", inlineColor: "#15803d", dot: "#16a34a",
    },
    paid: {
      label: "Paid", icon: CheckCircle,
      color: "text-green-700", bg: "bg-green-100", border: "border-green-200",
      inlineBg: "#dcfce7", inlineColor: "#15803d", dot: "#16a34a",
    },
    unpaid: {
      label: "Unpaid", icon: AlertCircle,
      color: "text-red-700", bg: "bg-red-100", border: "border-red-200",
      inlineBg: "#fee2e2", inlineColor: "#b91c1c", dot: "#dc2626",
    },
    cancelled: {
      label: "Cancelled", icon: XCircle,
      color: "text-red-700", bg: "bg-red-100", border: "border-red-200",
      inlineBg: "#fee2e2", inlineColor: "#b91c1c", dot: "#dc2626",
    },
    overdue: {
      label: "Overdue", icon: Clock,
      color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200",
      inlineBg: "#ffedd5", inlineColor: "#c2410c", dot: "#ea580c",
    },
  };
  return map[(status || "generated").toLowerCase()] || map["generated"];
};

const getImageUrl = (img: string | null | undefined): string => {
  if (!img) return "/placeholder.svg";
  try {
    const parsed = typeof img === "string" ? JSON.parse(img) : img;
    const first = Array.isArray(parsed) ? parsed[0] : img;
    if (!first) return "/placeholder.svg";
    return `${BASE_URL.replace("/api/v1", "")}/${first.replace(/^\/+/, "")}`;
  } catch {
    if (typeof img === "string" && img.startsWith("http")) return img;
    if (typeof img === "string") {
      return `${BASE_URL.replace("/api/v1", "")}/${img.replace(/^\/+/, "")}`;
    }
    return "/placeholder.svg";
  }
};

const formatPrice = (p: number) =>
  `₹${(p || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const formatDate = (d: string | null | undefined) => {
  if (!d) return "N/A";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      month: "long", day: "numeric", year: "numeric",
    });
  } catch { return d; }
};

// ── Number to words ──
const numberToWords = (num: number): string => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety"];

  const cvt = (n: number): string => {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + cvt(n % 100) : "");
  };

  let r = Math.floor(num);
  const paise = Math.round((num - r) * 100);
  let result = "";
  if (r >= 10000000) { result += cvt(Math.floor(r / 10000000)) + " Crore "; r %= 10000000; }
  if (r >= 100000)   { result += cvt(Math.floor(r / 100000))   + " Lakh ";  r %= 100000; }
  if (r >= 1000)     { result += cvt(Math.floor(r / 1000))     + " Thousand "; r %= 1000; }
  if (r > 0)         { result += cvt(r); }
  result = result.trim() + (result ? " Rupees" : "");
  if (paise > 0) result += " and " + cvt(paise) + " Paise";
  return result || "Zero";
};

// ── Convert images → base64 before PDF export ──
const convertImagesToBase64 = async (container: HTMLElement) => {
  const imgs = container.querySelectorAll("img");
  const originals: string[] = [];

  await Promise.all(
    Array.from(imgs).map(async (img, idx) => {
      originals[idx] = img.src;
      if (!img.src || img.src.includes("placeholder")) return;
      try {
        const res  = await fetch(img.src, { mode: "cors" });
        const blob = await res.blob();
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = () => { img.src = reader.result as string; resolve(); };
          reader.readAsDataURL(blob);
        });
      } catch { img.src = ""; }
    }),
  );

  return () => { Array.from(imgs).forEach((img, idx) => { img.src = originals[idx]; }); };
};

// ═══════════════════════════════════════════════
//  INVOICE TEMPLATE  (inline-styled, PDF-safe)
// ═══════════════════════════════════════════════

const InvoiceTemplate = React.forwardRef<HTMLDivElement, { invoice: Invoice }>(
  ({ invoice }, ref) => {
    const payInfo   = getPaymentInfo(invoice.payment_method);
    const statusCfg = getStatusConfig(invoice.status);
    const paySts    = getStatusConfig(invoice.payment_status || "unpaid");

    const subtotal = invoice.subtotal        || 0;
    const tax      = invoice.tax_amount      || 0;
    const shipping = invoice.shipping_amount || 0;
    const discount = invoice.discount_amount || 0;
    const total    = invoice.total_amount    || 0;

    return (
      <div
        ref={ref}
        style={{
          backgroundColor: "#ffffff",
          fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
          fontSize: "13px",
          color: "#1f2937",
          width: "100%",
        }}
      >
        {/* ── GREEN HEADER ── */}
        <div style={{
          background: "linear-gradient(135deg,#16a34a 0%,#15803d 100%)",
          padding: "32px 40px",
          color: "#ffffff",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", gap: "24px", flexWrap: "wrap",
          }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                <div style={{
                  width: "46px", height: "46px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", fontWeight: "900",
                }}>S</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "800" }}>MizorPay Mart</div>
                  <div style={{ fontSize: "12px", color: "#bbf7d0" }}>Fresh & Organic</div>
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#dcfce7", lineHeight: "1.9" }}>
                <div>123 Business Street, City, State — 123456</div>
                <div>GST: 22AAAAA0000A1Z5</div>
                <div>support@mizorpaymart.com • +91 1234567890</div>
              </div>
            </div>

            {/* Invoice meta */}
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: "11px", color: "#86efac",
                textTransform: "uppercase", letterSpacing: "3px", marginBottom: "6px",
              }}>Tax Invoice</div>
              <div style={{ fontSize: "26px", fontWeight: "900" }}>
                {invoice.invoice_number}
              </div>
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#dcfce7", lineHeight: "2" }}>
                <div>Date: {formatDate(invoice.invoice_date)}</div>
                <div>Due: {formatDate(invoice.due_date)}</div>
                <div>Order: #{invoice.order_id}</div>
              </div>
              {/* Status pill */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "999px", padding: "4px 14px",
                marginTop: "10px", fontSize: "12px", fontWeight: "600",
              }}>
                <span style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  backgroundColor: "#fff", display: "inline-block",
                }} />
                {statusCfg.label}
              </div>
            </div>
          </div>
        </div>

        {/* ── BILL TO / SHIP TO / META ── */}
        <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap" }}>
          {/* Bill To */}
          <div style={{ flex: "1 1 200px", padding: "22px 32px", borderRight: "1px solid #f3f4f6" }}>
            <div style={{
              fontSize: "10px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "2px", color: "#9ca3af", marginBottom: "10px",
            }}>Bill To</div>
            <div style={{ lineHeight: "1.9" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#111827" }}>
                {invoice.customer_name || "Customer"}
              </div>
              {invoice.customer_email && (
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{invoice.customer_email}</div>
              )}
              {invoice.customer_phone && (
                <div style={{ fontSize: "12px", color: "#6b7280" }}>{invoice.customer_phone}</div>
              )}
              {invoice.billing_address && (
                <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                  {invoice.billing_address}
                </div>
              )}
            </div>
          </div>

          {/* Ship To */}
          <div style={{ flex: "1 1 200px", padding: "22px 32px", borderRight: "1px solid #f3f4f6" }}>
            <div style={{
              fontSize: "10px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "2px", color: "#9ca3af", marginBottom: "10px",
            }}>Ship To</div>
            {invoice.shipping_address ? (
              <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.9", whiteSpace: "pre-line" }}>
                {invoice.shipping_address}
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>Same as billing address</div>
            )}
          </div>

          {/* Invoice Info */}
          <div style={{ flex: "1 1 160px", padding: "22px 32px" }}>
            <div style={{
              fontSize: "10px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "2px", color: "#9ca3af", marginBottom: "10px",
            }}>Invoice Info</div>
            {[
              { label: "Invoice #", value: invoice.invoice_number },
              { label: "Order #",   value: `#${invoice.order_id}` },
              { label: "Date",      value: formatDate(invoice.invoice_date) },
              { label: "Due",       value: formatDate(invoice.due_date) },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: "6px", fontSize: "12px",
              }}>
                <span style={{ color: "#9ca3af" }}>{label}</span>
                <span style={{ fontWeight: "600", color: "#374151" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ITEMS TABLE ── */}
        <div style={{ padding: "24px 32px" }}>
          <div style={{
            fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
            letterSpacing: "1.5px", color: "#6b7280", marginBottom: "12px",
          }}>
            Order Items — {invoice.items?.length || 0} product{invoice.items?.length !== 1 ? "s" : ""}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{
                backgroundColor: "#f9fafb",
                borderTop: "1px solid #e5e7eb",
                borderBottom: "1px solid #e5e7eb",
              }}>
                {[
                  { label: "#",           align: "left",   width: "28px"  },
                  { label: "Product",     align: "left",   width: "auto"  },
                  { label: "HSN/SAC",     align: "center", width: "70px"  }, // ✅ HSN Column
                  { label: "Qty",         align: "center", width: "44px"  },
                  { label: "Unit Price",  align: "right",  width: "88px"  },
                  { label: "Tax %",       align: "right",  width: "55px"  },
                  { label: "Tax Amt",     align: "right",  width: "78px"  },
                  { label: "Total",       align: "right",  width: "88px"  },
                ].map((col) => (
                  <th key={col.label} style={{
                    padding: "10px 10px",
                    textAlign: col.align as any,
                    fontWeight: "600", color: "#6b7280",
                    fontSize: "10px", textTransform: "uppercase",
                    letterSpacing: "0.8px", width: col.width,
                  }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, i) => (
                  <tr
                    key={item.id || i}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa",
                    }}
                  >
                    {/* # */}
                    <td style={{ padding: "14px 10px", color: "#9ca3af", fontSize: "12px" }}>{i + 1}</td>

                    {/* Product — image + full name */}
                    <td style={{ padding: "14px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "46px", height: "46px", flexShrink: 0,
                          border: "1px solid #e5e7eb", borderRadius: "8px",
                          overflow: "hidden", backgroundColor: "#f9fafb",
                        }}>
                          <img
                            src={getImageUrl(item.product_image)}
                            alt={item.product_name || ""}
                            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontWeight: "600", color: "#111827",
                            fontSize: "13px", lineHeight: "1.5",
                            wordBreak: "break-word", whiteSpace: "normal",
                          }}>
                            {item.product_name || `Product #${item.product_id}`}
                          </div>
                          {item.product_sku && (
                            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                              SKU: {item.product_sku}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* ✅ HSN Code Cell */}
                    <td style={{ padding: "14px 10px", textAlign: "center", color: "#6b7280", fontSize: "12px" }}>
                      {item.hsn_code || "—"}
                    </td>

                    <td style={{ padding: "14px 10px", textAlign: "center", fontWeight: "600", color: "#374151" }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: "14px 10px", textAlign: "right", color: "#374151" }}>
                      {formatPrice(item.unit_price)}
                    </td>
                    <td style={{ padding: "14px 10px", textAlign: "right", color: "#6b7280" }}>
                      {item.tax_rate}%
                    </td>
                    <td style={{ padding: "14px 10px", textAlign: "right", color: "#6b7280" }}>
                      {formatPrice(item.tax_amount)}
                    </td>
                    <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: "700", color: "#111827" }}>
                      {formatPrice(item.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── TOTALS + PAYMENT ── */}
        <div style={{
          padding: "0 32px 32px",
          display: "flex", justifyContent: "space-between",
          gap: "16px", flexWrap: "wrap", alignItems: "flex-start",
        }}>

          {/* Left: Amount in Words + Payment */}
          <div style={{ flex: "1 1 280px" }}>
            {/* Amount in Words */}
            <div style={{
              padding: "14px 16px", backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb", borderRadius: "10px", marginBottom: "16px",
            }}>
              <div style={{
                fontSize: "10px", color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px",
              }}>Amount in Words</div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", lineHeight: "1.5" }}>
                {numberToWords(total)} Rupees Only
              </div>
            </div>

            {/* Payment Details box */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{
                backgroundColor: "#f9fafb", padding: "10px 16px",
                borderBottom: "1px solid #e5e7eb",
              }}>
                <span style={{
                  fontSize: "10px", fontWeight: "700", color: "#6b7280",
                  textTransform: "uppercase", letterSpacing: "1px",
                }}>Payment Details</span>
              </div>
              <div style={{ padding: "16px" }}>

                {/* Method ✅ */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{
                    fontSize: "10px", color: "#9ca3af",
                    textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px",
                  }}>Method</div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "4px 12px", borderRadius: "6px",
                    fontSize: "12px", fontWeight: "600",
                    backgroundColor: getPaymentInfo(invoice.payment_method).inlineBg,
                    color: getPaymentInfo(invoice.payment_method).inlineColor,
                  }}>
                    {getPaymentInfo(invoice.payment_method).label}
                  </div>
                </div>

                {/* Payment Status ✅ inline style */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{
                    fontSize: "10px", color: "#9ca3af",
                    textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px",
                  }}>Payment Status</div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "5px 12px", borderRadius: "999px",
                    fontSize: "12px", fontWeight: "700", textTransform: "capitalize",
                    backgroundColor: paySts.inlineBg,
                    color: paySts.inlineColor,
                    border: `1px solid ${paySts.inlineColor}40`,
                  }}>
                    <span style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      backgroundColor: paySts.dot,
                      display: "inline-block", flexShrink: 0,
                    }} />
                    {invoice.payment_status || "Unpaid"}
                  </div>
                </div>

                {/* Invoice Status ✅ inline style */}
                <div style={{ marginBottom: invoice.paid_date ? "12px" : "0" }}>
                  <div style={{
                    fontSize: "10px", color: "#9ca3af",
                    textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px",
                  }}>Invoice Status</div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "5px 12px", borderRadius: "999px",
                    fontSize: "12px", fontWeight: "700", textTransform: "capitalize",
                    backgroundColor: statusCfg.inlineBg,
                    color: statusCfg.inlineColor,
                    border: `1px solid ${statusCfg.inlineColor}40`,
                  }}>
                    <span style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      backgroundColor: statusCfg.dot,
                      display: "inline-block", flexShrink: 0,
                    }} />
                    {statusCfg.label}
                  </div>
                </div>

                {invoice.paid_date && (
                  <div>
                    <div style={{
                      fontSize: "10px", color: "#9ca3af",
                      textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px",
                    }}>Paid On</div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                      {formatDate(invoice.paid_date)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Order Summary ✅ */}
          <div style={{ width: "260px", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{
              backgroundColor: "#f9fafb", padding: "10px 16px",
              borderBottom: "1px solid #e5e7eb",
            }}>
              <span style={{
                fontSize: "10px", fontWeight: "700", color: "#6b7280",
                textTransform: "uppercase", letterSpacing: "1px",
              }}>Order Summary</span>
            </div>
            <div style={{ padding: "16px" }}>
              {/* Subtotal */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                <span style={{ color: "#6b7280" }}>Subtotal</span>
                <span style={{ fontWeight: "500", color: "#374151" }}>{formatPrice(subtotal)}</span>
              </div>
              {/* Shipping */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                <span style={{ color: "#6b7280" }}>Shipping</span>
                <span style={{ fontWeight: "600", color: shipping === 0 ? "#16a34a" : "#374151" }}>
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
              {/* GST */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                <span style={{ color: "#6b7280" }}>GST ({invoice.tax_rate || 18}%)</span>
                <span style={{ fontWeight: "500", color: "#374151" }}>{formatPrice(tax)}</span>
              </div>
              {/* Discount */}
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                  <span style={{ color: "#6b7280" }}>Discount</span>
                  <span style={{ fontWeight: "600", color: "#16a34a" }}>-{formatPrice(discount)}</span>
                </div>
              )}
              {/* Total */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                paddingTop: "12px", borderTop: "2px solid #e5e7eb",
              }}>
                <span style={{ fontWeight: "700", fontSize: "15px", color: "#111827" }}>Total</span>
                <span style={{ fontWeight: "900", fontSize: "20px", color: "#16a34a" }}>
                  {formatPrice(total)}
                </span>
              </div>
              <div style={{ textAlign: "right", fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                (Inclusive of all taxes)
              </div>
            </div>
          </div>
        </div>

        {/* ── NOTES ── */}
        {invoice.notes && (
          <div style={{ padding: "0 32px 24px" }}>
            <div style={{
              padding: "14px 16px", backgroundColor: "#fffbeb",
              border: "1px solid #fde68a", borderRadius: "10px",
            }}>
              <div style={{
                fontSize: "11px", fontWeight: "700", color: "#92400e",
                marginBottom: "4px", textTransform: "uppercase",
              }}>Notes</div>
              <div style={{ fontSize: "13px", color: "#78350f" }}>{invoice.notes}</div>
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{
          backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb",
          padding: "24px 32px",
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", gap: "16px", flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontWeight: "700", color: "#374151", fontSize: "14px", marginBottom: "4px" }}>
              Thank you for your business! 🎉
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.8" }}>
              <div>Email: <span style={{ color: "#16a34a" }}>support@mizorpaymart.com</span></div>
              <div>Phone: <span style={{ color: "#16a34a" }}>+91 1234567890</span></div>
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af", textAlign: "right", lineHeight: "1.9" }}>
            <div>Computer-generated invoice. No signature required.</div>
            <div>All prices inclusive of applicable taxes.</div>
            <div>Goods once sold will not be taken back or exchanged.</div>
          </div>
        </div>

        {/* ── COLOUR STRIP ── */}
        <div style={{ height: "6px", background: "linear-gradient(90deg,#16a34a,#4ade80,#16a34a)" }} />
      </div>
    );
  },
);

InvoiceTemplate.displayName = "InvoiceTemplate";

// ═══════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════

const InvoicesPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate    = useNavigate();
  const invoiceRef  = useRef<HTMLDivElement>(null);

  const [invoice,       setInvoice]       = useState<Invoice | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // ── Fetch invoice via direct fetch ──
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!orderId) { setError("No order ID provided"); setLoading(false); return; }

      const token = getAuthToken();
      if (!token) { navigate("/login"); return; }

      setLoading(true);
      setError(null);

      try {
        // ── Primary: get invoice by order ID ──
        const res = await fetch(
          `${BASE_URL}/users/user/orders/${orderId}/invoice`,
          {
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          },
        );

        if (res.status === 401) { toast.error("Session expired"); navigate("/login"); return; }

        if (res.status === 404) {
          // ── Fallback: build invoice from order data ──
          const orderRes = await fetch(
            `${BASE_URL}/users/user/orders/${orderId}`,
            {
              headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
              },
            },
          );

          if (!orderRes.ok) throw new Error("Order not found");

          const orderData  = await orderRes.json();
          const raw        = orderData.order || orderData.data || orderData;

          // Build a synthetic invoice from order
          const items: InvoiceItem[] = (raw.items || []).map((item: any, i: number) => {
            const price    = Number(item.price || 0);
            const qty      = item.quantity || 1;
            const taxRate  = 18;
            const baseAmt  = (price * qty) / 1.18;
            const taxAmt   = price * qty - baseAmt;
            
            return {
              id:                  item.id || i,
              product_id:          item.product_id,
              product_name:        item.product_name || item.product?.name || `Product #${item.product_id}`,
              product_sku:         item.product_sku  || item.product?.sku  || undefined,
              product_image:       item.product_images || item.product?.images || null,
              product_description: item.product_description || undefined,
              
              // ✅ Correct HSN fallback
              hsn_code:            item.hsn_code || item.product?.hsn_code || undefined,
              
              quantity:            qty,
              unit_price:          price,
              tax_rate:            taxRate,
              tax_amount:          parseFloat(taxAmt.toFixed(2)),
              subtotal:            parseFloat(baseAmt.toFixed(2)),
              total:               price * qty,
            };
          });

          const subtotal     = items.reduce((s, i) => s + i.subtotal, 0);
          const taxAmount    = items.reduce((s, i) => s + i.tax_amount, 0);
          const totalAmount  = Number(raw.total_amount || 0);

          const synthetic: Invoice = {
            id:               0,
            invoice_number:   `INV-${String(raw.id).padStart(6, "0")}`,
            order_id:         raw.id,
            user_id:          raw.user_id,
            status:           "generated",
            payment_status:   raw.payment_status || "unpaid",
            payment_method:   raw.payment_method || "cod",
            invoice_date:     raw.created_at,
            due_date:         raw.created_at,
            order_date:       raw.created_at,
            paid_date:        raw.payment_status === "paid" ? raw.updated_at : null,
            customer_name:    raw.user?.name   || raw.customer_name || "Customer",
            customer_email:   raw.user?.email  || raw.customer_email || undefined,
            customer_phone:   raw.user?.phone  || raw.customer_phone || undefined,
            billing_address:  raw.shipping_address || undefined,
            shipping_address: raw.shipping_address || undefined,
            subtotal:         parseFloat(subtotal.toFixed(2)),
            tax_amount:       parseFloat(taxAmount.toFixed(2)),
            tax_rate:         18,
            shipping_amount:  0,
            discount_amount:  0,
            total_amount:     totalAmount,
            notes:            undefined,
            total_products:   items.length,
            total_items:      items.reduce((s, i) => s + i.quantity, 0),
            items,
          };

          setInvoice(synthetic);
          toast.success("Invoice loaded from order data");
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Error ${res.status}`);
        }

        const data = await res.json();
        const inv  = data.invoice || data.data || data;
        setInvoice(inv);
        toast.success("Invoice loaded");

      } catch (err: any) {
        console.error("❌ Invoice fetch error:", err);
        const msg = err.message || "Failed to load invoice";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [orderId, navigate]);

  // ── PDF Download ──
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !invoice) return;
    setGeneratingPDF(true);

    let restore: (() => void) | undefined;
    try {
      restore = await convertImagesToBase64(invoiceRef.current);

      await html2pdf()
        .set({
          margin:      [0.4, 0.4, 0.4, 0.4],
          filename:    `Invoice_${invoice.invoice_number}.pdf`,
          image:       { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2, useCORS: true, allowTaint: true,
            letterRendering: true, backgroundColor: "#ffffff",
          },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        })
        .from(invoiceRef.current)
        .save();

      toast.success("Invoice downloaded!");
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      restore?.();
      setGeneratingPDF(false);
    }
  };

  // ── Print ──
  const handlePrint = () => window.print();

  // ════ Loading ════
  if (loading) return (
    <UserLayout>
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#559F4B]" />
        <p className="text-gray-600">Loading invoice…</p>
      </div>
    </UserLayout>
  );

  // ════ Error ════
  if (error || !invoice) return (
    <UserLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="bg-red-50 rounded-full p-4">
          <AlertCircle className="h-16 w-16 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 text-center">
          {error || "Invoice Not Found"}
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          {error === "Invoice not found for this order"
            ? "No invoice has been generated for this order yet."
            : "We couldn't load the invoice. Please try again."}
        </p>
        <div className="flex gap-3 mt-4 flex-wrap justify-center">
          <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />Retry
          </Button>
          <Button onClick={() => navigate(`/orders/${orderId}`)} variant="outline" className="gap-2">
            <Package className="w-4 h-4" />View Order
          </Button>
          <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
            <Home className="w-4 h-4" />Home
          </Button>
        </div>
      </div>
    </UserLayout>
  );

  const payInfo    = getPaymentInfo(invoice.payment_method);
  const PayIcon    = payInfo.icon;
  const statusCfg  = getStatusConfig(invoice.status);
  const StatusIcon = statusCfg.icon;

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        {/* ══ TOOLBAR ══ */}
        <div className="bg-gradient-to-r from-[#559F4B]/10 via-[#E1783E]/5 to-[#559F4B]/10
                        rounded-2xl p-4 sm:p-6 border border-[#559F4B]/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="outline" size="icon"
                onClick={() => navigate(`/orders/${orderId}`)}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl border-[#559F4B]/30 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-[#559F4B]" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate
                               bg-gradient-to-r from-[#559F4B] to-[#E1783E]
                               bg-clip-text text-transparent">
                  {invoice.invoice_number}
                </h1>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mt-1 flex-wrap">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>{formatDate(invoice.invoice_date)}</span>
                  <span className="text-gray-400">•</span>
                  <span>Order #{invoice.order_id}</span>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline"
                className={`${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} px-3 py-1.5 rounded-full`}>
                <StatusIcon className="w-3 h-3 mr-1" />{statusCfg.label}
              </Badge>
              <Badge variant="outline"
                className={`${payInfo.badge} px-3 py-1 rounded-full text-xs`}>
                <PayIcon className="w-3 h-3 mr-1" />{payInfo.short}
              </Badge>

              <Button size="sm" variant="outline"
                className="border-[#559F4B] text-[#559F4B]"
                onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Print</span>
              </Button>

              <Button
                size="sm"
                className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] text-white hover:opacity-90"
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
              >
                {generatingPDF
                  ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  : <Download className="w-4 h-4 mr-1" />
                }
                <span className="hidden sm:inline">Download PDF</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ══ INVOICE PREVIEW CARD ══ */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden
                        print:shadow-none print:rounded-none">

          {/* Preview header bar (hidden on print) */}
          <div className="no-print flex flex-col sm:flex-row items-start sm:items-center
                          justify-between px-5 py-3 bg-gray-50 border-b border-gray-200 gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Eye className="w-4 h-4 text-[#559F4B]" />
              <span className="font-medium">Invoice Preview</span>
              <span className="text-gray-400">—</span>
              <span className="text-gray-400">
                {invoice.items?.length || 0} product{invoice.items?.length !== 1 ? "s" : ""}
                {" · "}
                {invoice.items?.reduce((s, i) => s + i.quantity, 0)} item
                {invoice.items?.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                           bg-[#559F4B] hover:bg-[#457a3d] text-white rounded-lg
                           transition-colors disabled:opacity-50"
              >
                {generatingPDF
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Download className="w-3.5 h-3.5" />
                }
                Download PDF
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                           border border-gray-300 text-gray-600 hover:bg-gray-100
                           rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />Print
              </button>
            </div>
          </div>

          {/* ── INVOICE BODY (visible + ref for PDF) ── */}
          <div className="overflow-x-auto">
            <InvoiceTemplate ref={invoiceRef} invoice={invoice} />
          </div>
        </div>

        {/* ══ INFO CARDS ══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Customer */}
          <Card className="border-[#559F4B]/20 shadow-md">
            <CardHeader className="pb-3 border-b border-[#559F4B]/10">
              <CardTitle className="flex items-center gap-2 text-[#559F4B] text-sm">
                <User className="w-4 h-4" />Bill To
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-sm">
              {invoice.customer_name && (
                <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
              )}
              {invoice.customer_email && (
                <p className="text-gray-600 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 flex-shrink-0" />{invoice.customer_email}
                </p>
              )}
              {invoice.customer_phone && (
                <p className="text-gray-600 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 flex-shrink-0" />{invoice.customer_phone}
                </p>
              )}
              {invoice.billing_address && (
                <p className="text-gray-600 flex items-start gap-1.5">
                  <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />{invoice.billing_address}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className={`${payInfo.border} shadow-md`}>
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className={`w-7 h-7 bg-gradient-to-r ${payInfo.gradient}
                                 rounded-lg flex items-center justify-center`}>
                  <PayIcon className="w-4 h-4 text-white" />
                </div>
                <span className={payInfo.text}>Payment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium">{payInfo.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-semibold capitalize
                  ${invoice.payment_status === "paid" ? "text-green-600" : "text-red-600"}`}>
                  {invoice.payment_status || "Unpaid"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-[#559F4B]">{formatPrice(invoice.total_amount)}</span>
              </div>
              {invoice.paid_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid On</span>
                  <span>{formatDate(invoice.paid_date)}</span>
                </div>
              )}

              {/* Unpaid warning */}
              {invoice.payment_status === "unpaid" && invoice.status !== "cancelled" && (
                <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    Payment pending: {formatPrice(invoice.total_amount)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-[#559F4B]/20 shadow-md">
            <CardHeader className="pb-3 border-b border-[#559F4B]/10">
              <CardTitle className="flex items-center gap-2 text-[#559F4B] text-sm">
                <DownloadCloud className="w-4 h-4" />Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button
                className="w-full bg-[#559F4B] hover:bg-[#457a3d] text-white text-sm"
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
              >
                {generatingPDF
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                  : <><Download className="w-4 h-4 mr-2" />Download PDF</>
                }
              </Button>
              <Button variant="outline"
                className="w-full border-[#559F4B] text-[#559F4B] text-sm"
                onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />Print Invoice
              </Button>
              <Button variant="outline" className="w-full text-sm"
                onClick={() => navigate(`/orders/${invoice.order_id}`)}>
                <Package className="w-4 h-4 mr-2" />View Order
              </Button>
              <Button variant="outline" className="w-full text-sm"
                onClick={() => navigate("/products")}>
                <Home className="w-4 h-4 mr-2" />Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ══ PRINT STYLES ══ */}
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
    </UserLayout>
  );
};

export default InvoicesPage;