import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, ArrowRight, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/* Small gold ornament divider (design.md §4) */
const GoldOrnament = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 130 14"
    width="130"
    height="14"
    aria-hidden="true"
  >
    <g fill="none" stroke="#C29E5C">
      <line x1="0" y1="7" x2="50" y2="7" />
      <line x1="80" y1="7" x2="130" y2="7" />
      <rect x="60.5" y="2.5" width="9" height="9" transform="rotate(45 65 7)" />
    </g>
    <circle cx="65" cy="7" r="1.5" fill="#C29E5C" />
  </svg>
);

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    // Mizorpay usually sends ?status=success or ?status=failure
    // If no status is found, we assume success if they were redirected here
    const statusParam = searchParams.get("status");

    if (statusParam === "failure" || statusParam === "failed") {
      setStatus("failed");
    } else {
      setStatus("success");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md text-center">

        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-maroon animate-spin mb-6" />
            <h2 className="font-serif text-2xl font-medium text-espresso">Verifying Payment...</h2>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-[74px] h-[74px] bg-green-700 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-9 h-9 text-ivory" />
            </div>
            <span className="overline-label mb-3">Order placed</span>
            <h1 className="font-serif text-4xl font-medium text-espresso mb-3">Shukriya!</h1>
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-6">
              Thank you for your order. We have received your payment and will process it shortly.
            </p>
            <GoldOrnament className="mx-auto mb-8" />
            <div className="flex flex-col gap-3 w-full">
              <Link to="/account/orders" className="w-full">
                <Button className="w-full h-12 bg-maroon text-ivory text-xs font-semibold uppercase tracking-[0.16em] rounded-sm hover:bg-terracotta transition-colors">
                  Track Order
                </Button>
              </Link>
              <Link to="/" className="w-full">
                <Button
                  variant="outline"
                  className="w-full h-12 text-xs font-semibold uppercase tracking-[0.16em] rounded-sm"
                >
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-[74px] h-[74px] bg-sale rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-9 h-9 text-ivory" />
            </div>
            <span className="overline-label mb-3">Payment failed</span>
            <h1 className="font-serif text-4xl font-medium text-espresso mb-3">Something Went Wrong</h1>
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
              Something went wrong with the transaction. No money was deducted.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link to="/cart" className="w-full">
                <Button className="w-full h-12 bg-maroon text-ivory text-xs font-semibold uppercase tracking-[0.16em] rounded-sm hover:bg-terracotta transition-colors">
                  Try Again
                </Button>
              </Link>
              <Link to="/" className="w-full">
                <Button
                  variant="outline"
                  className="w-full h-12 text-xs font-semibold uppercase tracking-[0.16em] rounded-sm"
                >
                  <Home className="w-4 h-4 mr-2" /> Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OrderConfirmation;
