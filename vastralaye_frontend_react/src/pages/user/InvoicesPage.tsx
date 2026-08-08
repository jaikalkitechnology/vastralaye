import React, { useEffect, useState, useRef } from "react";
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
  Truck, Share2, Copy, Send, DownloadCloud, Eye,
  ChevronDown, ExternalLink, QrCode, Check,
} from "lucide-react";
import { BASE_URL } from "@/config";
import UserLayout from "@/components/user/UserLayout";
import { toast } from "sonner";
import { 
  getOrderInvoice, 
  printOrderInvoice, getUserInvoices,
  downloadInvoicePDF,
  emailInvoice,
  shareInvoice,
  getInvoiceShareLink,
} from "@/api/apihelper";

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
    return new Date(d).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  } catch { return d; }
};

const formatDateTime = (d: string | null) => {
  if (!d) return "N/A";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
};

// ═══════════════ INVOICE TEMPLATE COMPONENT ═══════════════

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
  companyDetails = {
    name: "Your Store Name",
    address: "123 Business Street, City, State 123456",
    email: "support@yourstore.com",
    phone: "+91 1234567890",
    gst: "22AAAAA0000A1Z5",
  }
}) => {
  const payInfo = getPaymentInfo(invoice.payment_method);
  const PayIcon = payInfo.icon;

  return (
    <div className="bg-white p-8 rounded-lg" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#7A1F2B' }}>TAX INVOICE</h1>
          <p className="text-gray-600 mt-1">{invoice.invoice_number}</p>
        </div>
        <div className="text-right">
          {companyDetails.logo && (
            <img src={companyDetails.logo} alt="Company Logo" className="h-12 mb-2 ml-auto" />
          )}
          <h2 className="text-xl font-semibold">{companyDetails.name}</h2>
          <p className="text-sm text-gray-600">{companyDetails.address}</p>
          <p className="text-sm text-gray-600">{companyDetails.email}</p>
          <p className="text-sm text-gray-600">{companyDetails.phone}</p>
          <p className="text-sm text-gray-600">GST: {companyDetails.gst}</p>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-sm text-gray-600">Invoice Number</p>
          <p className="font-semibold">{invoice.invoice_number}</p>
          <p className="text-sm text-gray-600 mt-2">Invoice Date</p>
          <p className="font-semibold">{formatDate(invoice.invoice_date)}</p>
          <p className="text-sm text-gray-600 mt-2">Due Date</p>
          <p className="font-semibold">{formatDate(invoice.due_date)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Order Number</p>
          <p className="font-semibold">#{invoice.order_id}</p>
          <p className="text-sm text-gray-600 mt-2">Order Date</p>
          <p className="font-semibold">{formatDate(invoice.order_date || invoice.invoice_date)}</p>
          <p className="text-sm text-gray-600 mt-2">Payment Method</p>
          <p className="font-semibold capitalize">{payInfo.label}</p>
        </div>
      </div>

      {/* Billing & Shipping */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold mb-2 text-gray-800">Bill To:</h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-800">{invoice.customer_name || "Customer"}</p>
            {invoice.customer_email && <p>{invoice.customer_email}</p>}
            {invoice.customer_phone && <p>{invoice.customer_phone}</p>}
            {invoice.billing_address && <p className="mt-2">{invoice.billing_address}</p>}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2 text-gray-800">Ship To:</h3>
          {invoice.shipping_address ? (
            <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.shipping_address}</p>
          ) : (
            <p className="text-sm text-gray-500">Same as billing address</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-y border-gray-200">
              <th className="py-3 px-2 text-left">#</th>
              <th className="py-3 px-2 text-left">Item</th>
              <th className="py-3 px-2 text-center">HSN/SAC</th>
              <th className="py-3 px-2 text-right">Qty</th>
              <th className="py-3 px-2 text-right">Unit Price</th>
              <th className="py-3 px-2 text-right">Tax %</th>
              <th className="py-3 px-2 text-right">Tax Amt</th>
              <th className="py-3 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id || index} className="border-b border-gray-100">
                <td className="py-3 px-2 text-gray-600">{index + 1}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    {item.product_name}
                    {item.product_sku && (
                      <span className="text-xs text-gray-400">({item.product_sku})</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-center text-gray-600">{item.hsn_code || "NA"}</td>
                <td className="py-3 px-2 text-right">{item.quantity}</td>
                <td className="py-3 px-2 text-right">{formatPrice(item.unit_price)}</td>
                <td className="py-3 px-2 text-right">{item.tax_rate}%</td>
                <td className="py-3 px-2 text-right">{formatPrice(item.tax_amount)}</td>
                <td className="py-3 px-2 text-right font-medium">{formatPrice(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="flex justify-between py-2">
            <span className="font-medium">Subtotal:</span>
            <span>{formatPrice(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-200">
            <span className="font-medium">Shipping:</span>
            <span>{invoice.shipping_amount === 0 ? "Free" : formatPrice(invoice.shipping_amount)}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-200">
            <span className="font-medium">Tax (GST):</span>
            <span>{formatPrice(invoice.tax_amount)}</span>
          </div>
          {invoice.discount_amount > 0 && (
            <div className="flex justify-between py-2 border-t border-gray-200">
              <span className="font-medium">Discount:</span>
              <span className="text-green-600">-{formatPrice(invoice.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t-2 border-gray-300 text-lg font-bold">
            <span>Total:</span>
            <span style={{ color: '#7A1F2B' }}>{formatPrice(invoice.total_amount)}</span>
          </div>
          <div className="text-xs text-gray-500 text-right mt-1">
            (Inclusive of all taxes)
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Amount in Words:</span>{" "}
          {numberToWords(invoice.total_amount)} Rupees Only
        </p>
      </div>

      {/* Payment Info */}
      <div className="grid grid-cols-2 gap-8 border-t border-gray-200 pt-6">
        <div>
          <h3 className="font-semibold mb-2 text-gray-800">Payment Details:</h3>
          <div className="flex items-center gap-2 text-sm">
            <PayIcon className="w-4 h-4" />
            <span className="capitalize">{payInfo.label}</span>
          </div>
          <div className="mt-2 text-sm">
            <p>
              Payment Status: <span className={`font-medium ${invoice.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                {invoice.payment_status || 'Unpaid'}
              </span>
            </p>
            {invoice.paid_date && (
              <p className="text-xs text-gray-500 mt-1">Paid on: {formatDate(invoice.paid_date)}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <h3 className="font-semibold mb-2 text-gray-800">Bank Details:</h3>
          <p className="text-xs text-gray-600">Bank: XYZ Bank</p>
          <p className="text-xs text-gray-600">Account: 1234567890</p>
          <p className="text-xs text-gray-600">IFSC: XYZB0001234</p>
          <p className="text-xs text-gray-600">Branch: Main Branch</p>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium mb-1">Notes:</p>
          <p className="text-sm text-gray-600">{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
        <p className="mb-1">Thank you for your business!</p>
        <p className="mb-1">For any queries, contact {companyDetails.email} | {companyDetails.phone}</p>
        <p className="text-xs mt-2">This is a computer generated invoice, no signature required.</p>
        <p className="text-xs mt-1">Terms: Goods once sold will not be taken back or exchanged.</p>
        <p className="text-xs mt-1">Subject to {companyDetails.address.split(',')[1] || 'Local'} jurisdiction.</p>
      </div>

      {/* QR Code for digital verification */}
      <div className="mt-4 flex justify-end">
        <div className="text-center">
          <QrCode className="w-16 h-16 text-gray-400" />
          <p className="text-xs text-gray-400 mt-1">Scan to verify</p>
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

  const rupees = Math.floor(num);
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
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `invoice_${invoice.invoice_number}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, letterRendering: true, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
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
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </UserLayout>
    );
  }

  // ═══════ Error ═══════
  if (error || !invoice) {
    return (
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
              ? "No invoice has been generated for this order yet. Please check back later."
              : "We couldn't find the invoice you're looking for. It might have been removed or you don't have permission to view it."}
          </p>
          <div className="flex gap-3 mt-4 flex-wrap justify-center">
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />Retry
            </Button>
            <Button onClick={() => navigate("/orders")} variant="outline" className="gap-2">
              <Package className="w-4 h-4" />My Orders
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
              <Home className="w-4 h-4" />Home
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
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        {/* Hidden Invoice Template for PDF Generation */}
        <div ref={invoiceRef} className="hidden">
          <InvoiceTemplate invoice={invoice} />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A1F2B]/10 via-[#B85C38]/5 to-[#7A1F2B]/10 rounded-2xl p-6 border border-[#7A1F2B]/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/invoices")}
                className="h-12 w-12 rounded-xl border-[#7A1F2B]/30 hover:bg-[#7A1F2B]/5"
              >
                <ArrowLeft className="h-5 w-5 text-[#7A1F2B]" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] bg-clip-text text-transparent">
                  {invoice.invoice_number}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(invoice.invoice_date)}
                  <span className="text-gray-400">•</span>
                  <span>Order #{invoice.order_id}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} px-3 py-1.5 rounded-full`}>
                <StatusIcon className="w-3 h-3 mr-1" />{statusCfg.label}
              </Badge>
              <Badge variant="outline" className={`${payInfo.badge} px-3 py-1 rounded-full text-xs`}>
                <PayIcon className="w-3 h-3 mr-1" />{payInfo.short}
              </Badge>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#7A1F2B] text-[#7A1F2B]"
                  onClick={handlePrintInvoice}
                >
                  <Printer className="w-4 h-4 mr-1" />Print
                </Button>
                
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] text-white hover:opacity-90"
                  onClick={() => handleDownloadPDF('pdf')}
                  disabled={generatingPDF}
                >
                  {generatingPDF ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-1" />
                  )}
                  Download
                </Button>

                {/* Share Dropdown */}
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#7A1F2B] text-[#7A1F2B]"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-1" />Share
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                  
                  {showShareOptions && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => {
                            handleEmailInvoice();
                            setShowShareOptions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" /> Email
                        </button>
                        <button
                          onClick={() => {
                            handleWhatsAppShare();
                            setShowShareOptions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" /> WhatsApp
                        </button>
                        <button
                          onClick={() => {
                            handleCopyLink();
                            setShowShareOptions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Copied!" : "Copy Link"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Quick Actions */}
        <div className="md:hidden grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#7A1F2B] text-[#7A1F2B]"
            onClick={handlePrintInvoice}
          >
            <Printer className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] text-white"
            onClick={() => handleDownloadPDF('pdf')}
            disabled={generatingPDF}
          >
            {generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-[#7A1F2B] text-[#7A1F2B]"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Customer & Invoice Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-[#7A1F2B]/20 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3 border-b border-[#7A1F2B]/10">
                  <CardTitle className="flex items-center gap-2 text-[#7A1F2B] text-base">
                    <User className="w-4 h-4" />Bill To
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {invoice.customer_name && (
                    <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
                  )}
                  {invoice.customer_email && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="w-3 h-3" />{invoice.customer_email}
                    </p>
                  )}
                  {invoice.customer_phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-3 h-3" />{invoice.customer_phone}
                    </p>
                  )}
                  {invoice.billing_address && (
                    <p className="text-sm text-gray-600 flex items-start gap-2 mt-2">
                      <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />{invoice.billing_address}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-[#7A1F2B]/20 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3 border-b border-[#7A1F2B]/10">
                  <CardTitle className="flex items-center gap-2 text-[#7A1F2B] text-base">
                    <FileText className="w-4 h-4" />Invoice Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice #</span>
                    <span className="font-semibold">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order #</span>
                    <span className="font-semibold">{invoice.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span>{formatDate(invoice.invoice_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date</span>
                    <span>{formatDate(invoice.due_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <Badge className={`${statusCfg.bg} ${statusCfg.color} border-0 text-xs`}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items Table */}
            <Card className="border-[#7A1F2B]/20 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4 border-b border-[#7A1F2B]/10">
                <CardTitle className="flex items-center gap-3 text-[#7A1F2B]">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    Items
                    <p className="text-sm font-normal text-gray-600 mt-1">
                      {invoice.total_products} product{invoice.total_products !== 1 ? "s" : ""} •{" "}
                      {invoice.total_items} item{invoice.total_items !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-1 text-center">Qty</div>
                  <div className="col-span-2 text-right">Tax</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {invoice.items.map((item, index) => (
                    <div key={item.id || index} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors">
                      {/* Product */}
                      <div className="col-span-5 flex items-center gap-4">
                        <img
                          src={getImageUrl(item.product_image)}
                          alt={item.product_name}
                          className="w-14 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                          {item.product_sku && (
                            <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                          )}
                          {item.product_description && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{item.product_description}</p>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-2 text-right">
                        <span className="md:hidden text-xs text-gray-500 mr-2">Price:</span>
                        <span className="font-medium">{formatPrice(item.unit_price)}</span>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-1 text-center">
                        <span className="md:hidden text-xs text-gray-500 mr-2">Qty:</span>
                        <span className="font-medium">{item.quantity}</span>
                      </div>

                      {/* Tax */}
                      <div className="col-span-2 text-right">
                        <span className="md:hidden text-xs text-gray-500 mr-2">Tax:</span>
                        <span className="text-gray-600">{formatPrice(item.tax_amount)}</span>
                        <p className="text-xs text-gray-400">({item.tax_rate}%)</p>
                      </div>

                      {/* Total */}
                      <div className="col-span-2 text-right">
                        <span className="md:hidden text-xs text-gray-500 mr-2">Total:</span>
                        <span className="font-bold text-gray-900">{formatPrice(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 bg-gray-50/50 p-6">
                  <div className="max-w-xs ml-auto space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatPrice(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">
                        {invoice.shipping_amount === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          formatPrice(invoice.shipping_amount)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST ({invoice.tax_rate}%)</span>
                      <span className="font-medium">{formatPrice(invoice.tax_amount)}</span>
                    </div>
                    {invoice.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount</span>
                        <span className="font-medium text-green-600">-{formatPrice(invoice.discount_amount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold pt-2">
                      <span>Total Amount</span>
                      <span className="text-[#7A1F2B]">{formatPrice(invoice.total_amount)}</span>
                    </div>
                    <p className="text-xs text-gray-400 text-right">(Inclusive of all taxes)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amount in Words */}
            <Card className="border-[#7A1F2B]/20">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Amount in Words:</span>{" "}
                  {numberToWords(invoice.total_amount)} Rupees Only
                </p>
              </CardContent>
            </Card>

            {/* Notes */}
            {invoice.notes && (
              <Card className="border-[#7A1F2B]/20">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-1 font-medium">Notes</p>
                  <p className="text-sm text-gray-700">{invoice.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Payment Info */}
            <Card className={`${payInfo.border} shadow-lg hover:shadow-xl transition-shadow`}>
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${payInfo.gradient} rounded-lg flex items-center justify-center`}>
                    <PayIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className={payInfo.text}>Payment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className={`p-4 bg-gradient-to-r ${payInfo.bg} rounded-xl border ${payInfo.border} space-y-3`}>
                  <p className={`font-semibold ${payInfo.text}`}>{payInfo.label}</p>
                  <div className="space-y-2 pt-3 border-t border-gray-200/50 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-medium capitalize ${invoice.payment_status === 'unpaid' ? 'text-red-600' : 'text-gray-900'}`}>
                        {invoice.payment_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-bold">{formatPrice(invoice.total_amount)}</span>
                    </div>
                    {invoice.paid_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid On</span>
                        <span>{formatDate(invoice.paid_date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Show payment reminder if Unpaid */}
                {invoice.payment_status === "unpaid" && invoice.status !== "cancelled" && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      Payment is pending. Please pay {formatPrice(invoice.total_amount)}.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping */}
            {invoice.shipping_address && (
              <Card className="border-[#7A1F2B]/20 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3 border-b border-[#7A1F2B]/10">
                  <CardTitle className="flex items-center gap-2 text-[#7A1F2B] text-base">
                    <Truck className="w-4 h-4" />Shipping
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-700 p-3 bg-[#7A1F2B]/5 rounded-lg border border-[#7A1F2B]/10">
                    {invoice.shipping_address}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Download Options */}
            <Card className="border-[#7A1F2B]/20 shadow-lg">
              <CardHeader className="pb-3 border-b border-[#7A1F2B]/10">
                <CardTitle className="flex items-center gap-2 text-[#7A1F2B] text-base">
                  <DownloadCloud className="w-4 h-4" />Download Options
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button
                  className="w-full bg-[#7A1F2B] hover:bg-[#457a3d] text-white"
                  onClick={() => handleDownloadPDF('pdf')}
                  disabled={generatingPDF}
                >
                  {generatingPDF ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><FileText className="w-4 h-4 mr-2" />Download PDF</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-[#7A1F2B] text-[#7A1F2B]"
                  onClick={() => handleDownloadPDF('image')}
                  disabled={generatingPDF}
                >
                  <Download className="w-4 h-4 mr-2" />Download as Image
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-[#7A1F2B] text-[#7A1F2B]"
                  onClick={handlePrintInvoice}
                >
                  <Printer className="w-4 h-4 mr-2" />Print Invoice
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-[#7A1F2B] text-[#7A1F2B] hover:bg-[#7A1F2B]/5"
                onClick={() => navigate(`/orders/${invoice.order_id}`)}
              >
                <Package className="w-4 h-4 mr-2" />View Order
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/invoices")}
              >
                <FileText className="w-4 h-4 mr-2" />All Invoices
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/products")}
              >
                <Home className="w-4 h-4 mr-2" />Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default InvoicesPage;