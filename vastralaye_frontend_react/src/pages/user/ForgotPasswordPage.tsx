import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  Key,
  AlertTriangle,
  Leaf,
  Clock,
  Lock
} from 'lucide-react';
import { BASE_URL } from '../../config';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '' });
  const [touched, setTouched] = useState({ email: false });

  // Real-time validation
  useEffect(() => {
    if (touched.email) {
      validateField('email', email);
    }
  }, [email, touched.email]);

  const validateField = (fieldName: string, value: string) => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else if (value.length > 254) {
          newErrors.email = 'Email address is too long';
        } else {
          newErrors.email = '';
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = { email: '' };

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (email.length > 254) {
      newErrors.email = 'Email address is too long';
    }

    setErrors(newErrors);
    setTouched({ email: true });

    return !newErrors.email;
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      validateField('email', value);
    }
  };

  const handleInputBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!validateForm()) {
      const firstErrorElement = document.querySelector('.error-message');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.msg || 'If an account with this email exists, you will receive password reset instructions shortly.');
      } else {
        setError(data.detail || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldClassName = (fieldName: string) => {
    const hasError = errors[fieldName as keyof typeof errors];
    const wasTouched = touched[fieldName as keyof typeof touched];
    
    if (hasError && wasTouched) {
      return 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/50';
    }
    
    if (!hasError && wasTouched && email) {
      return 'border-[#7A1F2B] focus:border-[#7A1F2B] focus:ring-[#7A1F2B] bg-green-50/50';
    }
    
    return 'border-gray-200 focus:border-[#B85C38] focus:ring-[#B85C38]';
  };

  const resetForm = () => {
    setMessage('');
    setError('');
    setEmail('');
    setErrors({ email: '' });
    setTouched({ email: false });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7A1F2B]/10 via-white to-[#B85C38]/10 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#7A1F2B]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#B85C38]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-[#7A1F2B]/5 to-[#B85C38]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link to="/" className="inline-block">
            <div className="text-4xl font-bold bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] bg-clip-text text-transparent">
              Mizorpaymart
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Leaf className="w-4 h-4 text-[#7A1F2B]" />
            <span className="text-sm">Eco-friendly & Secure Recovery</span>
          </div>
        </div>

        {/* Back to Login */}
        <Link to="/login" className="flex items-center gap-2 text-[#7A1F2B] hover:text-[#7A1F2B]/80 transition-colors justify-center group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to login</span>
        </Link>

        {/* Password Reset Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#7A1F2B] to-[#B85C38] rounded-2xl flex items-center justify-center shadow-lg">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#B85C38] rounded-full flex items-center justify-center border-4 border-white shadow-md">
                  <Key className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] bg-clip-text text-transparent">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Enter your email address and we'll send you instructions to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Success Message */}
            {message && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-[#7A1F2B]/20 rounded-xl text-[#7A1F2B] flex items-center gap-3 animate-in fade-in-50">
                <div className="w-10 h-10 bg-[#7A1F2B] rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-[#7A1F2B]">Check your email</div>
                  <div>{message}</div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl text-[#B85C38] flex items-center gap-3 animate-in fade-in-50">
                <div className="w-10 h-10 bg-[#B85C38] rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-[#B85C38]">Unable to send reset link</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {!message && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onBlur={() => handleInputBlur('email')}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      className={`pl-10 transition-all duration-200 ${getFieldClassName('email')}`}
                      disabled={isLoading}
                      required
                    />
                    {touched.email && !errors.email && email && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-[#7A1F2B]" />
                      </div>
                    )}
                    {errors.email && touched.email && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <AlertTriangle className="h-5 w-5 text-[#B85C38]" />
                      </div>
                    )}
                  </div>
                  
                  {/* Error Message */}
                  {errors.email && touched.email && (
                    <p className="text-[#B85C38] text-sm flex items-center gap-2 error-message animate-in fade-in-50">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                  
                  {/* Help Text */}
                  {!errors.email && (
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <Shield className="w-3 h-3 text-[#7A1F2B]" />
                      We'll send a secure password reset link to this email address.
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] hover:from-[#7A1F2B]/90 hover:to-[#B85C38]/90 text-white font-semibold py-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                  disabled={isLoading || (touched.email && !!errors.email) || !email.trim()}
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending reset link...</span>
                    </div>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </Button>

                {/* Form Validation Tips */}
                <div className="p-4 bg-gradient-to-r from-[#7A1F2B]/5 to-[#B85C38]/5 rounded-lg border border-[#7A1F2B]/20">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#B85C38] mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-[#7A1F2B]">Tips for successful recovery:</div>
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7A1F2B]"></div>
                          <span>Use the email address associated with your Mizorpaymart account</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7A1F2B]"></div>
                          <span>Check your spam folder if you don't see our email</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#B85C38]"></div>
                          <span>Reset links expire after 1 hour for security</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Additional Help */}
            {!message && (
              <div className="border-t border-gray-200 pt-6">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Leaf className="w-4 h-4 text-[#7A1F2B]" />
                    <span>Your email is safe with us</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    The reset link will expire in 1 hour for security reasons.
                  </p>
                </div>
              </div>
            )}

            {/* Success Actions */}
            {message && (
              <div className="space-y-4 animate-in fade-in-50">
                <div className="border-t border-gray-200 pt-6">
                  <div className="text-center space-y-3">
                    <p className="text-sm text-gray-600">
                      Didn't receive the email? Check your spam folder or
                    </p>
                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="w-full border-gray-300 hover:border-[#7A1F2B] text-gray-700 hover:text-[#7A1F2B] hover:bg-[#7A1F2B]/5 transition-all duration-200"
                    >
                      Try another email address
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Footer */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#7A1F2B]"></div>
              <span>SSL Encrypted</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#B85C38]"></div>
              <span>Secure Recovery</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#7A1F2B]"></div>
              <span>Eco-friendly</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            We prioritize the security of your account and personal information
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;