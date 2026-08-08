import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart, Trash2, X, Plus, Minus, ArrowRight, Tag, Truck,
  Percent, Receipt, Copy, CheckCheck, Loader2, ArrowLeft, Shield,
  Package, Gift, Mail, Lock, User, Phone, AlertCircle, CheckCircle,
  MapPin, Smartphone, Sparkles, LogIn, ShieldAlert, UserPlus, QrCode,
  Clock, Download, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import ProductGrid from '@/components/ProductGrid';
import { BASE_URL } from '../config';
import QRCode from 'qrcode';

type CouponShape = {
  id: string | number;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'amount';
  discount_value: number;
  minimum_purchase: number;
  valid_from?: string;
  valid_to?: string;
  max_uses?: number;
  used_count?: number;
  active?: boolean;
  is_active?: boolean;
  status?: string;
};

// ═══════════════════════════════════════════════════════════
//  HELPER: Detect if device is mobile
// ═══════════════════════════════════════════════════════════
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// ═══════════════════════════════════════════════════════════
//  GLOBAL AUTH EVENT HELPERS
// ═══════════════════════════════════════════════════════════
export const dispatchAuthLogin = (token: string) => {
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: { type: 'login', token } }));
};

export const dispatchAuthLogout = () => {
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: { type: 'logout' } }));
};

// ═══════════════════════════════════════════════════════════
//  HELPER: Extract payment URL (UPDATED - NO LOGS)
// ═══════════════════════════════════════════════════════════
const extractPaymentUrl = (data: any): string | null => {
  if (!data) return null;

  // Priority 1: Check for UPI data string (from Mizor Pay)
  if (data.qr_data_string && typeof data.qr_data_string === 'string') {
    if (data.qr_data_string.startsWith('upi://') || data.qr_data_string.startsWith('http')) {
      return data.qr_data_string;
    }
  }

  if (data.gateway_response?.qr_data_string) {
    if (data.gateway_response.qr_data_string.startsWith('upi://') || 
        data.gateway_response.qr_data_string.startsWith('http')) {
      return data.gateway_response.qr_data_string;
    }
  }

  const isValidUrl = (val: any): string | null => {
    if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('upi://'))) return val;
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string' && 
        (val[0].startsWith('http') || val[0].startsWith('upi://'))) return val[0];
    return null;
  };

  // Priority 2: Check gateway_response
  const gwResponse = data.gateway_response;
  if (gwResponse) {
    const gwUrl = isValidUrl(gwResponse.intent_url) ||
      isValidUrl(gwResponse.payment_link) ||
      isValidUrl(gwResponse.payment_url) ||
      isValidUrl(gwResponse.redirect_url) ||
      isValidUrl(gwResponse.url) ||
      isValidUrl(gwResponse.link);
    if (gwUrl) return gwUrl;
  }

  // Priority 3: Check top level
  const topUrl = isValidUrl(data.intent_url) ||
    isValidUrl(data.payment_link) ||
    isValidUrl(data.payment_url) ||
    isValidUrl(data.redirect_url) ||
    isValidUrl(data.url) ||
    isValidUrl(data.link);
  if (topUrl) return topUrl;

  // Priority 4: Check nested data
  if (data.data) {
    const nestedUrl = isValidUrl(data.data.intent_url) ||
      isValidUrl(data.data.payment_link) ||
      isValidUrl(data.data.payment_url) ||
      isValidUrl(data.data.redirect_url) ||
      isValidUrl(data.data.url) ||
      isValidUrl(data.data.link);
    if (nestedUrl) return nestedUrl;

    if (data.data.gateway_response) {
      const nestedGwUrl = isValidUrl(data.data.gateway_response.intent_url) ||
        isValidUrl(data.data.gateway_response.payment_link) ||
        isValidUrl(data.data.gateway_response.payment_url) ||
        isValidUrl(data.data.gateway_response.redirect_url);
      if (nestedGwUrl) return nestedGwUrl;
    }
  }

  if (typeof data === 'string' && (data.startsWith('http') || data.startsWith('upi://'))) {
    return data;
  }

  return null;
};

// ═══════════════════════════════════════════════════════════
//  HOOK: useAuthState
// ═══════════════════════════════════════════════════════════
const getTokenFromStorage = () =>
  localStorage.getItem('access_token') ||
  localStorage.getItem('token') ||
  localStorage.getItem('userToken') ||
  null;

const useAuthState = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!getTokenFromStorage());
  const [token, setToken] = useState<string | null>(() => getTokenFromStorage());

  useEffect(() => {
    const syncAuth = () => {
      const t = getTokenFromStorage();
      setIsLoggedIn(!!t);
      setToken(t);
    };

    const handleAuthChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === 'logout') {
        setIsLoggedIn(false);
        setToken(null);
      } else if (detail?.type === 'login') {
        setIsLoggedIn(true);
        setToken(detail.token || getTokenFromStorage());
      } else {
        syncAuth();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'access_token' ||
        e.key === 'token' ||
        e.key === 'userToken' ||
        e.key === null
      ) {
        syncAuth();
      }
    };

    window.addEventListener('auth-changed', handleAuthChanged);
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(syncAuth, 3000);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChanged);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  return { isLoggedIn, token };
};

