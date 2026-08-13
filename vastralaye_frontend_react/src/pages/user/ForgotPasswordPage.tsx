import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { BASE_URL } from '../../config';

const fieldClasses =
  'h-11 bg-white border-input rounded-sm text-[14.5px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-maroon';

const labelClasses =
  'block text-[11px] font-sans font-semibold uppercase tracking-[0.16em] text-espresso';

const BrandPanel = () => (
  <aside className="relative hidden md:flex flex-col justify-center bg-espresso px-14 py-16 text-ivory">
    <span className="pointer-events-none absolute inset-[18px] border border-gold/40" />

    <div>
      <Link to="/" className="font-serif text-[34px] font-semibold text-ivory">
        Vastra<span className="text-gold">liya</span>
      </Link>
      <span className="block text-[9px] uppercase tracking-[0.42em] text-gold mt-1">
        Handcrafted India
      </span>
    </div>

    <p className="font-serif text-[21px] leading-relaxed text-ivory/90 mt-6 max-w-[340px]">
      Handwoven stories, waiting to be worn &mdash; your wardrobe remembers where it came from.
    </p>

    <div className="flex items-center gap-2.5 mt-6" aria-hidden="true">
      <span className="h-px w-11 bg-gold/60" />
      <span className="h-[7px] w-[7px] rotate-45 border border-gold" />
      <span className="h-px w-11 bg-gold/60" />
    </div>

    <ul className="mt-7 space-y-3">
      <li className="flex items-center gap-3 text-[13px] text-ivory/70">
        <span className="w-1.5 h-1.5 border border-gold rotate-45 shrink-0" />
        Artisan-direct sarees, suits &amp; lehengas
      </li>
      <li className="flex items-center gap-3 text-[13px] text-ivory/70">
        <span className="w-1.5 h-1.5 border border-gold rotate-45 shrink-0" />
        Secure checkout &middot; UPI, cards &amp; COD
      </li>
      <li className="flex items-center gap-3 text-[13px] text-ivory/70">
        <span className="w-1.5 h-1.5 border border-gold rotate-45 shrink-0" />
        Easy 7-day returns on every order
      </li>
    </ul>

    <p className="absolute bottom-9 left-14 text-[11px] uppercase tracking-[0.18em] text-ivory/40">
      &copy; Vastraliya &middot; Faridabad, India
    </p>
  </aside>
);

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
      return 'border-sale focus-visible:border-sale';
    }

    return '';
  };

  const resetForm = () => {
    setMessage('');
    setError('');
    setEmail('');
    setErrors({ email: '' });
    setTouched({ email: false });
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[44%_56%] bg-background">
      {/* Espresso brand panel */}
      <BrandPanel />

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12 md:px-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="md:hidden text-center mb-8">
            <Link to="/" className="inline-block font-serif text-3xl font-semibold text-espresso">
              Vastra<span className="text-maroon">liya</span>
            </Link>
            <svg
              className="mx-auto mt-3"
              width="130"
              height="14"
              viewBox="0 0 130 14"
              aria-hidden="true"
            >
              <g fill="none" stroke="#C99A45">
                <line x1="0" y1="7" x2="50" y2="7" />
                <line x1="80" y1="7" x2="130" y2="7" />
                <rect x="60.5" y="2.5" width="9" height="9" transform="rotate(45 65 7)" />
              </g>
              <circle cx="65" cy="7" r="1.5" fill="#C99A45" />
            </svg>
          </div>

          {/* Heading */}
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#8A6414]">
            Account recovery
          </span>
          <h1 className="font-serif text-[28px] font-medium text-espresso mt-1.5">
            Forgot your password?
          </h1>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Enter the email you shop with and we'll send you reset instructions.
          </p>

          {/* Success Message */}
          {message && (
            <div className="mb-6 flex items-start gap-3 rounded-sm border border-[#3E6B4F]/30 bg-[#3E6B4F]/5 p-3.5 text-[#3E6B4F]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Check your email</p>
                <p className="mt-0.5">{message}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-sm border border-sale/30 bg-sale/5 p-3.5 text-sale">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Unable to send reset link</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className={labelClasses}>
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onBlur={() => handleInputBlur('email')}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`${fieldClasses} pl-10 ${getFieldClassName('email')}`}
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Error Message */}
                {errors.email && touched.email && (
                  <p className="error-message flex items-center gap-2 text-[13px] text-sale">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.email}
                  </p>
                )}

                {/* Help Text */}
                {!errors.email && (
                  <p className="text-xs text-muted-foreground">
                    We'll send a secure password reset link to this email address.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="h-auto w-full rounded-sm bg-maroon px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.14em] text-ivory hover:bg-terracotta"
                disabled={isLoading || (touched.email && !!errors.email) || !email.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
                    Sending reset link...
                  </span>
                ) : (
                  'Send Reset Instructions'
                )}
              </Button>

              {/* Recovery tips */}
              <div className="rounded-sm border border-border bg-blush/60 p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                  Tips for a smooth recovery
                </p>
                <ul className="space-y-1.5 text-[13px] text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
                    Use the email address associated with your Vastraliya account
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
                    Check your spam folder if you don't see our email
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
                    Reset links expire after 1 hour for security
                  </li>
                </ul>
              </div>
            </form>
          )}

          {/* Success Actions */}
          {message && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or
              </p>
              <Button
                onClick={resetForm}
                variant="outline"
                className="h-auto w-full rounded-sm px-5 py-3 text-[12px] font-medium uppercase tracking-[0.12em]"
              >
                Try another email address
              </Button>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-7 border-t border-border pt-5 text-center">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-maroon"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
              Back to login
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground/80">
            We prioritize the security of your account and personal information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
