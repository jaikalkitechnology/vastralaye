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
  CheckCircle, 
  AlertCircle, 
  User, 
  ShieldCheck,
  Mail,
  Lock,
  MapPin,
  Building,
  Phone,
  ChevronRight,
  Sparkles,
  Check,
  ArrowLeft
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

// Constants
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];

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
    if (success) navigate('/login');
  };

  if (isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E97A48]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#5E9F50]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-gradient-radial from-[#E97A48]/10 via-transparent to-transparent" />
      </div>

      <div className="max-w-5xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-[#E97A48] to-[#5E9F50] rounded-3xl flex items-center justify-center shadow-xl shadow-[#E97A48]/20">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-[#5E9F50]" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">
            Create Account
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Join thousands of happy customers shopping with us
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Progress Steps */}
          <div className="px-8 pt-8">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center relative">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${currentStep >= step.id 
                        ? 'bg-gradient-to-r from-[#E97A48] to-[#5E9F50] text-white shadow-lg shadow-[#E97A48]/30' 
                        : 'bg-gray-100 text-gray-400'}
                    `}>
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`mt-2 text-sm font-medium transition-colors ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="flex-1 h-1 mx-4">
                      <div className={`
                        h-full rounded-full transition-all duration-500
                        ${currentStep > step.id 
                          ? 'bg-gradient-to-r from-[#E97A48] to-[#5E9F50]' 
                          : 'bg-gray-200'}
                      `} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Progress value={(currentStep / 3) * 100} className="h-1 bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {authError && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Registration Error</p>
                    <p className="text-red-600 text-sm mt-1">{authError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
                  <p className="text-gray-600">Tell us a bit about yourself</p>
                </div>

                {/* Avatar Upload */}
                <div className="flex items-center justify-center mb-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex items-center justify-center border-4 border-white shadow-xl">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                    <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload className="w-8 h-8 text-white" />
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
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-lg hover:shadow-xl transition-shadow"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
                {errors.avatar && (
                  <p className="text-center text-red-500 text-sm">{errors.avatar}</p>
                )}

                {/* Name Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">First Name</Label>
                    <div className="relative">
                      <Input
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="John"
                        className={`pl-12 ${errors.firstName ? 'border-red-300 focus:border-red-500' : 'focus:border-[#E97A48]'}`}
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {errors.firstName && (
                      <p className="text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Last Name</Label>
                    <div className="relative">
                      <Input
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Doe"
                        className={`pl-12 ${errors.lastName ? 'border-red-300 focus:border-red-500' : 'focus:border-[#E97A48]'}`}
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {errors.lastName && (
                      <p className="text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Email Address</Label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john@example.com"
                        className={`pl-12 ${errors.email ? 'border-red-300 focus:border-red-500' : 'focus:border-[#E97A48]'}`}
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Phone Number</Label>
                    <div className="relative">
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="9876543210"
                        className={`pl-12 ${errors.phone ? 'border-red-300 focus:border-red-500' : 'focus:border-[#E97A48]'}`}
                        maxLength={10}
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Security */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Security</h2>
                  <p className="text-gray-600">Create a strong password to protect your account</p>
                </div>

                {/* Password Fields */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Create a strong password"
                          className={`pl-12 ${errors.password ? 'border-red-300 focus:border-red-500' : 'focus:border-[#E97A48]'}`}
                        />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-sm flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" /> {errors.password}
                        </p>
                      )}

                      {/* Password Strength */}
                      {formData.password && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Password strength</span>
                            <span className={`text-sm font-medium ${
                              passwordStrength < 50 ? 'text-red-500' :
                              passwordStrength < 75 ? 'text-yellow-500' : 'text-[#5E9F50]'
                            }`}>
                              {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Good' : 'Strong'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                passwordStrength < 50 ? 'bg-red-500' :
                                passwordStrength < 75 ? 'bg-yellow-500' : 'bg-[#5E9F50]'
                              }`}
                              style={{ width: `${passwordStrength}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Password Tips */}
                    <div className="bg-blue-50/50 rounded-2xl p-4">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Password Tips
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#5E9F50]" />
                          Use at least 8 characters
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#5E9F50]" />
                          Mix uppercase & lowercase
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#5E9F50]" />
                          Include numbers & symbols
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Re-enter your password"
                          className={`pl-12 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'focus:border-[#E97A48]'}`}
                        />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    {/* Terms Agreement */}
                    <div className={`p-5 rounded-2xl border-2 transition-all ${errors.agreeTerms ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={agreeTerms}
                          onCheckedChange={(checked) => {
                            setAgreeTerms(checked as boolean);
                            setErrors(prev => ({ ...prev, agreeTerms: '' }));
                          }}
                          className={`mt-1 data-[state=checked]:bg-[#5E9F50] ${errors.agreeTerms ? 'border-red-400' : 'border-gray-300'}`}
                        />
                        <div>
                          <Label className="text-gray-700">
                            I agree to the{' '}
                            <Link to="/terms" className="text-[#E97A48] hover:text-[#d86a38] font-semibold">
                              Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="text-[#E97A48] hover:text-[#d86a38] font-semibold">
                              Privacy Policy
                            </Link>
                          </Label>
                          {errors.agreeTerms && (
                            <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                              <AlertCircle className="w-3 h-3" /> {errors.agreeTerms}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Address */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Address</h2>
                  <p className="text-gray-600">Where should we deliver your orders?</p>
                </div>

                <div className="space-y-6">
                  {/* Address Line 1 */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Address Line 1</Label>
                    <div className="relative">
                      <Input
                        value={formData.address1}
                        onChange={(e) => handleInputChange('address1', e.target.value)}
                        placeholder="House number, street name"
                        className={`pl-12 ${errors.address1 ? 'border-red-300 focus:border-red-500' : 'focus:border-[#E97A48]'}`}
                      />
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {errors.address1 && (
                      <p className="text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> {errors.address1}
                      </p>
                    )}
                  </div>

                  {/* Address Line 2 */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Address Line 2 (Optional)</Label>
                    <div className="relative">
                      <Input
                        value={formData.address2}
                        onChange={(e) => handleInputChange('address2', e.target.value)}
                        placeholder="Apartment, suite, landmark"
                        className="pl-12 focus:border-[#E97A48]"
                      />
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* City, Region, Postal */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">City</Label>
                      <div className="relative">
                        <Input
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="City"
                          className={`pl-12 ${errors.city ? 'border-red-300 focus:border-red-500' : 'focus:border-[#E97A48]'}`}
                        />
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      {errors.city && (
                        <p className="text-red-500 text-sm flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" /> {errors.city}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">State/Region</Label>
                      <div className="relative">
                        <Input
                          value={formData.region}
                          onChange={(e) => handleInputChange('region', e.target.value)}
                          placeholder="State or region"
                          className="pl-12 focus:border-[#E97A48]"
                        />
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Postal Code</Label>
                      <div className="relative">
                        <Input
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          placeholder="6 digits"
                          className={`pl-12 ${errors.postalCode ? 'border-red-300 focus:border-red-500' : 'focus:border-[#E97A48]'}`}
                          maxLength={6}
                        />
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      {errors.postalCode && (
                        <p className="text-red-500 text-sm flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" /> {errors.postalCode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Country</Label>
                    <div className="relative">
                      <Input
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className={`pl-12 ${errors.country ? 'border-red-300 focus:border-red-500' : 'focus:border-[#E97A48]'}`}
                      />
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {errors.country && (
                      <p className="text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> {errors.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="gap-2 border-gray-300 hover:border-gray-400 text-gray-700"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Already have an account?
                </Link>
                
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="px-8 gap-2 bg-gradient-to-r from-[#E97A48] to-[#5E9F50] hover:from-[#d86a38] hover:to-[#4d8f40] text-white shadow-lg shadow-[#E97A48]/20"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-8 gap-2 bg-gradient-to-r from-[#E97A48] to-[#5E9F50] hover:from-[#d86a38] hover:to-[#4d8f40] text-white shadow-lg shadow-[#E97A48]/20"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Complete Registration
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Security Assurance */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm border border-gray-200">
            <ShieldCheck className="w-5 h-5 text-[#5E9F50]" />
            <span className="text-sm text-gray-600">
              Your data is encrypted and securely stored. We never share your information.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;