// ═══════════════════════════════════════════════════════════
//  QR CODE MODAL (UPDATED - NO LOGS)
// ═══════════════════════════════════════════════════════════
interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string;
  upiUrl: string;
  timeRemaining: number;
  transactionId: string;
  orderId: string;
  amount: number;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  qrCodeUrl,
  upiUrl,
  timeRemaining,
  transactionId,
  orderId,
  amount,
}) => {
  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;
  const [copied, setCopied] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(true);
  const canvasRef = useRef<HTMLImageElement>(null);

  // Generate QR code from UPI URL if not provided
  useEffect(() => {
    if (!isOpen) return;

    const generateQR = async () => {
      setIsGeneratingQR(true);
      try {
        // Use provided QR code URL if available and valid
        if (qrCodeUrl && (qrCodeUrl.startsWith('http') || qrCodeUrl.startsWith('data:'))) {
          setGeneratedQR(qrCodeUrl);
          setIsGeneratingQR(false);
          return;
        }

        // Otherwise, generate QR code from UPI URL (upiUrl should be the UPI string)
        if (upiUrl && (upiUrl.startsWith('upi://') || upiUrl.startsWith('http'))) {
          const dataUrl = await QRCode.toDataURL(upiUrl, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: 300,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          
          setGeneratedQR(dataUrl);
        } else {
          setGeneratedQR('');
        }
      } catch (error) {
        toast.error('Failed to generate QR code');
        setGeneratedQR('');
      } finally {
        setIsGeneratingQR(false);
      }
    };

    generateQR();
  }, [isOpen, qrCodeUrl, upiUrl]);

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(upiUrl);
      setCopied(true);
      toast.success('UPI URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy UPI URL');
    }
  };

  const handleDownloadQR = async () => {
    try {
      if (!generatedQR) {
        toast.error('QR code not ready yet');
        return;
      }

      const link = document.createElement('a');
      link.href = generatedQR;
      link.download = `payment-qr-${transactionId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR code downloaded!');
    } catch (error) {
      toast.error('Failed to download QR code');
    }
  };

  const isExpired = timeRemaining <= 0;
  const displayQR = generatedQR || qrCodeUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-blush rounded-full flex items-center justify-center">
            <QrCode className="h-8 w-8 text-maroon" strokeWidth={1.5} />
          </div>
          <DialogTitle className="font-serif text-2xl font-medium text-center text-espresso">
            Scan to Pay
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            Quick payment via UPI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Time Remaining */}
          <div
            className={`p-4 rounded-sm border flex items-center justify-between ${
              isExpired
                ? 'bg-red-50 border-red-200'
                : timeRemaining < 60
                ? 'bg-ivory border-gold/50'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock
                className={`h-5 w-5 ${
                  isExpired
                    ? 'text-sale'
                    : timeRemaining < 60
                    ? 'text-gold'
                    : 'text-green-700'
                }`}
              />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Time Remaining
                </p>
                <p
                  className={`text-lg font-semibold ${
                    isExpired
                      ? 'text-sale'
                      : timeRemaining < 60
                      ? 'text-espresso'
                      : 'text-green-700'
                  }`}
                >
                  {Math.floor(timeRemaining / 60)}:
                  {String(timeRemaining % 60).padStart(2, '0')}
                </p>
              </div>
            </div>
            {isExpired && (
              <Button
                size="sm"
                onClick={onClose}
                className="bg-maroon hover:bg-terracotta text-ivory text-xs font-semibold uppercase tracking-[0.12em] rounded-sm transition-colors"
              >
                Request New QR
              </Button>
            )}
          </div>

          {/* QR Code Display */}
          {!isExpired ? (
            <div className="p-6 bg-ivory rounded-sm border border-dashed border-border flex flex-col items-center">
              <div className="w-64 h-64 bg-white rounded-sm p-4 border border-border flex items-center justify-center overflow-hidden">
                {isGeneratingQR ? (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2 text-maroon" />
                    <p className="text-xs text-muted-foreground">Generating QR code...</p>
                  </div>
                ) : displayQR ? (
                  <img
                    ref={canvasRef}
                    src={displayQR}
                    alt="Payment QR Code"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-8 w-8 text-sale mb-2" />
                    <p className="text-xs text-sale">Failed to load QR code</p>
                    <p className="text-xs text-muted-foreground mt-1">Use the link below</p>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center font-medium">
                📱 Scan with any UPI app to pay
              </p>
              <p className="text-sm font-semibold text-espresso mt-1">
                {formatPrice(amount)}
              </p>
            </div>
          ) : (
            <div className="p-6 bg-red-50 rounded-sm border border-red-200 flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-sale mb-3" />
              <h4 className="font-serif text-lg font-medium text-espresso mb-2">
                QR Code Expired
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                The QR code has expired. Please request a new one to complete
                your payment.
              </p>
              <Button
                onClick={onClose}
                className="bg-maroon hover:bg-terracotta text-ivory text-xs font-semibold uppercase tracking-[0.16em] rounded-sm w-full transition-colors"
              >
                Request New QR
              </Button>
            </div>
          )}

          {/* Payment Details */}
          <div className="p-4 bg-ivory rounded-sm border border-border space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-espresso">
              Payment Details
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-espresso">
                  {formatPrice(amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm gap-2">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-xs text-espresso bg-white px-2 py-1 rounded-sm border border-border break-all text-right max-w-[150px]">
                  {orderId}
                </span>
              </div>
              <div className="flex justify-between text-sm gap-2">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs text-espresso bg-white px-2 py-1 rounded-sm border border-border break-all text-right max-w-[150px]">
                  {transactionId}
                </span>
              </div>
            </div>
          </div>

          {/* Alternative Payment Methods */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-espresso">
              💡 Alternative Payment Methods
            </p>

            {/* Copy UPI URL */}
            <button
              onClick={handleCopyUPI}
              className="w-full p-3 rounded-sm border border-border bg-white hover:bg-ivory transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-terracotta" />
                  <span className="text-sm font-medium text-espresso">
                    {copied ? '✅ Copied!' : '📋 Copy UPI Link'}
                  </span>
                </div>
                {copied ? (
                  <CheckCheck className="h-4 w-4 text-green-700" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Paste in UPI app or browser
              </p>
            </button>

            {/* Open in UPI App */}
            <button
              onClick={() => {
                window.location.href = upiUrl;
              }}
              className="w-full p-3 rounded-sm border border-maroon bg-ivory hover:bg-blush transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-maroon" />
                  <span className="text-sm font-medium text-maroon">
                    🚀 Open in UPI App
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-maroon" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Direct payment via installed UPI app
              </p>
            </button>

            {/* Download QR */}
            {displayQR && (
              <button
                onClick={handleDownloadQR}
                className="w-full p-3 rounded-sm border border-border bg-white hover:bg-ivory transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-terracotta" />
                    <span className="text-sm font-medium text-espresso">
                      💾 Download QR Code
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-terracotta" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Save QR code to pay later
                </p>
              </button>
            )}
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blush rounded-sm border border-border">
            <p className="text-xs text-espresso leading-relaxed">
              <strong>💡 How to Pay:</strong>
              <br />
              1. Open any UPI app (Google Pay, PhonePe, Paytm, etc.)
              <br />
              2. Scan this QR code or paste the link
              <br />
              3. Confirm payment
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 text-xs font-semibold uppercase tracking-[0.16em] rounded-sm"
          >
            Close
          </Button>
          <Button
            onClick={() => {
              window.location.href = upiUrl;
            }}
            className="flex-1 bg-maroon hover:bg-terracotta text-ivory text-xs font-semibold uppercase tracking-[0.16em] rounded-sm transition-colors"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Pay Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════
//  LOGIN REQUIRED BANNER
// ═══════════════════════════════════════════════════════════
interface LoginRequiredBannerProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const LoginRequiredBanner: React.FC<LoginRequiredBannerProps> = ({
  onLoginClick,
  onRegisterClick,
}) => {
  return (
    <div className="mb-8 overflow-hidden rounded-sm border border-border bg-white">
      <div className="h-1 bg-gold" />
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blush rounded-full flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-maroon" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg font-medium text-espresso mb-1 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gold" />
              Login Required to Purchase
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You need to <strong>sign in</strong> or{' '}
              <strong>create an account</strong> before you
              can checkout and place an order.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={onLoginClick}
              className="bg-maroon hover:bg-terracotta text-ivory text-xs font-semibold uppercase tracking-[0.16em] rounded-sm transition-colors"
              size="lg"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button
              onClick={onRegisterClick}
              variant="outline"
              className="text-xs font-semibold uppercase tracking-[0.16em] rounded-sm"
              size="lg"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Sign Up
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Shield, color: 'green', label: 'Secure checkout' },
              { icon: Package, color: 'blue', label: 'Track your orders' },
              { icon: Gift, color: 'purple', label: 'Exclusive coupons' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-6 h-6 bg-blush rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3 w-3 text-terracotta" />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  PAYMENT METHOD MODAL (UPDATED - NO LOGS)
// ═══════════════════════════════════════════════════════════
interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: string, orderData: any) => void;
  total: number;
  discount: number;
  cartItems: Array<{
    id: string;
    quantity: number;
    product: Product;
    color?: string;
    size?: string;
  }>;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  total,
  discount,
  cartItems,
}) => {
  const navigate = useNavigate();

  const modalSubtotal = cartItems.reduce(
    (sum, item) =>
      sum + (item.product.discountPrice || item.product.price) * item.quantity,
    0
  );
  const modalShipping = modalSubtotal > 999 ? 0 : 150;

  const [selectedMethod, setSelectedMethod] = useState<string>('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('India');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [detectedUser, setDetectedUser] = useState<{
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null>(null);

  // QR Code Modal state
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [upiUrl, setUpiUrl] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  const formatPrice = (price: number) =>
    `₹${price.toLocaleString('en-IN')}`;

  const fullShippingAddress = useMemo(
    () =>
      [addressLine1, addressLine2, city, addressState, country]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(', '),
    [addressLine1, addressLine2, city, addressState, country]
  );

  // Timer for QR code expiration
  useEffect(() => {
    if (!showQRModal) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showQRModal]);

  useEffect(() => {
    if (!isOpen) return;

    const loadUserData = async () => {
      setIsLoadingProfile(true);
      const token = getTokenFromStorage();

      if (!token) {
        onClose();
        navigate('/login');
        return;
      }

      try {
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
          const u = JSON.parse(storedUserStr);
          const firstName = u.first_name || '';
          const lastName = u.last_name || '';
          const name =
            [firstName, lastName].filter(Boolean).join(' ') ||
            u.name ||
            '';
          const email = u.email || '';
          const phone = u.phone || u.mobile || u.phone_no || '';
          if (name || email)
            setDetectedUser({ name, firstName, lastName, email, phone });
          setAddressLine1(u.address_line1 || u.address || u.street || '');
          setAddressLine2(u.address_line2 || '');
          setCity(u.city || '');
          setAddressState(u.state || u.region || '');
          setZipCode(
            String(u.pincode || u.zip_code || u.postal_code || u.zip || '')
          );
          setCountry(u.country || 'India');
        }
      } catch (e) {
        // Silent error handling
      }

      try {
        let response = await fetch(`${BASE_URL}/users/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          response = await fetch(`${BASE_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          });
        }
        if (response.ok) {
          const data = await response.json();
          const user = data.user || data.data || data;
          const firstName = user.first_name || '';
          const lastName = user.last_name || '';
          const name =
            [firstName, lastName].filter(Boolean).join(' ') ||
            user.name ||
            'Valued Customer';
          const email = user.email || '';
          const phone = user.phone || user.mobile || user.phone_no || '';
          setDetectedUser({ name, firstName, lastName, email, phone });
          setAddressLine1(user.address_line1 || user.address || user.street || '');
          setAddressLine2(user.address_line2 || '');
          setCity(user.city || '');
          setAddressState(user.state || user.region || '');
          setZipCode(
            String(
              user.pincode || user.zip_code || user.postal_code || user.zip || ''
            )
          );
          setCountry(user.country || 'India');
        }
      } catch (error) {
        // Silent error handling
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserData();
  }, [isOpen]);

  const paymentMethods = [
    {
      id: 'cod',
      name: 'Cash on Delivery',
      description: 'Pay when you receive your order',
      icon: Package,
      active: true,
      gradient: 'bg-espresso',
      bgGradient: 'bg-ivory',
      borderColor: 'border-border',
      selectedBorder: 'border-maroon',
    },
    {
      id: 'online',
      name: 'Online Payment',
      description: 'UPI, Credit Card, Debit Card, Net Banking',
      icon: Smartphone,
      active: true,
      gradient: 'bg-maroon',
      bgGradient: 'bg-ivory',
      borderColor: 'border-border',
      selectedBorder: 'border-maroon',
    },
  ];

  const handlePlaceOrder = async () => {
    const token = getTokenFromStorage();

    if (!token) {
      onClose();
      navigate('/login');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!addressLine1.trim()) {
      toast.error('Please enter your address (Line 1)');
      return;
    }
    if (!city.trim()) {
      toast.error('Please enter your city');
      return;
    }
    if (!addressState.trim()) {
      toast.error('Please enter your state');
      return;
    }
    if (!zipCode.trim()) {
      toast.error('Please enter a PIN code');
      return;
    }
    if (!/^\d{4,6}$/.test(zipCode.trim())) {
      toast.error('Please enter a valid PIN code (4-6 digits)');
      return;
    }

    setIsPlacingOrder(true);
    try {
      if (selectedMethod !== 'cod') {
        // ═══════════════════════════════════════════════════════════
        //  ONLINE PAYMENT (NO LOGS)
        // ═══════════════════════════════════════════════════════════
        let firstName = detectedUser?.firstName || '';
        let lastName = detectedUser?.lastName || '';
        if (!firstName && detectedUser?.name) {
          const nameParts = detectedUser.name.trim().split(/\s+/);
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }

        const paymentPayload = {
          first_name: firstName,
          last_name: lastName,
          email: detectedUser?.email || '',
          phone_no: detectedUser?.phone || '',
          address: fullShippingAddress,
          zip: zipCode.trim(),
          amount: Number(total),
        };

        const response = await fetch(`${BASE_URL}/users/initiate-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(paymentPayload),
        });

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            ['access_token', 'token', 'userToken', 'user'].forEach((k) =>
              localStorage.removeItem(k)
            );
            dispatchAuthLogout();
            onClose();
            navigate('/login');
            return;
          }
          throw new Error(result.message || result.detail || 'Payment initiation failed');
        }

        if (!result.success) {
          throw new Error(result.message || 'Payment initiation failed');
        }

        // ✅ EXTRACT PAYMENT URL
        const paymentUrl = extractPaymentUrl(result);

        if (!paymentUrl) {
          throw new Error('Payment gateway did not return a payment link.');
        }

        const isValidUrl = paymentUrl.startsWith('http') || paymentUrl.startsWith('upi://');
        if (!isValidUrl) {
          throw new Error('Invalid payment URL format received from gateway');
        }

        const txnId =
          result.mizor_pay_txn_id ||
          result.gateway_response?.mizor_pay_txn_id ||
          '';
        const oId =
          result.order_id || result.gateway_response?.order_id || '';

        try {
          localStorage.setItem(
            'pending_payment',
            JSON.stringify({
              method: selectedMethod,
              txn_id: txnId,
              order_id: oId,
              total,
              timestamp: Date.now(),
              cartItems: cartItems.map((item) => ({
                product_id: item.product.id,
                quantity: item.quantity,
              })),
            })
          );
        } catch (e) {
          // Silent error handling
        }

        // ═══════════════════════════════════════════════════════════
        //  DETECT DEVICE AND HANDLE PAYMENT
        // ═══════════════════════════════════════════════════════════
        const isMobile = isMobileDevice();

        if (isMobile) {
          // ✅ MOBILE: REDIRECT TO UPI APP
          toast.success('Opening UPI app...');
          setTimeout(() => {
            window.location.href = paymentUrl;
          }, 500);
        } else {
          // ✅ DESKTOP: SHOW QR CODE MODAL
          setUpiUrl(paymentUrl);
          setQrCodeUrl('');
          setTransactionId(txnId);
          setOrderId(oId);
          setTimeRemaining(300);
          setShowQRModal(true);
          toast.success('QR code ready! Scan with your UPI app.');
        }
        return;
      } else {
        // ═══════════════════════════════════════════════════════════
        //  COD ORDER
        // ═══════════════════════════════════════════════════════════
        const orderPayload = {
          items: cartItems.map((item) => ({
            product_id: Number(item.product.id),
            quantity: Number(item.quantity),
          })),
          payment_method: 'cod',
          shipping_address: fullShippingAddress,
        };

        const response = await fetch(`${BASE_URL}/users/orders/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderPayload),
        });

        const orderData = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (response.status === 401) {
            ['access_token', 'token', 'userToken', 'user'].forEach((k) =>
              localStorage.removeItem(k)
            );
            dispatchAuthLogout();
            onClose();
            navigate('/login');
            return;
          }
          if (response.status === 422) {
            const validationErrors = orderData?.detail;
            if (Array.isArray(validationErrors)) {
              throw new Error(
                `Validation error: ${validationErrors
                  .map(
                    (err: any) =>
                      `${err.loc?.slice(-1)[0]}: ${err.msg}`
                  )
                  .join(', ')}`
              );
            }
          }
          throw new Error(
            orderData?.detail ||
              orderData?.message ||
              'Failed to place order'
          );
        }

        toast.success(
          `Order #${orderData.id || orderData.order_id || ''} placed successfully! 🎉`
        );
        onConfirm(selectedMethod, orderData);
      }
    } catch (error: any) {
      toast.error(
        error?.message || 'Failed to place order. Please try again.'
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-blush rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-maroon" strokeWidth={1.5} />
            </div>
            <DialogTitle className="font-serif text-2xl font-medium text-center text-espresso">
              Select Payment Method
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground pt-2">
              Choose how you'd like to pay
            </DialogDescription>
          </DialogHeader>

          {/* Contact Details */}
          <div className="bg-ivory p-4 rounded-sm border border-border mb-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Contact Details
            </h4>
            {isLoadingProfile && !detectedUser ? (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Detecting user info...
              </div>
            ) : detectedUser ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-maroon rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-ivory text-xs font-semibold">
                      {detectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="font-semibold text-espresso text-sm">
                    {detectedUser.name}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-11">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
                    <span className="truncate">{detectedUser.email}</span>
                  </div>
                  {detectedUser.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
                      <span>{detectedUser.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs text-sale italic py-2">
                <AlertCircle className="w-3.5 h-3.5" /> Could not load user details.
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-3 py-2">
            {paymentMethods.map((method) => {
              const IconComponent = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => {
                    if (method.active) setSelectedMethod(method.id);
                  }}
                  disabled={!method.active || isPlacingOrder}
                  className={`w-full p-4 rounded-sm border transition-colors duration-200 text-left ${
                    method.active
                      ? isSelected
                        ? `${method.bgGradient} ${method.selectedBorder}`
                        : `bg-white hover:bg-ivory ${method.borderColor} hover:border-espresso/40 cursor-pointer`
                      : 'bg-ivory border-border cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 ${method.gradient} rounded-sm flex items-center justify-center flex-shrink-0`}
                    >
                      <IconComponent className="h-5 w-5 text-ivory" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-medium ${
                            method.active ? 'text-espresso' : 'text-muted-foreground'
                          }`}
                        >
                          {method.name}
                        </p>
                        {method.active && isSelected && (
                          <CheckCircle className="h-5 w-5 text-maroon" />
                        )}
                      </div>
                      <p
                        className={`text-[13px] ${
                          method.active ? 'text-muted-foreground' : 'text-muted-foreground/60'
                        }`}
                      >
                        {method.description}
                      </p>
                    </div>
                    {method.active && (
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-maroon bg-maroon'
                            : 'border-border'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 bg-ivory rounded-full" />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Shipping Address - Read Only */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-[0.12em] text-espresso flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" /> Shipping Address
              </span>
              <div className="flex items-center gap-2">
                {(addressLine1 || city || addressState || zipCode) && (
                  <span className="text-[10px] normal-case tracking-normal text-green-700 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-sm">
                    <Sparkles className="w-3 h-3" /> Auto-filled
                  </span>
                )}
                <span className="text-[10px] normal-case tracking-normal text-muted-foreground flex items-center gap-1 bg-sand px-2 py-0.5 rounded-sm">
                  <Lock className="w-3 h-3" /> Read only
                </span>
              </div>
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: addressLine1, placeholder: 'Address Line 1 (House No, Street)' },
                { value: addressLine2, placeholder: 'Address Line 2 (Landmark, Area)' },
              ].map(({ value, placeholder }) => (
                <div key={placeholder} className="relative">
                  <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full p-3 border border-input rounded-sm text-sm bg-ivory text-muted-foreground cursor-not-allowed"
                    value={value}
                    readOnly
                    disabled
                    tabIndex={-1}
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: city, placeholder: 'City' },
                  { value: addressState, placeholder: 'State' },
                ].map(({ value, placeholder }) => (
                  <div key={placeholder} className="relative">
                    <input
                      type="text"
                      placeholder={placeholder}
                      className="w-full p-3 border border-input rounded-sm text-sm bg-ivory text-muted-foreground cursor-not-allowed"
                      value={value}
                      readOnly
                      disabled
                      tabIndex={-1}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: zipCode, placeholder: 'PIN Code' },
                  { value: country, placeholder: 'Country' },
                ].map(({ value, placeholder }) => (
                  <div key={placeholder} className="relative">
                    <input
                      type="text"
                      placeholder={placeholder}
                      className="w-full p-3 border border-input rounded-sm text-sm bg-ivory text-muted-foreground cursor-not-allowed"
                      value={value}
                      readOnly
                      disabled
                      tabIndex={-1}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  </div>
                ))}
              </div>
              {isLoadingProfile &&
                !(addressLine1 || city || addressState || zipCode) && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-maroon" />
                  </div>
                )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-3 bg-ivory rounded-sm border border-border">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-espresso mb-2">
              Order Summary ({cartItems.length}{' '}
              {cartItems.length === 1 ? 'item' : 'items'})
            </p>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-xs text-muted-foreground"
                >
                  <span className="truncate flex-1 mr-2">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-espresso">
                    {formatPrice(
                      (item.product.discountPrice || item.product.price) *
                        item.quantity
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-dashed border-border space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(modalSubtotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-espresso">
                <span>GST (18%)</span>
                <span>{formatPrice((modalSubtotal * 18) / 100)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Shipping</span>
                <span>
                  {modalShipping === 0 ? (
                    <span className="text-green-700">Free</span>
                  ) : (
                    formatPrice(modalShipping)
                  )}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-xs font-medium text-green-700 bg-green-50 p-1.5 rounded-sm border border-green-200 mt-1">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3" /> Coupon Applied
                  </span>
                  <span>- {formatPrice(discount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="p-4 bg-ivory rounded-sm border border-border">
            <div className="flex justify-between items-center">
              <span className="font-medium text-espresso">Order Total</span>
              <span className="font-serif text-xl font-medium text-espresso">
                {formatPrice(total)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground text-right mt-0.5">
              Inclusive of GST
            </p>
            {selectedMethod === 'cod' ? (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Pay cash when your order is
                delivered
              </p>
            ) : (
              <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Secure payment via UPI/Payment Gateway
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || !selectedMethod}
              className="flex-1 bg-maroon hover:bg-terracotta text-ivory text-xs font-semibold uppercase tracking-[0.16em] rounded-sm transition-colors"
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedMethod === 'cod' ? 'Placing Order...' : 'Processing...'}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {selectedMethod === 'cod'
                    ? 'Place Order'
                    : `Pay ${formatPrice(total)}`}
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="text-xs font-semibold uppercase tracking-[0.16em] rounded-sm"
              disabled={isPlacingOrder}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrCodeUrl={qrCodeUrl}
        upiUrl={upiUrl}
        timeRemaining={timeRemaining}
        transactionId={transactionId}
        orderId={orderId}
        amount={total}
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════
//  ORDER SUCCESS MODAL
// ═══════════════════════════════════════════════════════════
interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: string;
  orderData: any;
}

const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  onClose,
  paymentMethod,
  orderData,
}) => {
  const navigate = useNavigate();
  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;
  const paymentLabels: Record<string, string> = {
    cod: 'Cash on Delivery',
    online: 'Online Payment',
    card: 'Credit/Debit Card',
    upi: 'UPI Payment',
    netbanking: 'Net Banking',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-20 h-20 bg-green-700 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-ivory" strokeWidth={1.5} />
          </div>
          <DialogTitle className="font-serif text-2xl font-medium text-center text-espresso">
            Order Placed Successfully! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            Your order has been confirmed
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {(orderData?.id || orderData?.order_id) && (
            <div className="p-4 bg-ivory rounded-sm border border-border text-center">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Order Number</p>
              <p className="font-serif text-2xl font-medium text-espresso mt-1">
                #{orderData.id || orderData.order_id}
              </p>
            </div>
          )}
          <div className="p-4 bg-green-50 rounded-sm border border-green-200">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="flex-1">
                <h4 className="font-medium text-espresso mb-1">
                  {paymentLabels[paymentMethod] || 'Cash on Delivery'}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {paymentMethod === 'cod' ? (
                    <>
                      Your order will be delivered soon. Please keep{' '}
                      <strong>
                        {orderData?.total_amount
                          ? formatPrice(orderData.total_amount)
                          : ''}
                      </strong>{' '}
                      ready.
                    </>
                  ) : (
                    "Your payment is being processed. We'll notify you once confirmed."
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2 px-2">
            {orderData?.total_amount && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-terracotta" strokeWidth={1.5} /> Total Amount
                </span>
                <span className="font-semibold text-espresso">
                  {formatPrice(orderData.total_amount)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 text-terracotta" strokeWidth={1.5} />
              <span>Estimated delivery: 3-5 business days</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 text-terracotta" strokeWidth={1.5} />
              <span>Order confirmation sent to your email</span>
            </div>
            {orderData?.status && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Package className="h-4 w-4 text-terracotta" strokeWidth={1.5} />
                <span>
                  Status:{' '}
                  <Badge className="bg-green-50 text-green-700 border border-green-200 rounded-sm capitalize hover:bg-green-50">
                    {orderData.status}
                  </Badge>
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => { onClose(); navigate('/'); }}
            className="flex-1 bg-maroon hover:bg-terracotta text-ivory text-xs font-semibold uppercase tracking-[0.16em] rounded-sm transition-colors"
          >
            Continue Shopping
          </Button>
          <Button
            onClick={() => {
              onClose();
              navigate(
                orderData?.id
                  ? `/orders/${orderData.id}`
                  : orderData?.order_id
                  ? `/orders/${orderData.order_id}`
                  : '/orders'
              );
            }}
            variant="outline"
            className="flex-1 text-xs font-semibold uppercase tracking-[0.16em] rounded-sm"
          >
            View Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════
//  MAIN CART PAGE
// ═══════════════════════════════════════════════════════════
const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateCartItem, removeFromCart, clearCart } = useStore();
  const { cart, products } = state;

  const { isLoggedIn } = useAuthState();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponShape | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<CouponShape[]>([]);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('');
  const [createdOrderData, setCreatedOrderData] = useState<any>(null);

  // Close payment modal on logout
  useEffect(() => {
    if (!isLoggedIn) setShowPaymentMethodModal(false);
  }, [isLoggedIn]);

  const cartItems = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return product ? { ...item, product } : null;
      })
      .filter(Boolean) as Array<typeof cart[number] & { product: Product }>;
  }, [cart, products]);

  // Check for pending payment return
  useEffect(() => {
    try {
      const pendingPaymentStr = localStorage.getItem('pending_payment');
      if (pendingPaymentStr) {
        const pendingPayment = JSON.parse(pendingPaymentStr);
        const elapsed = Date.now() - (pendingPayment.timestamp || 0);
        if (elapsed < 30 * 60 * 1000) {
          const urlParams = new URLSearchParams(window.location.search);
          const paymentStatus =
            urlParams.get('status') || urlParams.get('payment_status');
          const txnId =
            urlParams.get('txn_id') || urlParams.get('transaction_id');
          if (paymentStatus === 'success' || paymentStatus === 'completed') {
            setOrderPaymentMethod(pendingPayment.method || 'online');
            setCreatedOrderData({
              transaction_id: txnId || pendingPayment.txn_id,
              total_amount: pendingPayment.total,
              status: 'confirmed',
            });
            clearCart();
            setShowOrderSuccessModal(true);
            localStorage.removeItem('pending_payment');
            window.history.replaceState({}, document.title, window.location.pathname);
          } else if (
            paymentStatus === 'failed' ||
            paymentStatus === 'cancelled'
          ) {
            toast.error('Payment was not completed. Please try again.');
            localStorage.removeItem('pending_payment');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          localStorage.removeItem('pending_payment');
        }
      }
    } catch (e) {
      localStorage.removeItem('pending_payment');
    }
  }, []);

  // Fetch coupons
  useEffect(() => {
    const fetchAvailableCoupons = async () => {
      setLoadingCoupons(true);
      setCouponError(null);
      try {
        const token = getTokenFromStorage();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const endpoints = [
          `${BASE_URL}/users/coupons/active`,
          `${BASE_URL}/coupons/active`,
          `${BASE_URL}/admin/coupons/active`,
          `${BASE_URL}/users/coupons`,
          `${BASE_URL}/coupons`,
        ];
        let couponsData: CouponShape[] = [];
        let success = false;
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, { headers });
            if (response.ok) {
              const res = await response.json();
              if (Array.isArray(res)) couponsData = res;
              else if (res.coupons && Array.isArray(res.coupons))
                couponsData = res.coupons;
              else if (res.data && Array.isArray(res.data))
                couponsData = res.data;
              else if (res.results && Array.isArray(res.results))
                couponsData = res.results;
              else if (typeof res === 'object' && res.code)
                couponsData = [res];
              else continue;
              success = true;
              break;
            }
          } catch (err) {
            // Silent error handling
          }
        }
        if (success && couponsData.length > 0) {
          const normalizedCoupons = couponsData.map((coupon: any) => ({
            id: coupon.id || coupon._id || Math.random().toString(),
            code: coupon.code || coupon.coupon_code || '',
            description: coupon.description || coupon.desc || '',
            discount_type: coupon.discount_type || coupon.type || 'percentage',
            discount_value: Number(
              coupon.discount_value || coupon.value || coupon.discount || 0
            ),
            minimum_purchase: Number(
              coupon.minimum_purchase ||
                coupon.min_purchase ||
                coupon.min_order ||
                0
            ),
            valid_from: coupon.valid_from || coupon.start_date || '',
            valid_to:
              coupon.valid_to || coupon.end_date || coupon.expires_at || '',
            max_uses: coupon.max_uses || coupon.usage_limit || null,
            used_count: coupon.used_count || coupon.times_used || 0,
            active:
              coupon.active !== undefined
                ? coupon.active
                : coupon.is_active !== undefined
                ? coupon.is_active
                : true,
          }));
          setAvailableCoupons(normalizedCoupons);
        } else {
          setAvailableCoupons([]);
          if (!success) setCouponError('Could not load coupons');
        }
      } catch (error) {
        setAvailableCoupons([]);
        setCouponError('Failed to load coupons');
      } finally {
        setLoadingCoupons(false);
      }
    };
    fetchAvailableCoupons();
  }, []);

  const handleCopyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      toast.success(`Copied: ${code}`);
      setTimeout(() => setCopiedCoupon(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleApplyCopiedCoupon = (code: string) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setCouponCode(code);
    setTimeout(() => handleApplyCouponWithCode(code), 100);
  };

  const subtotal = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const price = item.product?.discountPrice || item.product?.price || 0;
        return total + price * item.quantity;
      }, 0),
    [cartItems]
  );

  const shipping = subtotal > 999 ? 0 : 150;
  const gstRate = 18;
  const gstAmount = (subtotal * gstRate) / 100;
  const totalBeforeDiscount = subtotal + shipping - discount;

  const total = Math.max(0, totalBeforeDiscount);

  const baseAmount = Number((total / 1.18).toFixed(2));
  const includedGstAmount = Number((total - baseAmount).toFixed(2));

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity < 1) return;
    updateCartItem(id, quantity);
  };

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
    toast.success('Item removed from cart');
  };

  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

  const getImageUrl = (product: Product) => {
    try {
      const imagesArray =
        typeof product.images === 'string'
          ? JSON.parse(product.images)
          : product.images;
      const firstImage = imagesArray?.[0];
      return firstImage
        ? `${BASE_URL.replace('/api/v1', '')}/${firstImage.replace(/^\/+/, '')}`
        : '/placeholder.svg';
    } catch {
      return '/placeholder.svg';
    }
  };

  const handleApplyCouponAPI = async (code: string) => {
    const token = getTokenFromStorage();
    if (!token) { navigate('/login'); throw new Error('Redirecting to login...'); }
    const applyEndpoints = [
      `${BASE_URL}/users/apply?code=${encodeURIComponent(code)}`,
      `${BASE_URL}/coupons/apply?code=${encodeURIComponent(code)}`,
      `${BASE_URL}/users/coupons/apply?code=${encodeURIComponent(code)}`,
    ];
    for (const endpoint of applyEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (typeof data === 'string') {
            const localCoupon = availableCoupons.find(
              (c) => c.code.toUpperCase() === code.toUpperCase()
            );
            if (localCoupon) return localCoupon;
            return { code, discount_type: 'percentage', discount_value: 0, message: data };
          }
          return data;
        }
        if (response.status === 422 || response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.detail || errorData.message || 'Invalid coupon';
          if (typeof errorMsg === 'string') throw new Error(errorMsg);
          if (Array.isArray(errorMsg))
            throw new Error(errorMsg.map((e: any) => e.msg || e.message).join(', '));
          throw new Error('Invalid coupon code');
        }
      } catch (err: any) {
        if (err.message && !err.message.includes('fetch')) throw err;
      }
    }
    throw new Error('Could not validate coupon. Please try again.');
  };

  const handleApplyCouponLocal = (code: string) => {
    const coupon = availableCoupons.find(
      (c) => c.code.toUpperCase() === code.toUpperCase()
    );
    if (!coupon) throw new Error('Coupon not found.');
    if (coupon.active === false) throw new Error('This coupon is no longer active');
    const now = new Date();
    if (coupon.valid_from && now < new Date(coupon.valid_from))
      throw new Error('This coupon is not yet valid');
    if (coupon.valid_to && now > new Date(coupon.valid_to))
      throw new Error('This coupon has expired');
    if (subtotal < coupon.minimum_purchase)
      throw new Error(
        `Minimum purchase of ₹${coupon.minimum_purchase.toLocaleString('en-IN')} required`
      );
    if (
      coupon.max_uses &&
      coupon.used_count &&
      coupon.used_count >= coupon.max_uses
    )
      throw new Error('This coupon has reached its usage limit');
    return coupon;
  };

  const handleApplyCouponWithCode = async (code: string) => {
    if (!code.trim()) { toast.error('Please enter a coupon code'); return; }
    if (cartItems.length === 0) { toast.error('Your cart is empty'); return; }
    if (!isLoggedIn) { navigate('/login'); return; }
    setIsApplyingCoupon(true);
    try {
      let couponData: any;
      try { couponData = await handleApplyCouponAPI(code.trim()); }
      catch (apiError: any) {
        if (apiError.message && !apiError.message.includes('Could not validate'))
          throw apiError;
        couponData = handleApplyCouponLocal(code.trim());
      }
      const dtype = String(couponData.discount_type || couponData.type || '').toLowerCase();
      const dval = Number(couponData.discount_value || couponData.value || couponData.discount || 0);
      let computedDiscount =
        dtype === 'percentage' || dtype === 'percent'
          ? (subtotal * dval) / 100
          : dval;
      computedDiscount = Math.min(computedDiscount, subtotal);
      if (computedDiscount <= 0) {
        const localCoupon = availableCoupons.find(
          (c) => c.code.toUpperCase() === code.toUpperCase().trim()
        );
        if (localCoupon) {
          const ltype = String(localCoupon.discount_type).toLowerCase();
          const lval = Number(localCoupon.discount_value);
          computedDiscount =
            ltype === 'percentage' ? (subtotal * lval) / 100 : lval;
          computedDiscount = Math.min(computedDiscount, subtotal);
          couponData = localCoupon;
        }
      }
      setDiscount(computedDiscount);
      setDiscountType(
        dtype === 'percentage' || dtype === 'percent' ? 'percentage' : 'fixed'
      );
      setAppliedCoupon(couponData);
      if (computedDiscount > 0)
        toast.success(
          `🎉 Coupon applied! You saved ₹${computedDiscount.toLocaleString('en-IN')}`
        );
      else toast.success('Coupon applied successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to apply coupon');
      setDiscount(0);
      setDiscountType(null);
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleApplyCoupon = async () => {
    await handleApplyCouponWithCode(couponCode);
  };

  const handleRemoveDiscount = () => {
    setDiscount(0);
    setDiscountType(null);
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) { toast.error('Your cart is empty.'); return; }
    if (!isLoggedIn) { navigate('/login'); return; }
    setShowPaymentMethodModal(true);
  };

  const handleOrderConfirm = (method: string, orderData: any) => {
    setOrderPaymentMethod(method);
    setCreatedOrderData(orderData);
    setShowPaymentMethodModal(false);
    clearCart();
    setDiscount(0);
    setDiscountType(null);
    setAppliedCoupon(null);
    setCouponCode('');
    setShowOrderSuccessModal(true);
  };

  const recommendedProducts = useMemo(
    () =>
      products.filter((p) => p.featured || (p as any).bestSeller).slice(0, 8),
    [products]
  );

  const displayCoupons = useMemo(() => {
    if (!Array.isArray(availableCoupons) || availableCoupons.length === 0)
      return [];
    return availableCoupons.filter((coupon) => {
      const isActive =
        coupon.active !== false && coupon.is_active !== false;
      const now = new Date();
      const notExpired =
        !coupon.valid_to || now <= new Date(coupon.valid_to);
      const hasStarted =
        !coupon.valid_from || now >= new Date(coupon.valid_from);
      const hasUsesLeft =
        !coupon.max_uses ||
        !coupon.used_count ||
        coupon.used_count < coupon.max_uses;
      return isActive && notExpired && hasStarted && hasUsesLeft;
    });
  }, [availableCoupons]);

  const isCouponEligible = (coupon: CouponShape) =>
    subtotal >= Number(coupon.minimum_purchase || 0);

  // ═══════════════════════════════════════════════════
  //  EMPTY CART VIEW
  // ═══════════════════════════════════════════════════
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-blush rounded-full flex items-center justify-center mx-auto">
                <ShoppingCart className="h-10 w-10 text-maroon" strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso mb-4">
              Your bag is empty
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Add items you love to your bag and start shopping
            </p>

            {!isLoggedIn && (
              <div className="mb-8 p-5 bg-white rounded-sm border border-border max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blush rounded-full flex items-center justify-center">
                    <LogIn className="h-5 w-5 text-maroon" strokeWidth={1.5} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-espresso text-sm">
                      Not signed in
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sign in to track orders & get exclusive deals
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate('/login')}
                    className="flex-1 bg-maroon hover:bg-terracotta text-ivory text-[11px] font-semibold uppercase tracking-[0.12em] rounded-sm transition-colors"
                    size="sm"
                  >
                    <LogIn className="h-4 w-4 mr-2" /> Sign In
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    variant="outline"
                    className="flex-1 text-[11px] font-semibold uppercase tracking-[0.12em] rounded-sm"
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4 mr-2" /> Sign Up
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-maroon hover:bg-terracotta text-ivory text-xs font-semibold uppercase tracking-[0.16em] px-8 rounded-sm transition-colors"
              >
                <Link to="/products" className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Start Shopping
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-xs font-semibold uppercase tracking-[0.16em] px-8 rounded-sm"
              >
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>

          {recommendedProducts.length > 0 && (
            <div className="mt-16">
              <div className="text-center mb-8">
                <span className="overline-label mb-2">Handpicked for you</span>
                <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso">
                  Recommended for You
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Discover products you might like
                </p>
              </div>
              <ProductGrid products={recommendedProducts} title="" />
            </div>
          )}
        </div>

        <OrderSuccessModal
          isOpen={showOrderSuccessModal}
          onClose={() => setShowOrderSuccessModal(false)}
          paymentMethod={orderPaymentMethod}
          orderData={createdOrderData}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  //  CART WITH ITEMS VIEW
  // ═══════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container px-4 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-espresso text-xs font-semibold uppercase tracking-[0.12em]"
              asChild
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso mb-2">
                Your Shopping Bag
              </h1>
              <p className="text-sm text-muted-foreground">
                {cartItems.length}{' '}
                {cartItems.length === 1 ? 'item' : 'items'} in your bag
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="mt-4 md:mt-0 text-xs font-semibold uppercase tracking-[0.12em] rounded-sm"
            >
              <Link to="/products" className="flex items-center gap-2">
                Continue Shopping
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {!isLoggedIn && (
          <LoginRequiredBanner
            onLoginClick={() => navigate('/login')}
            onRegisterClick={() => navigate('/register')}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="border-t border-border">
              {cartItems.map((item) => {
                const product = item.product as Product;
                const price = product.discountPrice || product.price;
                const itemTotal = price * item.quantity;
                const hasDiscount = !!product.discountPrice;
                const discountPercent = hasDiscount
                  ? Math.round(
                      ((product.price - product.discountPrice) /
                        product.price) *
                        100
                    )
                  : 0;

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 sm:gap-6 py-6 border-b border-border"
                  >
                    <Link
                      to={`/product/${product.id}`}
                      className="flex-shrink-0 w-20 sm:w-24"
                    >
                      <div className="aspect-[3/4] overflow-hidden rounded-sm bg-sand">
                        <img
                          src={getImageUrl(product)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link
                        to={`/product/${product.id}`}
                        className="text-[15px] font-medium text-espresso hover:text-maroon transition-colors line-clamp-2"
                      >
                        {product.name}
                      </Link>
                      <div className="mt-1 text-[13px] text-muted-foreground">
                        {(item.color || item.size) && (
                          <span>
                            {item.color && (
                              <span className="capitalize">
                                Colour: {item.color}
                              </span>
                            )}
                            {item.color && item.size && ' · '}
                            {item.size && <span>Size: {item.size}</span>}
                          </span>
                        )}
                        {hasDiscount && (
                          <span className={item.color || item.size ? 'ml-2 text-sale font-medium' : 'text-sale font-medium'}>
                            {discountPercent}% off
                          </span>
                        )}
                      </div>

                      <div className="mt-auto pt-4">
                        <div className="inline-flex items-center border border-border rounded-sm bg-white">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-none text-muted-foreground hover:text-espresso hover:bg-ivory"
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                item.quantity - 1
                              )
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center text-sm font-medium text-espresso">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-none text-muted-foreground hover:text-espresso hover:bg-ivory"
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                item.quantity + 1
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right flex flex-col items-end">
                      <div className="text-base font-semibold text-espresso">
                        {formatPrice(itemTotal)}
                      </div>
                      {hasDiscount && (
                        <div className="text-[13px] text-muted-foreground line-through">
                          {formatPrice(product.price * item.quantity)}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="mt-auto pt-4 text-xs uppercase tracking-[0.08em] text-muted-foreground underline underline-offset-[3px] hover:text-maroon transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 pt-5">
              <Button
                variant="ghost"
                className="px-0 text-xs uppercase tracking-[0.08em] text-muted-foreground hover:text-sale hover:bg-transparent underline underline-offset-[3px]"
                onClick={() => {
                  clearCart();
                  setDiscount(0);
                  setDiscountType(null);
                  setAppliedCoupon(null);
                  setCouponCode('');
                  toast.success('Cart cleared');
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Clear Bag
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <aside className="bg-white border border-border rounded-sm p-6 sticky top-24">
                <h2 className="font-serif text-xl font-medium text-espresso mb-5">
                  Order Summary
                </h2>

                {/* Coupon code */}
                <div className="flex mb-3">
                  <Input
                    placeholder={
                      isLoggedIn
                        ? 'Coupon code'
                        : 'Sign in to apply coupons'
                    }
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    className="flex-1 min-w-0 h-11 text-sm font-mono bg-white border-input border-r-0 rounded-sm rounded-r-none focus-visible:ring-1 focus-visible:ring-maroon focus-visible:ring-offset-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyCoupon();
                    }}
                    disabled={isApplyingCoupon || !isLoggedIn}
                  />
                  <Button
                    onClick={() => {
                      if (!isLoggedIn) { navigate('/login'); return; }
                      handleApplyCoupon();
                    }}
                    disabled={
                      isApplyingCoupon || (!couponCode.trim() && isLoggedIn)
                    }
                    className="h-11 px-5 rounded-sm rounded-l-none bg-maroon hover:bg-terracotta text-ivory text-xs font-semibold uppercase tracking-[0.16em] whitespace-nowrap transition-colors"
                  >
                    {isApplyingCoupon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : !isLoggedIn ? (
                      <>
                        <LogIn className="h-4 w-4 mr-1" /> Login
                      </>
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>

                {appliedCoupon && (
                  <div className="mb-4 p-3 bg-green-50 rounded-sm border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-700" />
                        <span className="text-sm font-medium text-green-700">
                          "{appliedCoupon.code}" applied
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-green-100"
                        onClick={handleRemoveDiscount}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {discount > 0
                        ? `You saved ₹${discount.toLocaleString('en-IN')}!`
                        : 'Coupon applied successfully'}
                    </p>
                  </div>
                )}

                {/* Summary lines */}
                <div className="space-y-2.5 text-sm pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Subtotal ({cartItems.length}{' '}
                      {cartItems.length === 1 ? 'item' : 'items'})
                    </span>
                    <span className="text-espresso">{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span className="text-espresso">{formatPrice(gstAmount)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    {shipping > 0 ? (
                      <span className="text-espresso">{formatPrice(shipping)}</span>
                    ) : (
                      <span className="text-green-700">Free</span>
                    )}
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>You save</span>
                      <span>− {formatPrice(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline border-t border-border pt-4 mt-4">
                    <span className="text-base font-semibold text-espresso">Total</span>
                    <div className="text-right">
                      {discount > 0 && (
                        <div className="text-[13px] text-muted-foreground line-through">
                          {formatPrice(totalBeforeDiscount)}
                        </div>
                      )}
                      <span className="text-lg font-semibold text-espresso">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                {subtotal < 999 && (
                  <div className="mt-5 p-3 bg-ivory rounded-sm border border-border">
                    <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-2">
                      <Truck className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                      Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for
                      free shipping!
                    </div>
                    <div className="w-full bg-sand rounded-full h-1">
                      <div
                        className="bg-gold h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (subtotal / 999) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {isLoggedIn ? (
                  <Button
                    size="lg"
                    className="w-full h-12 mt-6 bg-maroon hover:bg-terracotta text-ivory text-xs font-semibold uppercase tracking-[0.16em] rounded-sm transition-colors"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                ) : (
                  <div className="mt-6 space-y-2">
                    <Button
                      size="lg"
                      className="w-full h-12 bg-maroon hover:bg-terracotta text-ivory text-xs font-semibold uppercase tracking-[0.16em] rounded-sm transition-colors"
                      onClick={() => navigate('/login')}
                    >
                      <LogIn className="w-4 h-4 mr-2" /> Sign In to Checkout
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full h-12 text-xs font-semibold uppercase tracking-[0.16em] rounded-sm"
                      onClick={() => navigate('/register')}
                    >
                      <UserPlus className="w-4 h-4 mr-2" /> Create Account
                    </Button>
                    <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1 pt-1">
                      <Lock className="h-3 w-3" /> Login required to place orders
                    </p>
                  </div>
                )}

                {/* Payment chips */}
                <div className="mt-4 flex justify-center gap-2">
                  {['UPI', 'VISA', 'RUPAY', 'COD'].map((chip) => (
                    <span
                      key={chip}
                      className="border border-border rounded-sm px-2.5 py-1 text-[11px] tracking-[0.08em] text-muted-foreground"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                {/* Coupons Section */}
                <div className="border-t border-border mt-6 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-espresso">
                        Available Coupons
                      </span>
                    </div>
                    {displayCoupons.length > 0 && (
                      <Badge variant="outline" className="text-xs rounded-sm border-border text-muted-foreground font-normal">
                        {displayCoupons.length} available
                      </Badge>
                    )}
                  </div>

                  {loadingCoupons ? (
                    <div className="text-center py-6 bg-ivory rounded-sm border border-dashed border-border">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-maroon" />
                      <span className="text-xs text-muted-foreground">
                        Loading coupons...
                      </span>
                    </div>
                  ) : displayCoupons.length > 0 ? (
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {displayCoupons.map((coupon, index) => {
                        const eligible = isCouponEligible(coupon);
                        const isApplied = appliedCoupon?.code === coupon.code;
                        return (
                          <div
                            key={coupon.id || index}
                            className={`p-3 rounded-sm border transition-colors duration-200 ${
                              isApplied
                                ? 'bg-ivory border-maroon'
                                : eligible
                                ? 'bg-white border-border hover:border-maroon/50'
                                : 'bg-ivory border-border opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-mono font-semibold text-[13px] text-espresso bg-white px-2.5 py-1 rounded-sm border border-border select-all">
                                    {coupon.code}
                                  </span>
                                  <Badge
                                    className={`${
                                      String(coupon.discount_type).includes('percent')
                                        ? 'bg-blush text-maroon hover:bg-blush'
                                        : 'bg-espresso text-ivory hover:bg-espresso'
                                    } border-0 text-[11px] rounded-sm`}
                                  >
                                    {String(coupon.discount_type).includes('percent')
                                      ? `${coupon.discount_value}% OFF`
                                      : `₹${coupon.discount_value} OFF`}
                                  </Badge>
                                  {isApplied && (
                                    <CheckCircle className="h-4 w-4 text-green-700 flex-shrink-0" />
                                  )}
                                </div>
                                {coupon.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {coupon.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                  {coupon.minimum_purchase > 0 && (
                                    <p
                                      className={`text-xs ${
                                        eligible
                                          ? 'text-muted-foreground'
                                          : 'text-sale font-medium'
                                      }`}
                                    >
                                      {eligible ? '✓' : '✗'} Min: ₹
                                      {Number(
                                        coupon.minimum_purchase
                                      ).toLocaleString('en-IN')}
                                    </p>
                                  )}
                                  {coupon.valid_to && (
                                    <p className="text-xs text-muted-foreground/70">
                                      Expires:{' '}
                                      {new Date(
                                        coupon.valid_to
                                      ).toLocaleDateString('en-IN')}
                                    </p>
                                  )}
                                </div>
                                {!eligible && (
                                  <p className="text-xs text-sale mt-1 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Add ₹
                                    {(
                                      Number(coupon.minimum_purchase) - subtotal
                                    ).toLocaleString('en-IN')}{' '}
                                    more
                                  </p>
                                )}
                                {!isLoggedIn && eligible && (
                                  <p
                                    className="text-xs text-terracotta mt-1 flex items-center gap-1 cursor-pointer hover:underline"
                                    onClick={() => navigate('/login')}
                                  >
                                    <Lock className="h-3 w-3" /> Sign in to
                                    apply this coupon
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-1.5 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs rounded-sm border-border text-muted-foreground hover:bg-ivory hover:text-espresso"
                                  onClick={() => handleCopyCoupon(coupon.code)}
                                >
                                  {copiedCoupon === coupon.code ? (
                                    <CheckCheck className="w-3 h-3 text-green-700" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  className={`h-7 px-3 text-xs rounded-sm transition-colors ${
                                    isApplied
                                      ? 'bg-espresso hover:bg-sale text-ivory'
                                      : !isLoggedIn
                                      ? 'bg-espresso hover:bg-maroon text-ivory'
                                      : eligible
                                      ? 'bg-maroon hover:bg-terracotta text-ivory'
                                      : 'bg-sand text-muted-foreground cursor-not-allowed'
                                  }`}
                                  onClick={() => {
                                    if (!isLoggedIn) {
                                      navigate('/login');
                                      return;
                                    }
                                    isApplied
                                      ? handleRemoveDiscount()
                                      : handleApplyCopiedCoupon(coupon.code);
                                  }}
                                  disabled={
                                    (!eligible && !isApplied && isLoggedIn) ||
                                    isApplyingCoupon
                                  }
                                >
                                  {isApplyingCoupon ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : !isLoggedIn ? (
                                    <LogIn className="w-3 h-3" />
                                  ) : isApplied ? (
                                    'Remove'
                                  ) : (
                                    'Apply'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-ivory rounded-sm border border-dashed border-border">
                      <Gift className="h-6 w-6 text-muted-foreground/60 mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-xs text-muted-foreground">
                        {couponError || 'No coupons available right now'}
                      </p>
                      {!isLoggedIn && (
                        <p
                          className="text-xs text-maroon mt-1 cursor-pointer hover:underline font-medium"
                          onClick={() => navigate('/login')}
                        >
                          🔓 Sign in to see exclusive coupons
                        </p>
                      )}
                    </div>
                  )}

                </div>
            </aside>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 bg-white border border-border rounded-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {[
            { icon: Package, title: 'Free Shipping', subtitle: 'On orders over ₹999' },
            { icon: Shield, title: 'Secure Payment', subtitle: '100% secure encryption' },
            { icon: Truck, title: 'Easy Returns', subtitle: '30-day return policy' },
          ].map(({ icon: Icon, title, subtitle }) => (
            <div
              key={title}
              className="flex items-center justify-center gap-3 p-5"
            >
              <Icon className="h-6 w-6 text-terracotta flex-shrink-0" strokeWidth={1.5} />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-espresso">{title}</h4>
                <p className="text-[13px] text-muted-foreground">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {recommendedProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-border">
            <div className="text-center mb-8">
              <span className="overline-label mb-2">Complete the look</span>
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-espresso mb-2">
                You Might Also Like
              </h2>
              <p className="text-sm text-muted-foreground">
                Complete your collection with these picks
              </p>
            </div>
            <ProductGrid products={recommendedProducts} title="" />
          </div>
        )}

        <PaymentMethodModal
          isOpen={showPaymentMethodModal}
          onClose={() => setShowPaymentMethodModal(false)}
          onConfirm={handleOrderConfirm}
          total={total}
          discount={discount}
          cartItems={cartItems}
        />
        <OrderSuccessModal
          isOpen={showOrderSuccessModal}
          onClose={() => setShowOrderSuccessModal(false)}
          paymentMethod={orderPaymentMethod}
          orderData={createdOrderData}
        />
      </div>
    </div>
  );
};

export default CartPage;