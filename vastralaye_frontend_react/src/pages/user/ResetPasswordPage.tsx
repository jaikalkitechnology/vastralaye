import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BASE_URL } from '@/config';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

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
    </div>

    <p className="font-serif text-[21px] leading-relaxed text-ivory/90 mt-6 max-w-[340px]">
      Good style, waiting to be worn &mdash; pieces you'll reach for on repeat.
    </p>

    <div className="flex items-center gap-2.5 mt-6" aria-hidden="true">
      <span className="h-px w-11 bg-gold/60" />
      <span className="h-[7px] w-[7px] rotate-45 border border-gold" />
      <span className="h-px w-11 bg-gold/60" />
    </div>

    <ul className="mt-7 space-y-3">
      <li className="flex items-center gap-3 text-[13px] text-ivory/70">
        <span className="w-1.5 h-1.5 border border-gold rotate-45 shrink-0" />
        Curated festive &amp; everyday styles
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
      &copy; Vastraliya &middot; Vasai, India
    </p>
  </aside>
);

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset link. Please request a new password reset.');
    }
  }, [token]);

  useEffect(() => {
    // Calculate password strength
    let strength = 0;
    if (newPassword.length >= 8) strength += 1;
    if (newPassword.match(/[a-z]/) && newPassword.match(/[A-Z]/)) strength += 1;
    if (newPassword.match(/\d/)) strength += 1;
    if (newPassword.match(/[^a-zA-Z\d]/)) strength += 1;
    setPasswordStrength(strength);
  }, [newPassword]);

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'bg-sand';
      case 1: return 'bg-sale';
      case 2: return 'bg-terracotta';
      case 3: return 'bg-gold';
      case 4: return 'bg-[#3E6B4F]';
      default: return 'bg-sand';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (!passwordsMatch) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 2) {
      setError('Please choose a stronger password');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.msg || 'Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.detail || 'Failed to reset password. The link may have expired.');
      }
    } catch {
      setError('Unable to connect to server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
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
            <span className="font-serif text-3xl font-semibold text-espresso">
              Vastra<span className="text-maroon">liya</span>
            </span>
            <svg
              className="mx-auto mt-3"
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
          </div>

          {/* Heading */}
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#8A6414]">
            Account recovery
          </span>
          <h1 className="font-serif text-[28px] font-medium text-espresso mt-1.5">
            Create a new password
          </h1>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className={labelClasses}>
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`${fieldClasses} pr-11`}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-espresso"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span
                      className={`font-medium ${
                        passwordStrength === 0 ? 'text-muted-foreground' :
                        passwordStrength === 1 ? 'text-sale' :
                        passwordStrength === 2 ? 'text-terracotta' :
                        passwordStrength === 3 ? 'text-[#8A6414]' : 'text-[#3E6B4F]'
                      }`}
                    >
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((seg) => (
                      <span
                        key={seg}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          passwordStrength > seg ? 'bg-gold' : 'bg-sand'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className={labelClasses}>
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`${fieldClasses} pr-11`}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-espresso"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword && (
                <div
                  className={`flex items-center gap-2 text-[13px] ${
                    passwordsMatch ? 'text-[#3E6B4F]' : 'text-sale'
                  }`}
                >
                  {passwordsMatch ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className="rounded-sm border border-border bg-blush/60 p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                Password requirements
              </p>
              <ul className="space-y-1.5 text-[13px] text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      newPassword.length >= 8 ? 'bg-gold' : 'bg-sand'
                    }`}
                  />
                  At least 8 characters
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      newPassword.match(/[a-z]/) && newPassword.match(/[A-Z]/) ? 'bg-gold' : 'bg-sand'
                    }`}
                  />
                  Upper and lowercase letters
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      newPassword.match(/\d/) ? 'bg-gold' : 'bg-sand'
                    }`}
                  />
                  At least one number
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="h-auto w-full rounded-sm bg-maroon px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.14em] text-ivory hover:bg-terracotta"
              disabled={isLoading || !passwordsMatch || passwordStrength < 2}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
                  Resetting Password...
                </span>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          {/* Messages */}
          {message && (
            <div className="mt-5 flex items-start gap-3 rounded-sm border border-[#3E6B4F]/30 bg-[#3E6B4F]/5 p-3.5 text-[#3E6B4F]">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-sm border border-sale/30 bg-sale/5 p-3.5 text-sale">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-7 border-t border-border pt-5 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-[13px] text-muted-foreground hover:text-maroon"
            >
              &larr; Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
