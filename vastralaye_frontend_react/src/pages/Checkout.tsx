import React, { useState } from 'react';
import {
  CreditCard,
  Truck,
  Shield,
  Lock,
  CheckCircle,
  ArrowLeft,
  Info,
  AlertCircle,
} from 'lucide-react';

// Types
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentInfo {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
}

interface CheckoutFormData {
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
  paymentInfo: PaymentInfo;
  shippingMethod: string;
  email: string;
  phone: string;
  saveInfo: boolean;
}

const CheckoutPage: React.FC = () => {
  // Mock cart data
  const [cartItems] = useState<CartItem[]>([
    { id: '1', name: 'Premium Wireless Headphones', price: 199.99, quantity: 1, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
    { id: '2', name: 'Smart Watch Series 5', price: 299.99, quantity: 1, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30' },
    { id: '3', name: 'USB-C Fast Charger', price: 29.99, quantity: 2, image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90' },
  ]);

  const [formData, setFormData] = useState<CheckoutFormData>({
    shippingAddress: {
      fullName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
    },
    billingAddress: {
      fullName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
    },
    paymentInfo: {
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
    },
    shippingMethod: 'standard',
    email: '',
    phone: '',
    saveInfo: false,
  });

  const [useSameAddress, setUseSameAddress] = useState(true);
  const [currentStep, setCurrentStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = formData.shippingMethod === 'express' ? 15.99 : formData.shippingMethod === 'standard' ? 7.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const shippingMethods = [
    { id: 'free', name: 'Free Shipping', price: 0, estDays: '7-10 business days' },
    { id: 'standard', name: 'Standard Shipping', price: 7.99, estDays: '3-5 business days' },
    { id: 'express', name: 'Express Shipping', price: 15.99, estDays: '1-2 business days' },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    section: keyof CheckoutFormData,
    field?: string
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => {
      if (type === 'checkbox') {
        return { ...prev, [name]: checked };
      }

      if (field && section in prev) {
        const sectionData = prev[section] as any;
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: value,
          },
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleUseSameAddressChange = (checked: boolean) => {
    setUseSameAddress(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        billingAddress: prev.shippingAddress,
      }));
    }
  };

  const validateForm = () => {
    // Basic validation
    const requiredFields = ['fullName', 'address', 'city', 'state', 'zipCode'];
    const shippingValid = requiredFields.every(field => 
      formData.shippingAddress[field as keyof ShippingAddress]?.trim()
    );
    
    if (!useSameAddress) {
      const billingValid = requiredFields.every(field => 
        formData.billingAddress[field as keyof ShippingAddress]?.trim()
      );
      if (!billingValid) return false;
    }

    if (currentStep === 'payment') {
      const paymentValid = formData.paymentInfo.cardNumber.replace(/\s/g, '').length === 16 &&
        formData.paymentInfo.cardName.trim() &&
        formData.paymentInfo.expiryDate.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/) &&
        formData.paymentInfo.cvv.length === 3;
      if (!paymentValid) return false;
    }

    return shippingValid && formData.email.trim() && formData.phone.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    if (currentStep === 'shipping') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('review');
    } else {
      setIsProcessing(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsProcessing(false);
      alert('Order placed successfully!');
      // In a real app, redirect to confirmation page
    }
  };

  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep('shipping');
    } else if (currentStep === 'review') {
      setCurrentStep('payment');
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="mt-2 text-gray-600">Complete your purchase securely</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Form */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8">
                {['shipping', 'payment', 'review'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      (step === 'shipping' && currentStep === 'shipping') ||
                      (step === 'payment' && currentStep === 'payment') ||
                      (step === 'review' && currentStep === 'review')
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : step === 'review'
                        ? currentStep === 'review'
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 text-gray-300'
                        : 'bg-green-500 border-green-500 text-white'
                    }`}>
                      {step === 'review' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span className="ml-3 font-medium text-gray-700 capitalize">{step}</span>
                    {index < 2 && (
                      <div className={`h-1 w-16 mx-4 ${
                        (step === 'shipping' && currentStep === 'shipping') ||
                        (step === 'payment' && currentStep === 'payment')
                          ? 'bg-gray-300'
                          : 'bg-green-500'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                {/* Shipping Information */}
                {currentStep === 'shipping' && (
                  <div className="space-y-6">
                    <div className="flex items-center mb-4">
                      <Truck className="w-6 h-6 text-blue-600 mr-2" />
                      <h2 className="text-xl font-semibold">Shipping Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress.fullName}
                          onChange={(e) => handleInputChange(e, 'shippingAddress', 'fullName')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange(e, 'email')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shipping Address *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.address}
                        onChange={(e) => handleInputChange(e, 'shippingAddress', 'address')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress.city}
                          onChange={(e) => handleInputChange(e, 'shippingAddress', 'city')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress.state}
                          onChange={(e) => handleInputChange(e, 'shippingAddress', 'state')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress.zipCode}
                          onChange={(e) => handleInputChange(e, 'shippingAddress', 'zipCode')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange(e, 'phone')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        required
                      />
                    </div>

                    {/* Shipping Method */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Shipping Method</h3>
                      <div className="space-y-3">
                        {shippingMethods.map((method) => (
                          <label
                            key={method.id}
                            className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition ${
                              formData.shippingMethod === method.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="shippingMethod"
                                value={method.id}
                                checked={formData.shippingMethod === method.id}
                                onChange={(e) => handleInputChange(e, 'shippingMethod')}
                                className="w-4 h-4 text-blue-600"
                              />
                              <div className="ml-3">
                                <span className="font-medium">{method.name}</span>
                                <p className="text-sm text-gray-600">{method.estDays}</p>
                              </div>
                            </div>
                            <span className="font-semibold">
                              {method.price === 0 ? 'FREE' : `$${method.price.toFixed(2)}`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Billing Address</h3>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={useSameAddress}
                            onChange={(e) => handleUseSameAddressChange(e.target.checked)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="ml-2">Same as shipping address</span>
                        </label>
                      </div>

                      {!useSameAddress && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={formData.billingAddress.fullName}
                            onChange={(e) => handleInputChange(e, 'billingAddress', 'fullName')}
                            className="px-4 py-3 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="Address"
                            value={formData.billingAddress.address}
                            onChange={(e) => handleInputChange(e, 'billingAddress', 'address')}
                            className="px-4 py-3 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="City"
                            value={formData.billingAddress.city}
                            onChange={(e) => handleInputChange(e, 'billingAddress', 'city')}
                            className="px-4 py-3 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={formData.billingAddress.state}
                            onChange={(e) => handleInputChange(e, 'billingAddress', 'state')}
                            className="px-4 py-3 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="ZIP Code"
                            value={formData.billingAddress.zipCode}
                            onChange={(e) => handleInputChange(e, 'billingAddress', 'zipCode')}
                            className="px-4 py-3 border border-gray-300 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                {currentStep === 'payment' && (
                  <div className="space-y-6">
                    <div className="flex items-center mb-4">
                      <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
                      <h2 className="text-xl font-semibold">Payment Information</h2>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg mb-6">
                      <div className="flex items-center">
                        <Lock className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-900">
                          Your payment is secured with 256-bit SSL encryption
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name on Card *
                        </label>
                        <input
                          type="text"
                          value={formData.paymentInfo.cardName}
                          onChange={(e) => handleInputChange(e, 'paymentInfo', 'cardName')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="John Doe"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Number *
                        </label>
                        <input
                          type="text"
                          value={formData.paymentInfo.cardNumber}
                          onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value);
                            handleInputChange({
                              ...e,
                              target: { ...e.target, value: formatted }
                            } as React.ChangeEvent<HTMLInputElement>, 'paymentInfo', 'cardNumber');
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date *
                          </label>
                          <input
                            type="text"
                            value={formData.paymentInfo.expiryDate}
                            onChange={(e) => handleInputChange(e, 'paymentInfo', 'expiryDate')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="MM/YY"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV *
                          </label>
                          <input
                            type="text"
                            value={formData.paymentInfo.cvv}
                            onChange={(e) => handleInputChange(e, 'paymentInfo', 'cvv')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="123"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        id="saveInfo"
                        name="saveInfo"
                        checked={formData.saveInfo}
                        onChange={(e) => handleInputChange(e, 'saveInfo')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <label htmlFor="saveInfo" className="ml-2 text-gray-700">
                        Save payment information for next time
                      </label>
                    </div>
                  </div>
                )}

                {/* Order Review */}
                {currentStep === 'review' && (
                  <div className="space-y-6">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                      <h2 className="text-xl font-semibold">Review Your Order</h2>
                    </div>

                    {/* Order Summary */}
                    <div className="border rounded-lg overflow-hidden">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center p-4 border-b last:border-b-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="ml-4 flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                            <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping & Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Shipping Details</h4>
                        <p className="font-medium">{formData.shippingAddress.fullName}</p>
                        <p className="text-gray-600">{formData.shippingAddress.address}</p>
                        <p className="text-gray-600">
                          {formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.zipCode}
                        </p>
                        <p className="text-gray-600">{formData.shippingAddress.country}</p>
                        <p className="mt-2 text-gray-600">{formData.email}</p>
                        <p className="text-gray-600">{formData.phone}</p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Payment Details</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium">Credit Card</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-gray-600">Card Number:</span>
                          <span className="font-medium">
                            **** **** **** {formData.paymentInfo.cardNumber.slice(-4)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-gray-600">Name on Card:</span>
                          <span className="font-medium">{formData.paymentInfo.cardName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-yellow-800 font-medium">Important Information</p>
                          <p className="text-yellow-700 text-sm mt-1">
                            By placing this order, you agree to our Terms of Service and Privacy Policy. 
                            Your card will be charged ${total.toFixed(2)}. You can cancel within 24 hours for a full refund.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  {currentStep !== 'shipping' && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isProcessing || !validateForm()}
                    className={`flex items-center px-8 py-3 rounded-lg transition ${
                      isProcessing || !validateForm()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white font-medium ml-auto`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : currentStep === 'review' ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Place Order
                      </>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Assurance */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center">
                  <Shield className="w-8 h-8 text-green-600 mb-2" />
                  <h4 className="font-semibold">Secure Payment</h4>
                  <p className="text-sm text-gray-600 mt-1">256-bit SSL encryption</p>
                </div>
                <div className="flex flex-col items-center">
                  <Truck className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold">Free Returns</h4>
                  <p className="text-sm text-gray-600 mt-1">30-day return policy</p>
                </div>
                <div className="flex flex-col items-center">
                  <Info className="w-8 h-8 text-purple-600 mb-2" />
                  <h4 className="font-semibold">24/7 Support</h4>
                  <p className="text-sm text-gray-600 mt-1">Customer service available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-6">Order Summary</h3>
              
              {/* Cart Items Preview */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center">
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-600">${item.price.toFixed(2)} each</p>
                    </div>
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-b py-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>
                    {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mt-6 mb-8">
                <span className="text-lg font-semibold">Total</span>
                <div>
                  <div className="text-2xl font-bold">${total.toFixed(2)}</div>
                  <div className="text-sm text-gray-600 text-right">
                    {total / 4 > 0 && `or 4 payments of $${(total / 4).toFixed(2)}`}
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code
                </label>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-800 text-white rounded-r-lg hover:bg-gray-900 transition"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Estimated Delivery */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Truck className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="font-medium text-blue-900">Estimated Delivery</p>
                    <p className="text-sm text-blue-800">
                      {formData.shippingMethod === 'express' 
                        ? '1-2 business days'
                        : formData.shippingMethod === 'standard'
                        ? '3-5 business days'
                        : '7-10 business days'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Need Help */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Need help?{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Contact Support
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;