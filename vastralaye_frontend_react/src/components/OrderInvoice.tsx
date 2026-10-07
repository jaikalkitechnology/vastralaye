// components/OrderInvoice.tsx
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { BASE_URL } from '@/config';
import { parseApiDate } from '@/lib/apiDate';
import html2pdf from 'html2pdf.js';

interface OrderInvoiceProps {
  order: OrderHistoryItem;
  userDetails?: {
    name: string;
    email: string;
    phone?: string;
  };
}

const OrderInvoice: React.FC<OrderInvoiceProps> = ({ order, userDetails }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  
  const formatDate = (dateString: string) => {
    try {
      const parsed = parseApiDate(dateString);
      if (!parsed) return dateString;
      return parsed.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getProductImageUrl = (imageStr?: string | null): string => {
    if (!imageStr) return '/placeholder.svg';
    try {
      const images = typeof imageStr === 'string' ? JSON.parse(imageStr) : imageStr;
      const first = Array.isArray(images) ? images[0] : null;
      if (!first) return '/placeholder.svg';
      return `${BASE_URL.replace('/api/v1', '')}/${first.replace(/^\/+/, '')}`;
    } catch {
      return '/placeholder.svg';
    }
  };

  const downloadPDF = () => {
    if (!invoiceRef.current) return;

    const element = invoiceRef.current;
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `invoice_${order.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const printInvoice = () => {
    if (!invoiceRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            @media print {
              body { margin: 0; padding: 15px; }
            }
          </style>
        </head>
        <body>
          ${invoiceRef.current.outerHTML}
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={downloadPDF} className="bg-[#7A1F2B] hover:bg-[#457a3d]">
          <Download className="w-4 h-4 mr-2" />
          Download Invoice
        </Button>
        <Button onClick={printInvoice} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Invoice Template */}
      <div ref={invoiceRef} className="bg-white p-8 rounded-lg shadow-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#7A1F2B]">INVOICE</h1>
            <p className="text-gray-600 mt-1">#{order.id}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">Your Store Name</h2>
            <p className="text-sm text-gray-600">123 Business Street</p>
            <p className="text-sm text-gray-600">City, State 123456</p>
            <p className="text-sm text-gray-600">support@yourstore.com</p>
          </div>
        </div>

        {/* Dates & Info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-sm text-gray-600">Invoice Date</p>
            <p className="font-semibold">{formatDate(order.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Order Date</p>
            <p className="font-semibold">{formatDate(order.created_at)}</p>
          </div>
        </div>

        {/* Billing & Shipping */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-2 text-gray-800">Bill To:</h3>
            {userDetails ? (
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-800">{userDetails.name}</p>
                <p>{userDetails.email}</p>
                {userDetails.phone && <p>{userDetails.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Customer information not available</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-800">Shipping Address:</h3>
            {order.shipping_address ? (
              <p className="text-sm text-gray-600 whitespace-pre-line">{order.shipping_address}</p>
            ) : (
              <p className="text-sm text-gray-500">Address not available</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="py-3 px-2 text-left">Item</th>
                <th className="py-3 px-2 text-center">Quantity</th>
                <th className="py-3 px-2 text-right">Price</th>
                <th className="py-3 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getProductImageUrl(item.product_image || item.product?.images)} 
                          alt={item.product_name}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                        />
                        <span className="font-medium">{item.product_name || `Product #${item.product_id}`}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">{item.quantity}</td>
                    <td className="py-3 px-2 text-right">{formatPrice(item.price)}</td>
                    <td className="py-3 px-2 text-right">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    No items details available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="font-medium">Subtotal:</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200">
              <span className="font-medium">Shipping:</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200 text-lg font-bold">
              <span>Total:</span>
              <span className="text-[#7A1F2B]">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="grid grid-cols-2 gap-8 border-t border-gray-200 pt-6">
          <div>
            <h3 className="font-semibold mb-2 text-gray-800">Payment Method:</h3>
            <p className="text-sm capitalize">{order.payment_method || 'Cash on Delivery'}</p>
            <p className="text-sm mt-1">
              Payment Status: <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                {order.payment_status || 'Unpaid'}
              </span>
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-800">Order Status:</h3>
            <p className="text-sm capitalize">{order.status}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
          <p>Thank you for your business!</p>
          <p className="mt-1">For any queries, contact support@yourstore.com</p>
        </div>

        {/* Terms */}
        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>This is a computer generated invoice, no signature required.</p>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoice;