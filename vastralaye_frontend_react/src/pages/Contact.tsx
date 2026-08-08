import { useState, useRef } from "react";
import emailjs from "@emailjs/browser";
import {
  Mail,
  Phone,
  User,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Send,
  MapPin,
  Loader2, Store
} from "lucide-react";

type MessageType =
  | "Select Type"
  | "Complaint"
  | "Refund Complaint"
  | "Product Complaint"
  | "Feedback"
  | "General Inquiry"
  | "Payment"
  | "Returns"
  | "Delivery";

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  type?: string;
  message?: string;
}

const Contact = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    type: "Select Type" as MessageType,
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // EmailJS Configuration
  const EMAILJS_SERVICE_ID = "service_j02nkfo"; // Replace with your EmailJS service ID
  const EMAILJS_TEMPLATE_ID = "template_44y0te3"; // Replace with your EmailJS template ID
  const EMAILJS_PUBLIC_KEY = "DCImCt-wq6AGDvlKr"; // Replace with your EmailJS public key

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Name cannot exceed 50 characters";
    }

    // Phone validation for Indian numbers
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile numbers
    const phoneWithCountryCode = /^\+91[6-9]\d{9}$/;

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      // Remove spaces and check format
      const cleanPhone = formData.phone.replace(/\s/g, '');

      // Check if it starts with +91
      if (cleanPhone.startsWith('+91')) {
        if (!phoneWithCountryCode.test(cleanPhone)) {
          newErrors.phone = "Please enter a valid Indian phone number with +91";
        } else if (cleanPhone.length !== 13) {
          newErrors.phone = "Phone number should be 10 digits after +91";
        }
      } else {
        // Check without country code
        if (!phoneRegex.test(cleanPhone)) {
          newErrors.phone = "Please enter a valid 10-digit Indian phone number";
        } else if (cleanPhone.length !== 10) {
          newErrors.phone = "Phone number must be 10 digits";
        }
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.email.length > 100) {
      newErrors.email = "Email cannot exceed 100 characters";
    }

    // Message type validation
    if (formData.type === "Select Type") {
      newErrors.type = "Please select a message type";
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (formData.message.length > 1000) {
      newErrors.message = "Message cannot exceed 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    // Validate single field on blur
    if (errors[field as keyof FormErrors]) {
      const newErrors = { ...errors };
      delete newErrors[field as keyof FormErrors];
      setErrors(newErrors);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Mark field as touched
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleTypeSelect = (type: MessageType) => {
    setFormData(prev => ({ ...prev, type }));
    if (errors.type) {
      setErrors(prev => ({ ...prev, type: undefined }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Auto-format as user types
    const digits = value.replace(/\D/g, '');

    if (digits.length <= 10) {
      if (digits.length === 0) {
        value = '';
      } else if (digits.length <= 5) {
        value = digits;
      } else {
        value = `${digits.substring(0, 5)} ${digits.substring(5, 10)}`;
      }
    } else if (digits.length <= 12) {
      value = `+91 ${digits.substring(2, 7)} ${digits.substring(7)}`;
    }

    setFormData(prev => ({ ...prev, phone: value }));

    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }

    if (!touched.phone) {
      setTouched(prev => ({ ...prev, phone: true }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    // Mark all fields as touched
    setTouched({
      name: true,
      phone: true,
      email: true,
      type: true,
      message: true
    });

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if EmailJS is initialized properly
      if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        throw new Error("EmailJS configuration is missing. Please add your EmailJS credentials.");
      }

      // Prepare template parameters
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        phone_number: formData.phone,
        message_type: formData.type,
        message: formData.message,
        to_email: getRelevantEmail(formData.type),
        to_name: "Mizorpay Mart Support",
        reply_to: formData.email,
        date: new Date().toLocaleString(),
      };

      console.log("Sending email with params:", templateParams);

      // Send email using EmailJS
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log("Email sent successfully:", result.text);

      // Reset form on successful submission
      setFormData({
        name: "",
        phone: "",
        email: "",
        type: "Select Type",
        message: "",
      });
      setTouched({});
      setErrors({});
      setIsSubmitted(true);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);

    } catch (error) {
      console.error("Failed to send email:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again later."
      );

      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setSubmitError("");
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get relevant email based on message type
  const getRelevantEmail = (type: MessageType): string => {
    switch (type) {
      case "Complaint":
      case "Product Complaint":
        return "complaints@mizorpaymart.in";
      case "Refund Complaint":
        return "refund@mizorpaymart.in";
      case "Payment":
        return "sales@mizorpaymart.in";
      case "Delivery":
        return "support@mizorpaymart.in";
      case "Returns":
        return "refund@mizorpaymart.in";
      case "Feedback":
        return "contact@mizorpaymart.in";
      case "General Inquiry":
        return "info@mizorpaymart.in";
      default:
        return "contact@mizorpaymart.in";
    }
  };

  const messageTypes: MessageType[] = [
    "General Inquiry",
    "Complaint",
    "Refund Complaint",
    "Product Complaint",
    "Payment",
    "Delivery",
    "Returns",
    "Feedback"
  ];

  const getFieldClassName = (fieldName: keyof FormErrors, isTextarea = false) => {
    const hasError = errors[fieldName] && touched[fieldName];
    const baseClass = `w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 ${isTextarea ? 'resize-none' : ''
      }`;

    if (hasError) {
      return `${baseClass} border-red-300 focus:ring-red-200 bg-red-50`;
    }
    return `${baseClass} border-border focus:ring-gold/40 focus:border-gold`;
  };

  return (
    <div className="min-h-screen bg-ivory py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <span className="overline-label mb-2">Contact</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso mb-4">
            Get in Touch
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            All fields are required. Fill out the form below and our team will get back to you within 24 hours.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-border p-8">
            <h2 className="font-serif text-xl font-medium text-espresso mb-8">
              Contact Information
            </h2>

            <div className="space-y-6 pb-5">
              <div className="flex items-start space-x-4">
                <div className="bg-blush p-3 rounded-lg">
                  <Store className="w-6 h-6 text-maroon" />
                </div>
                <div>
                  <h3 className="font-medium text-espresso">Legal Company Name</h3>
                  <p className="text-sm text-muted-foreground">
                    MIZORPAY SOLUTION<br />(OPC) PRIVATE LIMITED
                  </p>
                </div>
              </div>
            </div>


            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blush p-3 rounded-lg">
                  <Phone className="w-6 h-6 text-maroon" />
                </div>
                <div>
                  <h3 className="font-medium text-espresso">Phone Support</h3>
                  <p className="text-muted-foreground">+91 85275 96413</p>
                  <p className="text-sm text-muted-foreground">Mon-Fri 9am-6pm</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blush p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-maroon" />
                </div>
                <div>
                  <h3 className="font-medium text-espresso">Department Emails</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">General Inquiries</p>
                      <a href="mailto:info@mizorpaymart.in" className="block text-sm text-muted-foreground hover:text-maroon transition-colors">
                        info@mizorpaymart.com
                      </a>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Support</p>
                      <a href="mailto:support@mizorpaymart.in" className="block text-sm text-muted-foreground hover:text-maroon transition-colors">
                        support@mizorpaymart.com
                      </a>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Complaints</p>
                      <a href="mailto:complaints@mizorpaymart.in" className="block text-sm text-muted-foreground hover:text-maroon transition-colors">
                        complaints@mizorpaymart.com
                      </a>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Refunds</p>
                      <a href="mailto:refund@mizorpaymart.in" className="block text-sm text-muted-foreground hover:text-maroon transition-colors">
                        refund@mizorpaymart.com
                      </a>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Legal</p>
                      <a href="mailto:legal@mizorpaymart.in" className="block text-sm text-muted-foreground hover:text-maroon transition-colors">
                        legal@mizorpaymart.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blush p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-maroon" />
                </div>
                <div>
                  <h3 className="font-medium text-espresso">Address</h3>
                  <p className="text-muted-foreground"> PLOT NO 69-71, <br />OM SHUBHAM TOWER, BP, </p> <p className="text-muted-foreground"> Faridabad, Faridabad, </p> <p className="text-muted-foreground"> Haryana – 121001 </p>
                </div>
              </div>

              <div className="mt-6 w-full h-[300px] rounded-lg overflow-hidden border border-border">
                <iframe
                  title="Mizorpay Mart Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d112306.01439054766!2d77.31907425!3d28.40226565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cdc15f5a424b1%3A0xe4f50576c850e0f2!2sFaridabad%2C%20Haryana!5e0!3m2!1sen!2sin!4v1769501410330!5m2!1sen!2sin"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg border border-border p-8">
            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blush rounded-full mb-6">
                  <CheckCircle className="w-8 h-8 text-maroon" />
                </div>
                <h3 className="font-serif text-xl font-medium text-espresso mb-3">
                  Message Sent Successfully!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Thank you for contacting us. We'll get back to you shortly.
                </p>
                <p className="text-sm text-muted-foreground">
                  Your message has been sent to: {getRelevantEmail(formData.type)}
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-serif text-xl font-medium text-espresso mb-2">
                  Send us a Message
                </h2>
                <p className="text-muted-foreground mb-8">
                  All fields are required. Please fill in all details.
                </p>

                {submitError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center text-red-700">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      <p className="font-medium">Error: {submitError}</p>
                    </div>
                  </div>
                )}

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-espresso mb-2">
                      <User className="w-4 h-4 mr-2" />
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={() => handleBlur('name')}
                      placeholder="Your Full Name"
                      className={getFieldClassName('name')}
                      maxLength={50}
                    />
                    <div className="flex justify-between items-center mt-2">
                      {errors.name && touched.name ? (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.name}
                        </p>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {formData.name.length > 0 ? `${formData.name.length}/50` : "Required"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Phone */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-espresso mb-2">
                        <Phone className="w-4 h-4 mr-2" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        onBlur={() => handleBlur('phone')}
                        placeholder="+91 12345 67890"
                        className={getFieldClassName('phone')}
                        maxLength={14}
                      />
                      {errors.phone && touched.phone && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-espresso mb-2">
                        <Mail className="w-4 h-4 mr-2" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={() => handleBlur('email')}
                        placeholder="email@example.com"
                        className={getFieldClassName('email')}
                        maxLength={100}
                      />
                      {errors.email && touched.email && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message Type */}
                  <div>
                    <label className="text-sm font-medium text-espresso mb-2 block">
                      Message Type *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {messageTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleTypeSelect(type)}
                          className={`px-4 py-3 rounded-lg border transition-all text-sm ${formData.type === type
                            ? "bg-blush border-maroon text-maroon"
                            : "border-border text-muted-foreground hover:border-gold hover:bg-ivory"
                            }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      {errors.type && touched.type ? (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.type}
                        </p>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Will be sent to: {getRelevantEmail(formData.type)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-espresso mb-2">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={() => handleBlur('message')}
                      rows={5}
                      placeholder="Please describe your issue in detail..."
                      className={getFieldClassName('message', true)}
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center mt-2">
                      {errors.message && touched.message ? (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.message}
                        </p>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {formData.message.length > 0 ? `${formData.message.length}/1000` : "Minimum 10 characters"}
                        </span>
                      )}
                      <span className={`text-sm ${formData.message.length < 10 ? "text-muted-foreground" :
                        formData.message.length > 800 ? "text-sale" :
                          formData.message.length > 500 ? "text-terracotta" :
                            "text-gold"
                        }`}>
                        {formData.message.length}/1000
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-maroon text-ivory py-4 rounded-lg font-medium hover:bg-terracotta transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>

                  <p className="text-center text-sm text-muted-foreground">
                    By submitting this form, you agree to our{" "}
                    <a href="/privacy-policy" className="text-maroon hover:underline">
                      Privacy Policy
                    </a>
                    {" "}and{" "}
                    <a href="/terms-conditions" className="text-maroon hover:underline">
                      Terms of Service
                    </a>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;