import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Eye,
  EyeOff,
  Upload,
  X,
  AlertCircle,
  User,
  Lock,
  MapPin,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

// Constants
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];

const fieldClasses =
  'h-11 bg-white border-input rounded-sm text-[14.5px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-maroon';

const errorFieldClasses = 'border-sale focus-visible:border-sale';

const labelClasses =
  'block text-[11px] font-sans font-semibold uppercase tracking-[0.16em] text-espresso';

const FieldError = ({ message }: { message: string }) => (
  <p className="flex items-center gap-2 text-[13px] text-sale">
    <AlertCircle className="h-3.5 w-3.5" /> {message}
  </p>
);

// Types
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

// Registration Steps
const STEPS = [
  { id: 1, title: 'Personal', icon: User },
  { id: 2, title: 'Security', icon: Lock },
  { id: 3, title: 'Address', icon: MapPin },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, state } = useStore();
  const { isLoggedIn, loading, authError } = state;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'India',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  // Avatar preview cleanup
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  // Validate current step
  const validateStep = useCallback((step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      else if (formData.firstName.trim().length < 2) newErrors.firstName = 'Minimum 2 characters';

      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      else if (formData.lastName.trim().length < 2) newErrors.lastName = 'Minimum 2 characters';

      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';

      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = '10 digits required';
    }

    if (step === 2) {
      if (!formData.password) newErrors.password = 'Password is required';
      else {
        if (formData.password.length < 8) newErrors.password = 'Minimum 8 characters';
        else if (!/(?=.*[A-Z])/.test(formData.password)) newErrors.password = 'Add uppercase letter';
        else if (!/(?=.*[a-z])/.test(formData.password)) newErrors.password = 'Add lowercase letter';
        else if (!/(?=.*\d)/.test(formData.password)) newErrors.password = 'Add a number';
        else if (!/(?=.*[!@#$%^&*])/.test(formData.password)) newErrors.password = 'Add special character';
      }

      if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords mismatch';

      if (!agreeTerms) newErrors.agreeTerms = 'Accept terms to continue';
    }

    if (step === 3) {
      if (!formData.address1.trim()) newErrors.address1 = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
      else if (!/^\d{6}$/.test(formData.postalCode)) newErrors.postalCode = '6 digits required';
      if (!formData.country.trim()) newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, agreeTerms]);

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    let processedValue = value;

    if (field === 'email') {
      processedValue = value.replace(/[^a-zA-Z0-9@.]/g, "");
    }
    if (field === 'phone') {
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    }
    if (field === 'postalCode') {
      processedValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setFormData(prev => ({ ...prev, [field]: processedValue }));
    setTouched(prev => ({ ...prev, [field]: true }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Step navigation
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, avatar: 'Invalid image type' }));
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setErrors(prev => ({ ...prev, avatar: 'Max size 2MB' }));
      return;
    }

    setAvatarFile(file);
    setErrors(prev => ({ ...prev, avatar: '' }));
  };

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    if (!formData.password) return 0;

    let score = 0;
    if (formData.password.length >= 8) score += 25;
    if (/(?=.*[A-Z])/.test(formData.password)) score += 25;
    if (/(?=.*[a-z])/.test(formData.password)) score += 25;
    if (/(?=.*\d)/.test(formData.password)) score += 25;

    return score;
  }, [formData.password]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) return;

    const submitFormData = new FormData();
    submitFormData.append('first_name', formData.firstName.trim());
    submitFormData.append('last_name', formData.lastName.trim());
    submitFormData.append('email', formData.email.trim());
    submitFormData.append('password', formData.password);
    submitFormData.append('phone', formData.phone.trim());
    submitFormData.append('address_line1', formData.address1.trim());
    if (formData.address2.trim()) submitFormData.append('address_line2', formData.address2.trim());
    submitFormData.append('city', formData.city.trim());
    if (formData.region.trim()) submitFormData.append('region', formData.region.trim());
    submitFormData.append('postal_code', formData.postalCode.trim());
    submitFormData.append('country', formData.country.trim());
    if (avatarFile) submitFormData.append('avatar', avatarFile);

    const success = await register(submitFormData);
    if (success) {
      // They can't sign in until they click the link, so say so here rather
      // than dropping them on a login form that will refuse them.
      toast.success(
        'Account created — check your email for the activation link.',
        { duration: 8000 }
      );
      navigate('/login');
    }
  };

  if (isLoggedIn) return null;

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
            <g fill="none" stroke="#C99A45">
              <line x1="0" y1="7" x2="50" y2="7" />
              <line x1="80" y1="7" x2="130" y2="7" />
              <rect x="60.5" y="2.5" width="9" height="9" transform="rotate(45 65 7)" />
            </g>
            <circle cx="65" cy="7" r="1.5" fill="#C99A45" />
          </svg>
          <h2 className="mt-5 mb-3 font-serif text-4xl font-medium leading-tight">
            Join the Vastraliya family
          </h2>
          <p className="text-[15px] text-ivory/75">
            Members get early access to new drops, artisan stories and members-only offers.
          </p>
        </div>
      </div>

      {/* Form column */}
      <div className="flex items-center justify-center px-5 py-14 sm:px-10 lg:py-16">
        <div className="w-full max-w-[420px]">
          <h1 className="font-serif text-3xl font-medium text-espresso mb-1.5">Create Account</h1>
          <p className="text-[14.5px] text-muted-foreground mb-6">It takes less than a minute.</p>

          {/* Step indicator */}
          <div className="mb-2 flex items-center justify-between">
            {STEPS.map((step) => (
              <div key={step.id} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-medium ${
                    currentStep > step.id
                      ? 'border-maroon bg-maroon text-ivory'
                      : currentStep === step.id
                      ? 'border-maroon text-maroon'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? <Check className="h-3 w-3" /> : step.id}
                </span>
                <span
                  className={`text-[11px] font-medium uppercase tracking-[0.14em] ${
                    currentStep >= step.id ? 'text-espresso' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <Progress value={(currentStep / 3) * 100} className="mb-7 h-0.5 bg-sand" />

          <form onSubmit={handleSubmit}>
            {authError && (
              <div className="mb-6 flex items-start gap-3 rounded-sm border border-sale/30 bg-sale/5 p-3.5 text-sale">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Registration error</p>
                  <p className="mt-0.5">{authError}</p>
                </div>
              </div>
            )}

            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-5">
                {/* Avatar Upload */}
                <div className="flex justify-center">
                  <div className="group relative">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-sand">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-espresso/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Upload className="h-6 w-6 text-ivory" />
                      <input
                        type="file"
                        accept={ALLOWED_IMAGE_TYPES.join(',')}
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => setAvatarFile(null)}
                        className="absolute -right-1 -top-1 rounded-full border border-border bg-white p-1"
                        aria-label="Remove photo"
                      >
                        <X className="h-3.5 w-3.5 text-espresso" />
                      </button>
                    )}
                  </div>
                </div>
                {errors.avatar && (
                  <p className="text-center text-[13px] text-sale">{errors.avatar}</p>
                )}

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-2">
                    <Label className={labelClasses}>First Name</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Ananya"
                      className={`${fieldClasses} ${errors.firstName ? errorFieldClasses : ''}`}
                    />
                    {errors.firstName && <FieldError message={errors.firstName} />}
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses}>Last Name</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Sharma"
                      className={`${fieldClasses} ${errors.lastName ? errorFieldClasses : ''}`}
                    />
                    {errors.lastName && <FieldError message={errors.lastName} />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Email Address</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="you@example.com"
                    className={`${fieldClasses} ${errors.email ? errorFieldClasses : ''}`}
                  />
                  {errors.email && <FieldError message={errors.email} />}
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Phone Number</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="9876543210"
                    className={`${fieldClasses} ${errors.phone ? errorFieldClasses : ''}`}
                    maxLength={10}
                  />
                  {errors.phone && <FieldError message={errors.phone} />}
                </div>
              </div>
            )}

            {/* Step 2: Security */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className={labelClasses}>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Minimum 8 characters"
                      className={`${fieldClasses} pr-11 ${errors.password ? errorFieldClasses : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-espresso"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                  {errors.password && <FieldError message={errors.password} />}

                  {/* Password Strength */}
                  {formData.password && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-muted-foreground">Password strength</span>
                        <span
                          className={`text-[12px] font-medium ${
                            passwordStrength < 50
                              ? 'text-sale'
                              : passwordStrength < 75
                              ? 'text-[#8A6414]'
                              : 'text-[#3E6B4F]'
                          }`}
                        >
                          {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-sand">
                        <div
                          className={`h-full transition-all duration-500 ${
                            passwordStrength < 50
                              ? 'bg-sale'
                              : passwordStrength < 75
                              ? 'bg-gold'
                              : 'bg-[#3E6B4F]'
                          }`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Confirm Password</Label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Re-enter your password"
                    className={`${fieldClasses} ${errors.confirmPassword ? errorFieldClasses : ''}`}
                  />
                  {errors.confirmPassword && <FieldError message={errors.confirmPassword} />}
                </div>

                {/* Password Tips */}
                <div className="rounded-sm border border-border bg-blush/60 p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                    Password tips
                  </p>
                  <ul className="space-y-1 text-[13px] text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-gold" /> Use at least 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-gold" /> Mix uppercase & lowercase
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-gold" /> Include numbers & symbols
                    </li>
                  </ul>
                </div>

                {/* Terms Agreement */}
                <div
                  className={`rounded-sm border p-4 ${
                    errors.agreeTerms ? 'border-sale bg-sale/5' : 'border-border bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={agreeTerms}
                      onCheckedChange={(checked) => {
                        setAgreeTerms(checked as boolean);
                        setErrors(prev => ({ ...prev, agreeTerms: '' }));
                      }}
                      className={`mt-0.5 rounded-[1px] data-[state=checked]:border-maroon data-[state=checked]:bg-maroon data-[state=checked]:text-ivory ${
                        errors.agreeTerms ? 'border-sale' : 'border-input'
                      }`}
                    />
                    <div>
                      <Label className="text-[13.5px] font-normal leading-relaxed text-muted-foreground">
                        I agree to the{' '}
                        <Link to="/terms" className="font-medium text-maroon underline underline-offset-[3px]">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="font-medium text-maroon underline underline-offset-[3px]">
                          Privacy Policy
                        </Link>
                      </Label>
                      {errors.agreeTerms && (
                        <div className="mt-2">
                          <FieldError message={errors.agreeTerms} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Address */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className={labelClasses}>Address Line 1</Label>
                  <Input
                    value={formData.address1}
                    onChange={(e) => handleInputChange('address1', e.target.value)}
                    placeholder="House number, street name"
                    className={`${fieldClasses} ${errors.address1 ? errorFieldClasses : ''}`}
                  />
                  {errors.address1 && <FieldError message={errors.address1} />}
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Address Line 2 (Optional)</Label>
                  <Input
                    value={formData.address2}
                    onChange={(e) => handleInputChange('address2', e.target.value)}
                    placeholder="Apartment, suite, landmark"
                    className={fieldClasses}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-2">
                    <Label className={labelClasses}>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      className={`${fieldClasses} ${errors.city ? errorFieldClasses : ''}`}
                    />
                    {errors.city && <FieldError message={errors.city} />}
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses}>State / Region</Label>
                    <Input
                      value={formData.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      placeholder="State or region"
                      className={fieldClasses}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-2">
                    <Label className={labelClasses}>Postal Code</Label>
                    <Input
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="6 digits"
                      className={`${fieldClasses} ${errors.postalCode ? errorFieldClasses : ''}`}
                      maxLength={6}
                    />
                    {errors.postalCode && <FieldError message={errors.postalCode} />}
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClasses}>Country</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className={`${fieldClasses} ${errors.country ? errorFieldClasses : ''}`}
                    />
                    {errors.country && <FieldError message={errors.country} />}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-6">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="h-auto gap-2 rounded-sm px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </Button>
                )}
              </div>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="h-auto rounded-sm bg-maroon px-7 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-ivory hover:bg-terracotta"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-auto rounded-sm bg-maroon px-7 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-ivory hover:bg-terracotta"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              )}
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-maroon underline underline-offset-[3px] hover:text-terracotta"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
