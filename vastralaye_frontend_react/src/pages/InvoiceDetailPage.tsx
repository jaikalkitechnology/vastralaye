import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText, ArrowLeft, Package, Loader2, AlertCircle,
  RefreshCw, Home, Printer, Download,
  Banknote, CreditCard, Wallet, Shield, CheckCircle,
  Clock, XCircle,
} from "lucide-react";
import { BASE_URL } from "@/config";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
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
//  BRAND CONSTANTS  (literal hex — PDF/html2canvas safe)
// ═══════════════════════════════════════════════

const SERIF = "'Fraunces', Georgia, serif";

// Faint paisley layer for the espresso letterhead (inline data-URI, no network)
const PAISLEY =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='130' height='130' viewBox='0 0 130 130'%3E%3Cg fill='none' stroke='%23C99A45'%3E%3Cpath d='M33 11c14 6 22 18 20 32-2 12-11 22-22 24-8 2-13-2-14-8-1-6 3-11 9-11 5 0 9 3 9 8'/%3E%3Crect x='92' y='26' width='6' height='6' transform='rotate(45 95 29)'/%3E%3Cpath d='M97 119c-14-6-22-18-20-32 2-12 11-22 22-24 8-2 13 2 14 8 1 6-3 11-9 11-5 0-9-3-9-8'/%3E%3Crect x='29' y='94' width='6' height='6' transform='rotate(45 32 97)'/%3E%3C/g%3E%3C/svg%3E\")";

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
      gradient: "from-[#7A1F2B] to-[#B85C38]",
      bg: "from-[#FAF6F0] to-[#EFE7DB]",
      border: "border-[#E7DFD3]", text: "text-[#2B1B12]",
      badge: "bg-[#EFE7DB] text-[#2B1B12] border-[#E7DFD3]",
      inlineBg: "#EFE7DB", inlineColor: "#2B1B12",
    },
    card: {
      label: "Credit/Debit Card", short: "Card", icon: CreditCard,
      gradient: "from-[#7A1F2B] to-[#B85C38]",
      bg: "from-[#F6E8E4] to-[#FAF6F0]",
      border: "border-[#E7DFD3]", text: "text-[#7A1F2B]",
      badge: "bg-[#F6E8E4] text-[#7A1F2B] border-[#E7DFD3]",
      inlineBg: "#F6E8E4", inlineColor: "#7A1F2B",
    },
    upi: {
      label: "UPI Payment", short: "UPI", icon: Wallet,
      gradient: "from-[#C99A45] to-[#B85C38]",
      bg: "from-[#FAF6F0] to-[#EFE7DB]",
      border: "border-[#E7DFD3]", text: "text-[#8A6414]",
      badge: "bg-[#FAF6F0] text-[#8A6414] border-[#E7DFD3]",
      inlineBg: "#FAF6F0", inlineColor: "#8A6414",
    },
    netbanking: {
      label: "Net Banking", short: "NetBanking", icon: Shield,
      gradient: "from-[#B85C38] to-[#C99A45]",
      bg: "from-[#F6E8E4] to-[#EFE7DB]",
      border: "border-[#E7DFD3]", text: "text-[#B85C38]",
      badge: "bg-[#F6E8E4] text-[#B85C38] border-[#E7DFD3]",
      inlineBg: "#F6E8E4", inlineColor: "#B85C38",
    },
  };
  return map[(method || "cod").toLowerCase()] || map["cod"];
};

