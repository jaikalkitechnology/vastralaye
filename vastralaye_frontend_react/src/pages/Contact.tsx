import { useState, useRef } from "react";
import { api } from "@/api/api";
import {
  Mail,
  Phone,
  User,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Send,
  MapPin,
  Loader2,
  Store,
  Clock,
  MessageCircle,
} from "lucide-react";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/motion/Reveal";
import { useSiteSettings } from "@/hooks/use-site-settings";

/**
 * Contact — editorial split: admin-controlled page banner on top (same
 * system as the catalogue pages, Admin › Banners → Page banners), the
 * enquiry form beside a contact card.
 *
 * Submissions post to our own API, which stores the enquiry and then emails
 * it on. The store is the record: if the mail server is misconfigured the
 * enquiry is still in Admin › Enquiries, which is not true of sending
 * straight from the browser to a third-party mailer.
 */

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
}

const Contact = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const settings = useSiteSettings();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const phoneNumber = settings.call_number?.trim() || "+91 85275 96413";
  const whatsapp = settings.whatsapp_number?.trim() || "";

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
      message: true
    });

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/fronted/contact", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });

      // Reset form on successful submission
      setFormData({
        name: "",
        phone: "",
        email: "",
        message: "",
      });
      setTouched({});
      setErrors({});
      setIsSubmitted(true);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);

    } catch (error: any) {
      console.error("Failed to send message:", error);
      setSubmitError(
        // The API explains what's wrong with the input; anything else is ours.
        error?.response?.data?.detail ||
          "Failed to send message. Please try again later."
      );

      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setSubmitError("");
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldClassName = (fieldName: keyof FormErrors, isTextarea = false) => {
    const hasError = errors[fieldName] && touched[fieldName];
    const baseClass = `w-full rounded-sm border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 ${isTextarea ? 'resize-none' : ''
      }`;

    if (hasError) {
      return `${baseClass} border-red-300 focus:ring-red-200 bg-red-50`;
    }
    return `${baseClass} border-border focus:ring-gold/40 focus:border-gold`;
  };

  const infoRow = "flex items-start gap-4";
  const infoIcon = "shrink-0 w-10 h-10 bg-blush rounded-sm flex items-center justify-center";

  return (
    <div className="min-h-screen bg-ivory">
      {/* Admin-controlled banner — Admin › Banners → Page banners → Contact Us */}
      <PageBanner
        title="Get in Touch"
        subtitle="Questions, orders, sizing — we reply within one business day"
        crumb="Contact"
        page="contact"
      />

      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 lg:gap-8 items-start">

          {/* ── Contact card ── */}
          <Reveal>
          <aside className="bg-white border border-border rounded-sm p-7">
            <span className="overline-label mb-2">Reach us</span>
            <h2 className="font-serif text-2xl font-medium text-espresso mb-7">
              Talk to <span className="italic text-maroon">Vastraliya</span>
            </h2>

            <div className="space-y-6">
              <div className={infoRow}>
                <div className={infoIcon}>
                  <Store className="w-4.5 h-4.5 text-maroon" strokeWidth={1.6} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-espresso">Company</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Vastraliya Fashion Private Limited
                  </p>
                </div>
              </div>

              <div className={infoRow}>
                <div className={infoIcon}>
                  <Phone className="w-4.5 h-4.5 text-maroon" strokeWidth={1.6} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-espresso">Phone</h3>
                  <a
                    href={`tel:${phoneNumber.replace(/\s/g, "")}`}
                    className="mt-1 block text-sm text-muted-foreground hover:text-maroon transition-colors"
                  >
                    {phoneNumber}
                  </a>
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-maroon transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp us
                    </a>
                  )}
                </div>
              </div>

              <div className={infoRow}>
                <div className={infoIcon}>
                  <Clock className="w-4.5 h-4.5 text-maroon" strokeWidth={1.6} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-espresso">Hours</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Monday – Friday, 9am – 6pm IST
                  </p>
                </div>
              </div>

              <div className={infoRow}>
                <div className={infoIcon}>
                  <MapPin className="w-4.5 h-4.5 text-maroon" strokeWidth={1.6} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-espresso">Address</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Plot No 69-71, Om Shubham Tower,<br />
                    Faridabad, Haryana – 121001
                  </p>
                </div>
              </div>

              <div className={infoRow}>
                <div className={infoIcon}>
                  <Mail className="w-4.5 h-4.5 text-maroon" strokeWidth={1.6} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-espresso">Prefer writing?</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    The form here lands straight in our inbox — we reply within
                    one business day.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 h-[220px] rounded-sm overflow-hidden border border-sand">
              <iframe
                title="Vastraliya, Faridabad"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d112306.01439054766!2d77.31907425!3d28.40226565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cdc15f5a424b1%3A0xe4f50576c850e0f2!2sFaridabad%2C%20Haryana!5e0!3m2!1sen!2sin!4v1769501410330!5m2!1sen!2sin"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </aside>
          </Reveal>

          {/* ── Form ── */}
          <Reveal delay={0.1}>
          <div className="bg-white border border-border rounded-sm p-7 md:p-9">
            {isSubmitted ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blush rounded-full mb-6">
                  <CheckCircle className="w-8 h-8 text-maroon" />
                </div>
                <h3 className="font-serif text-2xl font-medium text-espresso mb-3">
                  Message sent
                </h3>
                <p className="text-muted-foreground mb-2">
                  Thank you for writing to us — we'll get back to you shortly.
                </p>
                <p className="text-sm text-muted-foreground">
                  We usually reply within one business day.
                </p>
              </div>
            ) : (
              <>
                <span className="overline-label mb-2">Enquiry</span>
                <h2 className="font-serif text-2xl font-medium text-espresso mb-1.5">
                  Send us a message
                </h2>
                <p className="text-sm text-muted-foreground mb-7">
                  All fields are required — we'll reply to the email you give here.
                </p>

                {submitError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm">
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
                      placeholder="Tell us about your order, sizing question, or anything else…"
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
                    className="w-full bg-maroon text-ivory py-4 rounded-sm text-xs font-semibold uppercase tracking-[0.16em] hover:bg-terracotta transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
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
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default Contact;
