import { Link } from 'react-router-dom';
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  CreditCard,
  Shield,
  Truck,
  Headphones,
  Heart,
  MapPin,
  Phone,
  Clock,
  Leaf,
  Globe,
  ShieldCheck,
  Package,
  ShoppingBag
} from 'lucide-react';
import logo from "../../public/logo.png"

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-gray-50">
      {/* Trust Badges - Modern Design */}
      <div className="bg-gradient-to-r from-[#5E9F50]/5 via-white to-[#E97A48]/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
            {[
              {
                icon: <Truck className="w-6 h-6 text-[#5E9F50]" />,
                title: "Free Shipping",
                desc: "Over ₹999",
                bg: "from-[#5E9F50]/10 to-emerald-50",
                color: "#5E9F50"
              },
              {
                icon: <CreditCard className="w-6 h-6 text-[#E97A48]" />,
                title: "Secure Payment",
                desc: "100% Protected",
                bg: "from-[#E97A48]/10 to-orange-50",
                color: "#E97A48"
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-[#5E9F50]" />,
                title: "Quality Guarantee",
                desc: "Authentic Products",
                bg: "from-[#5E9F50]/10 to-emerald-50",
                color: "#5E9F50"
              },
              {
                icon: <Headphones className="w-6 h-6 text-[#E97A48]" />,
                title: "24/7 Support",
                desc: "Always Available",
                bg: "from-[#E97A48]/10 to-orange-50",
                color: "#E97A48"
              }
            ].map((item, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm md:text-base">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
     <div className="relative flex justify-center sm:justify-start">
  <img
    src={logo}
    alt="mizorpaymart logo"
    className="
      relative z-10
      w-56 sm:w-40 md:w-48 lg:w-56
      h-auto
      object-contain
      hover:scale-105
      transition-transform duration-300
    "
  />
</div>

        
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed mb-8 border-l-2 border-[#5E9F50] pl-4 py-2">
                Your trusted destination for quality products with exceptional service.
                We bring you the best with reliability you can count on.
              </p>
            </div>

            {/* Contact Info */}
            <div className="mb-8">
              <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#5E9F50]" />
                Contact Information
              </h5>
              <div className="space-y-3 bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#5E9F50]/10 to-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-[#5E9F50]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Address</p>
                    <p className="text-xs text-gray-500 mt-1">
                      PLOT NO 69-71, BP, <br/>FARIDABAD,Factory Area Faridabad Faridabad,Faridabad-121001,Haryana
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#5E9F50]/10 to-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-[#5E9F50]" />
                  </div>
                  <p className="text-sm text-gray-600">GSTIN: 06AAQCM6479G1ZV</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#5E9F50]/10 to-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-[#5E9F50]" />
                  </div>
                  <p className="text-sm text-gray-600">CIN: U47912HR2023OPC109999</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#E97A48]/10 to-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-[#E97A48]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Phone</p>
                    <p className="text-sm text-gray-600">+91 85275 96413</p>
                  </div>
                </div>
                
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-4">Stay Connected</h5>
              <div className="flex gap-3">
                {[
                  { 
                    icon: <Facebook className="w-5 h-5" />, 
                    href: "https://www.facebook.com/people/Mizorpay-Mart/pfbid02rosnqsdZw84jhf94sxwZzQ9NNK55g212k3mDNTMC4UJMd6k49e5P4HckwGYaavUJl/",
                    bg: "hover:bg-[#1877F2]",
                    color: "text-[#1877F2]"
                  },
                  { 
                    icon: <Instagram className="w-5 h-5" />, 
                    href: "https://www.instagram.com/mizorpaymart09/",
                    bg: "hover:bg-gradient-to-r hover:from-purple-600 hover:via-pink-600 hover:to-orange-400",
                    color: "text-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-400 bg-clip-text"
                  },
                  { 
                    icon: <Mail className="w-5 h-5" />, 
                    href: "mailto:support@mizorpaymart.in",
                    bg: "hover:bg-gray-800",
                    color: "text-gray-600"
                  },
                  { 
                    icon: <Linkedin className="w-5 h-5" />, 
                    href: "https://www.linkedin.com/in/mizorpay-mart-undefined-5969543a8/",
                    bg: "hover:bg-[#0A66C2]",
                    color: "text-[#0A66C2]"
                  }
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center transition-all duration-300 ${social.bg} hover:scale-110 hover:shadow-lg group`}
                  >
                    <span className={`${social.color} group-hover:text-white transition-colors`}>
                      {social.icon}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="bg-gradient-to-r from-[#5E9F50] to-[#E97A48] w-12 h-1 rounded-full mb-4"></div>
            <h4 className="font-bold text-gray-900 mb-6 text-xl flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#E97A48]" />
              Shop With Us
            </h4>
            <ul className="space-y-3">
                          {[
                            { path: "/", label: "Home" },
                            { path: "/products", label: "All Products" },
                            { path: "/new-arrivals", label: "New Arrivals" },
                            { path: "/best-sellers", label: "Best Sellers" },
                         
                          ].map((link) => (
                            <li key={link.path}>
                              <Link
                                to={link.path}
                                className="text-gray-600 hover:text-[#E97A48] transition-all duration-300 text-sm flex items-center gap-2 group"
                              >
                                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-[#E97A48] group-hover:scale-125 transition-all"></div>
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

          {/* Customer Service */}
          <div>
            <div className="bg-gradient-to-r from-[#5E9F50] to-[#E97A48] w-12 h-1 rounded-full mb-4"></div>
            <h4 className="font-bold text-gray-900 mb-6 text-xl flex items-center gap-2">
              <Headphones className="w-5 h-5 text-[#5E9F50]" />
              Customer Support
            </h4>
            <ul className="space-y-3">
              {[
                { path: "/contact-us", label: "Contact Us" },
                   { path: "/about", label: "About Us" },
              ].map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-gray-600 hover:text-[#5E9F50] transition-all duration-300 text-sm flex items-center gap-2 group"
                  >
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-[#5E9F50] group-hover:scale-125 transition-all"></div>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <div className="bg-gradient-to-r from-[#5E9F50] to-[#E97A48] w-12 h-1 rounded-full mb-4"></div>
            <h4 className="font-bold text-gray-900 mb-6 text-xl flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#5E9F50]" />
              Legal & Policies
            </h4>
            <ul className="space-y-3">
              {[
                { path: "/privacy-policy", label: "Privacy Policy" },
                { path: "/terms-conditions", label: "Terms & Conditions" },
                { path: "/refund-policy", label: "Return Policy" },
                { path: "/shipping-delivery-policy", label: "Shipping Policy" },
                { path: "/data-retention-policy", label: "Data Retention Policy" },
              ].map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-gray-600 hover:text-[#E97A48] transition-all duration-300 text-sm flex items-center gap-2 group"
                  >
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-[#E97A48] group-hover:scale-125 transition-all"></div>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-[#5E9F50] to-[#E97A48] rounded-full"></div>
                <p className="text-gray-600">
                  &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-900">MizorPayMart</span>
                </p>
              </div>
              <p className="text-gray-500">All rights reserved.</p>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <span className="text-gray-500 text-sm font-medium">Secure Payments:</span>
              <div className="flex gap-2">
                {[
                  { label: "VISA", color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Mastercard", color: "text-red-600", bg: "bg-red-50" },
                  { label: "UPI", color: "text-[#5E9F50]", bg: "bg-emerald-50" },
                  { label: "COD", color: "text-gray-700", bg: "bg-gray-50" }
                ].map((method, index) => (
                  <div 
                    key={index} 
                    className={`w-14 h-9 ${method.bg} border border-gray-200 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-300`}
                  >
                    <span className={`text-xs font-bold ${method.color}`}>
                      {method.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

      
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;