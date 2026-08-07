import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, state } = useStore();
  const { isLoggedIn, loading, authError, currentUser } = state;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });

  // Redirect based on role returned from backend
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      if (currentUser.role === 'admin') navigate('/admin');
      else navigate('/account/profile');
    }
  }, [isLoggedIn, currentUser, navigate]);

  useEffect(() => {
    if (touched.email || touched.password) validateForm();
  }, [email, password, touched]);

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);

    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!validateForm()) return;

    try {
      // 👇 FIX: backend auto-detects role
      await login(email, password, rememberMe);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const getFieldClassName = (fieldName: string) => {
    const hasError = errors[fieldName as keyof typeof errors];
    const wasTouched = touched[fieldName as keyof typeof touched];

    if (hasError && wasTouched)
      return 'border-red-300 focus:border-red-500 focus:ring-red-500';

    if (!hasError && wasTouched && email && password)
      return 'border-green-300 focus:border-[#5E9F50] focus:ring-[#5E9F50]';

    return 'border-gray-200 focus:border-[#E97A48] focus:ring-[#E97A48]';
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5E9F50] bg-opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E97A48] bg-opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo/Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#5E9F50] rounded-full mb-2">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>
        </div>

        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="pt-8 space-y-6">
            {authError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">{authError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* EMAIL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="you@example.com"
                    className={`pl-10 ${getFieldClassName('email')}`}
                    disabled={loading}
                  />
                  {touched.email && !errors.email && email && (
                    <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#5E9F50]" />
                  )}
                </div>
                {errors.email && touched.email && (
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {errors.email}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-[#E97A48] hover:text-[#d86a38]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className={`pl-10 ${getFieldClassName('password')}`}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
                {errors.password && touched.password && (
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {errors.password}
                  </p>
                )}
              </div>

              {/* REMEMBER ME */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="data-[state=checked]:bg-[#5E9F50] data-[state=checked]:border-[#5E9F50]"
                />
                <Label className="text-sm text-gray-700 cursor-pointer">
                  Remember me for 30 days
                </Label>
              </div>

              {/* LOGIN BUTTON */}
              <Button
                type="submit"
                className="w-full font-semibold py-3 bg-[#5E9F50] hover:bg-[#4d8f40] text-white transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>

            {/* DIVIDER */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">or</span>
              </div>
            </div>

            {/* REGISTER LINK */}
            <div className="text-center">
              <p className="text-gray-600 mb-4">Don't have an account?</p>
              <Link to="/register">
                <Button
                  variant="outline"
                  className="w-full border-2 border-gray-200 hover:border-[#E97A48] hover:bg-[#E97A48]/5 text-gray-700 hover:text-[#E97A48] py-3 transition-colors"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Create New Account</span>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* FOOTER INFO */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#5E9F50]" />
              <span>Secure Connection</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#E97A48]" />
              <span>Your data is protected</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
          
          <div className="pt-4 border-t border-gray-100">
            <Link 
              to="/" 
              className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;