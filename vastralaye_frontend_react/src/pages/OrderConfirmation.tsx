import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, ArrowRight, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
        
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Verifying Payment...</h2>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-500 mb-8">
              Thank you for your order. We have received your payment and will process it shortly.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link to="/account/orders" className="w-full">
                <Button className="w-full bg-[#202B43] hover:bg-[#2a3654] h-12 text-lg">
                  View My Orders
                </Button>
              </Link>
              <Link to="/" className="w-full">
                <Button variant="outline" className="w-full h-12">
                  <Home className="w-4 h-4 mr-2" /> Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-500 mb-8">
              Something went wrong with the transaction. No money was deducted.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link to="/cart" className="w-full">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg">
                  Try Again
                </Button>
              </Link>
              <Link to="/" className="w-full">
                <Button variant="outline" className="w-full h-12">
                  Back to Home
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