const getStatusConfig = (status: string) => {
  const map: Record<string, any> = {
    generated: {
      label: "Generated", icon: FileText,
      color: "text-[#8A6414]", bg: "bg-[#C99A45]/15", border: "border-[#C99A45]/35",
      inlineBg: "rgba(201,154,69,0.14)", inlineColor: "#8A6414", dot: "#C99A45",
    },
    sent: {
      label: "Sent", icon: CheckCircle,
      color: "text-[#3E6B4F]", bg: "bg-[#3E6B4F]/10", border: "border-[#3E6B4F]/30",
      inlineBg: "rgba(62,107,79,0.10)", inlineColor: "#3E6B4F", dot: "#3E6B4F",
    },
    paid: {
      label: "Paid", icon: CheckCircle,
      color: "text-[#3E6B4F]", bg: "bg-[#3E6B4F]/10", border: "border-[#3E6B4F]/30",
      inlineBg: "rgba(62,107,79,0.10)", inlineColor: "#3E6B4F", dot: "#3E6B4F",
    },
    unpaid: {
      label: "Unpaid", icon: AlertCircle,
      color: "text-[#C62828]", bg: "bg-[#C62828]/10", border: "border-[#C62828]/30",
      inlineBg: "rgba(198,40,40,0.08)", inlineColor: "#C62828", dot: "#C62828",
    },
    cancelled: {
      label: "Cancelled", icon: XCircle,
      color: "text-[#C62828]", bg: "bg-[#C62828]/10", border: "border-[#C62828]/30",
      inlineBg: "rgba(198,40,40,0.08)", inlineColor: "#C62828", dot: "#C62828",
    },
    overdue: {
      label: "Overdue", icon: Clock,
      color: "text-[#8A6414]", bg: "bg-[#C99A45]/15", border: "border-[#C99A45]/35",
      inlineBg: "rgba(201,154,69,0.16)", inlineColor: "#8A6414", dot: "#B85C38",
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

const LABEL: React.CSSProperties = {
  fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.18em",
  textTransform: "uppercase", color: "#8A6414",
};

const th = (align: "left" | "center" | "right"): React.CSSProperties => ({
  background: "#2B1B12", color: "#FAF6F0",
  fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.16em",
  textTransform: "uppercase", padding: "9px 10px", textAlign: align,
});

const td = (align: "left" | "center" | "right" = "left"): React.CSSProperties => ({
  padding: "10px", borderBottom: "1px solid #E7DFD3",
  verticalAlign: "middle", textAlign: align,
});

const InvoiceTemplate = React.forwardRef<HTMLDivElement, { invoice: Invoice }>(
  ({ invoice }, ref) => {
    const payInfo   = getPaymentInfo(invoice.payment_method);
    const PayIcon   = payInfo.icon;
    const statusCfg = getStatusConfig(invoice.status);
    const paySts    = getStatusConfig(invoice.payment_status || "unpaid");

    const payKey       = (invoice.payment_method || "cod").toLowerCase();
    const payStatusKey = (invoice.payment_status || "unpaid").toLowerCase();
    const payStatusTxt = invoice.payment_status || "Unpaid";

    const subtotal = invoice.subtotal        || 0;
    const tax      = invoice.tax_amount      || 0;
    const shipping = invoice.shipping_amount || 0;
    const discount = invoice.discount_amount || 0;
    const total    = invoice.total_amount    || 0;
    const taxable  = Math.max(subtotal - discount, 0);

    const isPaid      = payStatusKey === "paid";
    const isCancelled = payStatusKey === "cancelled" ||
                        (invoice.status || "").toLowerCase() === "cancelled";
    const watermark   = isCancelled ? "CANCELLED" : isPaid ? "PAID" : "UNPAID";
    const showDue     = !isPaid && !isCancelled;

    const txnId =
      (invoice as any).transaction_id ||
      (invoice as any).payment_id ||
      (invoice as any).payment_reference || "—";

    const terms = [
      ...(invoice.notes ? [invoice.notes] : []),
      "Goods once sold are eligible for return within 7 days in original condition.",
      "GST is included in the listed price.",
      "For queries about this invoice, write to support@vastraliya.com quoting the invoice number.",
    ];

    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          backgroundColor: "#ffffff",
          color: "#2B1B12",
          fontSize: "13px",
          lineHeight: 1.55,
          width: "100%",
          minWidth: "680px",
          maxWidth: "860px",
          margin: "0 auto",
          border: "1px solid #E7DFD3",
          borderRadius: "3px",
          boxShadow: "0 18px 44px rgba(43,27,18,0.10)",
          overflow: "hidden",
        }}
      >
        {/* ── STATUS WATERMARK ── */}
        <div style={{
          position: "absolute", top: "44%", left: "50%",
          transform: "translate(-50%,-50%) rotate(-24deg)",
          fontFamily: SERIF, fontSize: "120px", fontWeight: 600,
          letterSpacing: "0.08em", whiteSpace: "nowrap",
          color: isPaid ? "#3E6B4F" : "#C62828",
          opacity: 0.05, pointerEvents: "none", zIndex: 1,
        }}>
          {watermark}
        </div>

        {/* ── ESPRESSO LETTERHEAD ── */}
        <div style={{
          position: "relative", background: "#2B1B12", color: "#FAF6F0",
          padding: "24px 34px", display: "flex",
          justifyContent: "space-between", alignItems: "flex-start",
          gap: "20px", overflow: "hidden",
        }}>
          <span style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            opacity: 0.07, backgroundImage: PAISLEY, backgroundSize: "130px 130px",
            pointerEvents: "none",
          }} />

          {/* Brand */}
          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: SERIF, fontSize: "23px", fontWeight: 600 }}>
              Vastra<span style={{ color: "#C99A45" }}>liya</span>
            </div>
            <div style={{
              fontSize: "11px", color: "rgba(250,246,240,0.6)",
              marginTop: "9px", lineHeight: 1.65,
            }}>
              <div>{"Pride Industrial Estate, Vasai East, Maharashtra 401208"}</div>
              <div>support@vastraliya.com · +91 70661 81207</div>
              <div>GSTIN 27AAMCV4451F</div>
            </div>
          </div>

          {/* Invoice meta */}
          <div style={{ position: "relative", textAlign: "right" }}>
            <div style={{
              fontFamily: SERIF, fontSize: "23px",
              letterSpacing: "0.06em", color: "#C99A45",
            }}>
              TAX INVOICE
            </div>
            <div style={{
              fontSize: "11.5px", color: "rgba(250,246,240,0.65)", marginTop: "3px",
            }}>
              {invoice.invoice_number} · Original for recipient
            </div>
            <span style={{
              display: "inline-block", marginTop: "9px",
              border: "1px solid rgba(201,154,69,0.6)", color: "#C99A45",
              borderRadius: "999px", padding: "4px 13px",
              fontSize: "10px", fontWeight: 600, letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}>
              {payInfo.label} · {payStatusTxt}
            </span>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ position: "relative", zIndex: 2, padding: "26px 34px 28px" }}>

          {/* ── PARTIES + INVOICE DETAILS ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 0.9fr", gap: "16px",
          }}>
            {/* Bill to */}
            <div style={{ border: "1px solid #E7DFD3", borderRadius: "3px", padding: "14px 16px" }}>
              <div style={{ ...LABEL, marginBottom: "7px" }}>Bill to</div>
              <b style={{ fontSize: "13.5px", display: "block", fontWeight: 600 }}>
                {invoice.customer_name || "Customer"}
              </b>
              {invoice.customer_email && (
                <span style={{ fontSize: "12px", color: "#6E5F53", display: "block", marginTop: "2px" }}>
                  {invoice.customer_email}
                </span>
              )}
              {invoice.customer_phone && (
                <span style={{ fontSize: "12px", color: "#6E5F53", display: "block", marginTop: "2px" }}>
                  {invoice.customer_phone}
                </span>
              )}
              {invoice.billing_address && (
                <span style={{
                  fontSize: "12px", color: "#6E5F53", display: "block",
                  marginTop: "2px", whiteSpace: "pre-line",
                }}>
                  {invoice.billing_address}
                </span>
              )}
            </div>

            {/* Ship to */}
            <div style={{ border: "1px solid #E7DFD3", borderRadius: "3px", padding: "14px 16px" }}>
              <div style={{ ...LABEL, marginBottom: "7px" }}>Ship to</div>
              <b style={{ fontSize: "13.5px", display: "block", fontWeight: 600 }}>
                {invoice.customer_name || "Customer"}
              </b>
              {invoice.shipping_address ? (
                <span style={{
                  fontSize: "12px", color: "#6E5F53", display: "block",
                  marginTop: "2px", whiteSpace: "pre-line",
                }}>
                  {invoice.shipping_address}
                </span>
              ) : (
                <span style={{ fontSize: "12px", color: "#6E5F53", display: "block", marginTop: "2px" }}>
                  Same as billing address
                </span>
              )}
            </div>

            {/* Invoice details */}
            <div style={{
              border: "1px solid #E7DFD3", borderRadius: "3px",
              padding: "14px 16px", background: "#FAF6F0",
            }}>
              <div style={{ ...LABEL, marginBottom: "7px" }}>Invoice details</div>
              {[
                { label: "Invoice no.",  value: invoice.invoice_number },
                { label: "Invoice date", value: formatDate(invoice.invoice_date) },
                { label: "Order no.",    value: `#${invoice.order_id}` },
                ...(invoice.order_date
                  ? [{ label: "Order date", value: formatDate(invoice.order_date) }]
                  : []),
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between",
                  gap: "10px", fontSize: "12px", color: "#6E5F53", padding: "3px 0",
                }}>
                  <span>{label}</span>
                  <b style={{
                    color: "#2B1B12", fontWeight: 500,
                    fontSize: "12.5px", textAlign: "right",
                  }}>{value}</b>
                </div>
              ))}
            </div>
          </div>

          {/* ── ITEMS TABLE ── */}
          <table style={{
            width: "100%", borderCollapse: "collapse",
            fontSize: "12.5px", marginTop: "20px",
          }}>
            <thead>
              <tr>
                <th style={th("center")}>#</th>
                <th style={th("left")} />
                <th style={th("left")}>Item</th>
                <th style={th("center")}>HSN</th>
                <th style={th("center")}>Qty</th>
                <th style={th("right")}>Rate</th>
                <th style={th("right")}>Taxable</th>
                <th style={th("right")}>GST</th>
                <th style={th("right")}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, i) => (
                  <tr
                    key={item.id || i}
                    style={{ backgroundColor: i % 2 === 1 ? "rgba(250,246,240,0.55)" : "#ffffff" }}
                  >
                    <td style={{ ...td("center"), color: "#6E5F53" }}>{i + 1}</td>

                    {/* Thumbnail */}
                    <td style={{ ...td("left"), width: "44px" }}>
                      <div style={{
                        width: "34px", height: "45px", overflow: "hidden",
                        background: "#EFE7DB", border: "1px solid #E7DFD3",
                        borderRadius: "2px",
                      }}>
                        <img
                          src={getImageUrl(item.product_image)}
                          alt={item.product_name || ""}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    </td>

                    {/* Item */}
                    <td style={td("left")}>
                      <div style={{ color: "#2B1B12", lineHeight: 1.45, wordBreak: "break-word" }}>
                        {item.product_name || `Product #${item.product_id}`}
                      </div>
                      {(() => {
                        const variant =
                          (item as any).variant_name || (item as any).variant ||
                          (item as any).size || (item as any).color || "";
                        const sub = [
                          item.product_sku ? `SKU ${item.product_sku}` : "",
                          variant,
                        ].filter(Boolean).join(" · ");
                        return sub ? (
                          <div style={{ fontSize: "10.5px", color: "#6E5F53", marginTop: "2px" }}>
                            {sub}
                          </div>
                        ) : null;
                      })()}
                    </td>

                    {/* ✅ HSN Code Cell */}
                    <td style={{ ...td("center"), color: "#6E5F53" }}>{item.hsn_code || "—"}</td>

                    <td style={{ ...td("center"), color: "#2B1B12" }}>{item.quantity}</td>
                    <td style={{ ...td("right"), color: "#2B1B12" }}>{formatPrice(item.unit_price)}</td>
                    <td style={{ ...td("right"), color: "#6E5F53" }}>
                      {item.subtotal || item.subtotal === 0 ? formatPrice(item.subtotal) : "—"}
                    </td>
                    <td style={{ ...td("right"), color: "#6E5F53" }}>
                      {item.tax_amount || item.tax_amount === 0 ? formatPrice(item.tax_amount) : "—"}
                    </td>
                    <td style={{ ...td("right"), color: "#2B1B12", fontWeight: 600 }}>
                      {formatPrice(item.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ ...td("center"), padding: "32px", color: "#6E5F53" }}>
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ── WORDS + PAYMENT / TOTALS ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 320px",
            gap: "22px", marginTop: "20px", alignItems: "start",
          }}>
            {/* LEFT */}
            <div>
              {/* Amount in words */}
              <div style={{
                background: "rgba(246,232,228,0.6)", border: "1px solid #E7DFD3",
                borderRadius: "3px", padding: "13px 15px",
                fontSize: "12.5px", color: "#6E5F53",
              }}>
                Amount in words — <b style={{ color: "#2B1B12", fontWeight: 500 }}>
                  {numberToWords(total)} Only
                </b>
              </div>

              {/* Payment details */}
              <div style={{
                border: "1px solid #E7DFD3", borderRadius: "3px",
                marginTop: "14px", overflow: "hidden",
              }}>
                <div style={{
                  ...LABEL, background: "#FAF6F0",
                  borderBottom: "1px solid #E7DFD3", padding: "9px 15px",
                }}>
                  Payment details
                </div>
                <div style={{ padding: "12px 15px" }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    gap: "10px", fontSize: "12.5px", color: "#6E5F53", padding: "3.5px 0",
                  }}>
                    <span>Method</span>
                    <b style={{
                      color: "#2B1B12", fontWeight: 500,
                      display: "inline-flex", alignItems: "center", gap: "6px",
                    }}>
                      <PayIcon size={13} color={payInfo.inlineColor} strokeWidth={1.7} />
                      {payInfo.label}
                    </b>
                  </div>

                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    gap: "10px", fontSize: "12.5px", color: "#6E5F53", padding: "3.5px 0",
                  }}>
                    <span>Payment status</span>
                    <span style={{
                      borderRadius: "999px", padding: "2px 10px",
                      fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      backgroundColor: paySts.inlineBg,
                      color: paySts.inlineColor,
                      border: `1px solid ${paySts.inlineColor}44`,
                    }}>
                      {payStatusTxt}
                    </span>
                  </div>

                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    gap: "10px", fontSize: "12.5px", color: "#6E5F53", padding: "3.5px 0",
                  }}>
                    <span>Invoice status</span>
                    <span style={{
                      borderRadius: "999px", padding: "2px 10px",
                      fontSize: "9.5px", fontWeight: 600, letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      backgroundColor: statusCfg.inlineBg,
                      color: statusCfg.inlineColor,
                      border: `1px solid ${statusCfg.inlineColor}44`,
                    }}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    gap: "10px", fontSize: "12.5px", color: "#6E5F53", padding: "3.5px 0",
                  }}>
                    <span>Transaction ID</span>
                    <b style={{ color: "#2B1B12", fontWeight: 500 }}>{txnId}</b>
                  </div>

                  {invoice.paid_date && (
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      gap: "10px", fontSize: "12.5px", color: "#6E5F53", padding: "3.5px 0",
                    }}>
                      <span>Paid on</span>
                      <b style={{ color: "#2B1B12", fontWeight: 500 }}>{formatDate(invoice.paid_date)}</b>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT — totals */}
            <div style={{ fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#6E5F53" }}>
                <span>Subtotal</span>
                <b style={{ color: "#2B1B12", fontWeight: 500 }}>{formatPrice(subtotal)}</b>
              </div>

              {discount > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#6E5F53" }}>
                    <span>Discount</span>
                    <b style={{ color: "#3E6B4F", fontWeight: 500 }}>− {formatPrice(discount)}</b>
                  </div>
                  <div style={{ borderTop: "1px solid #E7DFD3", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#6E5F53" }}>
                    <span>Taxable value</span>
                    <b style={{ color: "#2B1B12", fontWeight: 500 }}>{formatPrice(taxable)}</b>
                  </div>
                </>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#6E5F53" }}>
                <span>GST ({invoice.tax_rate || 18}%)</span>
                <b style={{ color: "#2B1B12", fontWeight: 500 }}>{formatPrice(tax)}</b>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#6E5F53" }}>
                <span>Shipping</span>
                <b style={{ color: shipping === 0 ? "#3E6B4F" : "#2B1B12", fontWeight: 500 }}>
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </b>
              </div>

              {/* Grand total */}
              <div style={{
                borderTop: "2px solid #C99A45", marginTop: "6px", paddingTop: "11px",
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
              }}>
                <span style={{
                  fontSize: "10.5px", fontWeight: 600,
                  letterSpacing: "0.18em", textTransform: "uppercase", color: "#2B1B12",
                }}>
                  Grand total
                </span>
                <span style={{
                  fontFamily: SERIF, fontSize: "23px",
                  fontWeight: 500, color: "#7A1F2B",
                }}>
                  {formatPrice(total)}
                </span>
              </div>

              {showDue && (
                <div style={{
                  marginTop: "9px", background: "#2B1B12", color: "#FAF6F0",
                  borderRadius: "3px", padding: "9px 13px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  gap: "10px",
                }}>
                  <span style={{
                    fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase",
                  }}>
                    {payKey === "cod" ? "Amount due on delivery" : "Amount due"}
                  </span>
                  <b style={{ fontFamily: SERIF, fontSize: "15px", fontWeight: 500, color: "#C99A45" }}>
                    {formatPrice(total)}
                  </b>
                </div>
              )}
            </div>
          </div>

          {/* ── NOTES & TERMS ── */}
          <div style={{
            marginTop: "20px", border: "1px solid #E7DFD3",
            borderRadius: "3px", padding: "14px 16px",
          }}>
            <div style={{ ...LABEL, marginBottom: "6px" }}>Notes &amp; terms</div>
            {terms.map((line, i) => (
              <div key={i} style={{
                display: "flex", gap: "9px", fontSize: "12px",
                color: "#6E5F53", padding: "2px 0",
              }}>
                <span style={{
                  width: "4px", height: "4px", borderRadius: "50%",
                  background: "#C99A45", marginTop: "7px", flex: "none",
                }} />
                <span>{line}</span>
              </div>
            ))}
          </div>

          {/* ── SIGNATURE ── */}
          <div style={{
            borderTop: "1px solid #E7DFD3", marginTop: "22px", paddingTop: "18px",
            display: "flex", justifyContent: "flex-end", alignItems: "flex-end",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: "9px",
              }}>
                <span style={{ width: "36px", height: "1px", background: "#C99A45", opacity: 0.6 }} />
                <span style={{
                  width: "6px", height: "6px",
                  border: "1px solid #C99A45", transform: "rotate(45deg)",
                }} />
                <span style={{ width: "36px", height: "1px", background: "#C99A45", opacity: 0.6 }} />
              </div>
              <div style={{ fontFamily: SERIF, fontSize: "14px", marginTop: "8px" }}>For Vastraliya</div>
              <div style={{
                fontSize: "9.5px", letterSpacing: "0.14em",
                textTransform: "uppercase", color: "#6E5F53", marginTop: "2px",
              }}>
                Authorised signatory
              </div>
            </div>
          </div>
        </div>

        {/* ── CLOSING ── */}
        <p style={{
          position: "relative", zIndex: 2,
          fontFamily: SERIF, fontSize: "15px",
          textAlign: "center", padding: "14px 34px 6px",
        }}>
          Thank you for making us part of your story.
        </p>
        <p style={{
          position: "relative", zIndex: 2,
          padding: "0 34px 20px", fontSize: "10.5px",
          color: "#6E5F53", textAlign: "center",
        }}>
          This is a computer-generated invoice and does not require a physical signature. · support@vastraliya.com
        </p>

        {/* ── EDGE BAR ── */}
        <div style={{
          height: "5px",
          background: "linear-gradient(90deg,#7A1F2B,#C99A45,#B85C38)",
        }} />
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
    <>
      <NavBar />
      <main className="min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center gap-5 py-24">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#7A1F2B]/20 border-t-[#7A1F2B]" />
        <p className="font-serif text-lg text-espresso">Preparing your invoice…</p>
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#6E5F53]">
          Vastraliya
        </p>
      </div>
      </main>
      <Footer />
    </>
  );

  // ════ Error ════
  if (error || !invoice) return (
    <>
      <NavBar />
      <main className="min-h-screen bg-background">
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F6E8E4]">
          <AlertCircle className="h-8 w-8 text-[#7A1F2B]" />
        </span>
        <h2 className="font-serif text-2xl font-medium text-espresso">
          {error || "Invoice Not Found"}
        </h2>
        <p className="max-w-md text-[13.5px] text-[#6E5F53]">
          {error === "Invoice not found for this order"
            ? "No invoice has been generated for this order yet."
            : "We couldn't load the invoice. Please try again."}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-sm border border-[#E7DFD3] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso transition-colors hover:bg-sand"
          >
            <RefreshCw className="h-3.5 w-3.5" />Retry
          </button>
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="inline-flex items-center gap-2 rounded-sm border border-[#E7DFD3] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso transition-colors hover:bg-sand"
          >
            <Package className="h-3.5 w-3.5" />View Order
          </button>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-sm border border-[#7A1F2B] bg-[#7A1F2B] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:bg-[#B85C38]"
          >
            <Home className="h-3.5 w-3.5" />Home
          </button>
        </div>
      </div>
      </main>
      <Footer />
    </>
  );

  const payInfo   = getPaymentInfo(invoice.payment_method);
  const paySts    = getStatusConfig(invoice.payment_status || "unpaid");
  const StatusDot = paySts.icon;

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-background">
      {/* ══ ESPRESSO BAND ══ */}
      <div className="no-print border-b-[3px] border-gold bg-espresso">
        <div className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-ivory/55">
              Home · My Account · My Orders · <span className="font-medium text-gold">Invoice</span>
            </p>
            <h1 className="mt-1.5 truncate font-serif text-[28px] font-medium text-ivory">
              Invoice {invoice.invoice_number}
            </h1>
          </div>
          <div className="sm:text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/55 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
              <StatusDot className="h-3 w-3" />
              {payInfo.label} · {invoice.payment_status || "Unpaid"}
            </span>
            <p className="mt-1.5 text-[12.5px] text-ivory/65">
              Order #{invoice.order_id} · Issued {formatDate(invoice.invoice_date)}
            </p>
          </div>
        </div>
      </div>

      {/* ══ STICKY TOOLBAR ══ */}
      <div className="no-print sticky top-0 z-10 border-b border-border bg-ivory/[0.92] backdrop-blur">
        <div className="flex flex-wrap items-center gap-2.5 px-5 py-3">
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="mr-auto inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-[#6E5F53] transition-colors hover:text-[#7A1F2B]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />Back to order
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-sm border border-[#E7DFD3] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso transition-colors hover:bg-sand"
          >
            <Printer className="h-3.5 w-3.5" />Print
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            className="inline-flex items-center gap-2 rounded-sm border border-[#7A1F2B] bg-[#7A1F2B] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:bg-[#B85C38] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generatingPDF
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />
            }
            {generatingPDF ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* ══ THE PAPER ══ */}
      <div className="py-7 md:py-9">
        <div className="overflow-x-auto pb-2">
          <InvoiceTemplate ref={invoiceRef} invoice={invoice} />
        </div>

        {/* Secondary navigation (hidden on print) */}
        <div className="no-print mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-[#6E5F53]">
          <button
            onClick={() => navigate(`/orders/${invoice.order_id}`)}
            className="inline-flex items-center gap-2 transition-colors hover:text-[#7A1F2B]"
          >
            <Package className="h-3.5 w-3.5" />View order
          </button>
          <span className="text-[#C99A45]">◆</span>
          <button
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-2 transition-colors hover:text-[#7A1F2B]"
          >
            <Home className="h-3.5 w-3.5" />Continue shopping
          </button>
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
      </main>
      <Footer />
    </>
  );
};

export default InvoicesPage;
