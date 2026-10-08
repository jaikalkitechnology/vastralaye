import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { api } from '@/api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

const fieldClasses =
  'h-11 bg-white border-input rounded-sm text-[14.5px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-maroon';

const labelClasses =
  'block text-[11px] font-sans font-semibold uppercase tracking-[0.16em] text-espresso';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, state } = useStore();
  const { isLoggedIn, loading, authError, currentUser } = state;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState({ email: '', password: '' });
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  /* The API says so in words; matching on them keeps the check in one place
     rather than inventing a parallel error code for a single message. */
  const needsVerification = /confirm your email/i.test(authError || '');

  const resendVerification = async () => {
    setResending(true);
    try {
      await api.post('/users/resend-verification', { email });
    } catch {
      /* the endpoint answers identically either way, by design */
    } finally {
      setResending(false);
      setResent(true);
    }
  };
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
      return 'border-sale focus-visible:border-sale';

    return '';
  };

  return (
    <div className="grid bg-background lg:min-h-[720px] lg:grid-cols-2">
      {/* Brand panel (desktop only) */}
      <div className="hidden lg:flex items-center justify-center bg-maroon text-ivory">
        <div className="max-w-[400px] px-10 text-center">
          <svg
            className="mx-auto"
            width="130"
            height="14"
            viewBox="0 0 130 14"
            aria-hidden="true"
          >
            <g fill="none" stroke="#C29E5C">
              <line x1="0" y1="7" x2="50" y2="7" />
              <line x1="80" y1="7" x2="130" y2="7" />
              <rect x="60.5" y="2.5" width="9" height="9" transform="rotate(45 65 7)" />
            </g>
            <circle cx="65" cy="7" r="1.5" fill="#C29E5C" />
          </svg>
          <h2 className="mt-5 mb-3 font-serif text-4xl font-medium leading-tight">
            Welcome back to Vastraliya
          </h2>
          <p className="text-[15px] text-ivory/75">
            Your wishlist, orders and festive picks are right where you left them.
          </p>
        </div>
      </div>

      {/* Form column */}
      <div className="flex items-center justify-center px-5 py-14 sm:px-10 lg:py-16">
        <div className="w-full max-w-[420px]">
          <h1 className="font-serif text-3xl font-medium text-espresso mb-1.5">Sign In</h1>
          <p className="text-[14.5px] text-muted-foreground mb-7">
            Continue with the email you shop with.
          </p>

          {authError && (
            /* "Confirm your email" is a to-do, not a failure — it gets the
               amber treatment and a way out, rather than the red one that
               says you typed something wrong. */
            <div
              className={`mb-6 flex items-start gap-3 rounded-sm border p-3.5 ${
                needsVerification
                  ? 'border-[#B07C1F]/30 bg-[#B07C1F]/10 text-[#8A6414]'
                  : 'border-sale/30 bg-sale/5 text-sale'
              }`}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="text-sm">
                {authError}
                {needsVerification && (
                  <div className="mt-2">
                    {resent ? (
                      <span className="font-medium">
                        A new link is on its way to {email}.
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={resendVerification}
                        disabled={resending}
                        className="font-semibold underline underline-offset-2 disabled:opacity-60"
                      >
                        {resending ? 'Sending…' : 'Send me a new activation link'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <GoogleSignInButton text="continue_with" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EMAIL */}
            <div className="space-y-2">
              <Label className={labelClasses}>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="you@example.com"
                className={`${fieldClasses} ${getFieldClassName('email')}`}
                disabled={loading}
              />
              {errors.email && touched.email && (
                <p className="flex items-center gap-2 text-[13px] text-sale">
                  <AlertCircle className="h-3.5 w-3.5" /> {errors.email}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={labelClasses}>Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-[13px] text-terracotta underline underline-offset-[3px] hover:text-maroon"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className={`${fieldClasses} pr-11 ${getFieldClassName('password')}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-espresso"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="flex items-center gap-2 text-[13px] text-sale">
                  <AlertCircle className="h-3.5 w-3.5" /> {errors.password}
                </p>
              )}
            </div>

            {/* REMEMBER ME */}
            <div className="flex items-center gap-2.5">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="rounded-[1px] border-input data-[state=checked]:border-maroon data-[state=checked]:bg-maroon data-[state=checked]:text-ivory"
              />
              <Label className="cursor-pointer text-[13.5px] font-normal text-muted-foreground">
                Remember me for 30 days
              </Label>
            </div>

            {/* LOGIN BUTTON */}
            <Button
              type="submit"
              className="h-auto w-full rounded-sm bg-maroon px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.14em] text-ivory hover:bg-terracotta"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* REGISTER LINK */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to Vastraliya?{' '}
            <Link
              to="/register"
              className="font-medium text-maroon underline underline-offset-[3px] hover:text-terracotta"
            >
              Create an account
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground/80">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>

          <div className="mt-7 border-t border-border pt-5 text-center">
            <Link
              to="/"
              className="text-[13px] text-muted-foreground hover:text-espresso"
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
